import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { OrganizationProvider } from './lib/organization';
import { ProjectProvider } from './lib/project';
import { DemoProvider, useDemo } from './lib/demo';
import OrganizationGate from './components/OrganizationGate';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import SprintPage from './pages/SprintPage';
import JoinOrgPage from './pages/JoinOrgPage';
import JoinRequestsPage from './pages/JoinRequestsPage';
import OrgGraphPage from './pages/OrgGraphPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  if (!user && !isDemo) return <Navigate to="/login" replace />;
  return (
    <OrganizationProvider>
      <OrganizationGate>
        <ProjectProvider>{children}</ProjectProvider>
      </OrganizationGate>
    </OrganizationProvider>
  );
}

/** Platform Admin routes use a completely separate token/guard — never
 * routed through OrganizationProvider/OrganizationGate, matching the
 * backend's structurally separate auth tier. */
function AdminRoute({ children }: { children: React.ReactElement }) {
  const hasAdminToken = !!localStorage.getItem('tf_admin_token');
  if (!hasAdminToken) return <Navigate to="/admin/login" replace />;
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  if (user || isDemo) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/join" element={<JoinOrgPage />} />
      <Route path="/dashboard" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
      <Route path="/board" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
      <Route path="/projects/:projectId/sprints" element={<PrivateRoute><SprintPage /></PrivateRoute>} />
      <Route path="/organization/requests" element={<PrivateRoute><JoinRequestsPage /></PrivateRoute>} />
      <Route path="/organization/graph" element={<PrivateRoute><OrgGraphPage /></PrivateRoute>} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </DemoProvider>
  );
}
