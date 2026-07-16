import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from './api';
import { isDemoMode } from './demo';

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  status: string;
}

interface ActivateResponse {
  accessToken: string;
  organizationId: string;
  roleCode: string;
}

interface OrganizationContextValue {
  organizations: OrganizationSummary[];
  activeOrganizationId: string | null;
  activeRoleCode: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createOrganization: (name: string) => Promise<OrganizationSummary>;
  activate: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(
    () => localStorage.getItem('tf_active_org_id')
  );
  const [activeRoleCode, setActiveRoleCode] = useState<string | null>(
    () => localStorage.getItem('tf_active_role')
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fully guarded: never throws, never produces an unhandled rejection.
   * In demo mode this never touches the network at all — the api.ts
   * interceptor would handle it anyway, but this is a second, explicit
   * guard so demo mode is provably backend-independent, per the product
   * requirement that the frontend must run standalone with zero backend
   * calls in guest mode.
   */
  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const orgs = await api.get<OrganizationSummary[]>('/organizations');
      setOrganizations(orgs);
    } catch (e) {
      // A logged-in user with no reachable backend should see a clear,
      // recoverable state — never a crashed page or console-only failure.
      setError(e instanceof Error ? e.message : 'Could not reach the server.');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createOrganization(name: string): Promise<OrganizationSummary> {
    const org = await api.post<OrganizationSummary>('/organizations', { name });
    setOrganizations(orgs => [...orgs, org]);
    return org;
  }

  async function activate(organizationId: string) {
    const res = await api.post<ActivateResponse>(`/organizations/${organizationId}/activate`);
    localStorage.setItem('tf_org_token', res.accessToken);
    localStorage.setItem('tf_active_org_id', res.organizationId);
    localStorage.setItem('tf_active_role', res.roleCode);
    setActiveOrganizationId(res.organizationId);
    setActiveRoleCode(res.roleCode);
  }

  return (
    <OrganizationContext.Provider
      value={{ organizations, activeOrganizationId, activeRoleCode, loading, error, refresh, createOrganization, activate }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
}
