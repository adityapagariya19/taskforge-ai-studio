import { interceptDemo } from './demo';

const BASE_URL = 'http://localhost:8080/api/v1';

/**
 * Token priority: org-scoped token > identity-only token, EXCEPT for
 * /admin/* paths (other than /admin/auth/*), which use the separate
 * platform-admin token — mirroring the backend's structurally distinct
 * auth tier (see JwtService.generatePlatformAdminToken). Sending the wrong
 * token type to an admin endpoint must fail exactly like it does server-side.
 */
function getToken(path: string): string | null {
  if (path.startsWith('/admin') && !path.startsWith('/admin/auth')) {
    return localStorage.getItem('tf_admin_token');
  }
  return localStorage.getItem('tf_org_token') || localStorage.getItem('tf_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Demo mode interceptor — never reaches the network
  const intercepted = interceptDemo(method, path, body);
  if (intercepted.handled) {
    await new Promise(r => setTimeout(r, 60)); // tiny delay so loading states show
    return intercepted.data as T;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken(path);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

/**
 * Binary download (zip files). Demo mode is handled entirely by the
 * caller (see AIPanel.tsx), which builds a real client-side zip via
 * lib/zip.ts — this function only covers the real-backend path.
 */
async function downloadBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getToken(path);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
}

export const api = {
  get:  <T>(path: string)                 => request<T>('GET',    path),
  post: <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  patch:<T>(path: string, body?: unknown) => request<T>('PATCH',  path, body),
  put:  <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  del:  <T>(path: string)                 => request<T>('DELETE', path),
  downloadBlob,
};
