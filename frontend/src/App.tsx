// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { ThemeToggle } from './components/ThemeToggle';
import { DashboardPage } from './pages/DashboardPage';
import { ApiDetailPage } from './pages/ApiDetailPage';
import { EndpointEditorPage } from './pages/EndpointEditorPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspaceMembersPage } from './pages/WorkspaceMembersPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { TwoFactorAuthPage } from './pages/TwoFactorAuthPage';
import { OpenApiImportPage } from './pages/OpenApiImportPage';
import { WebhooksPage } from './pages/WebhooksPage';
import { GraphQLTesterPage } from './pages/GraphQLTesterPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import './App.css';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <div>
            <h1>🎭 Mock API Studio</h1>
            <p className="header-subtitle">Design, manage and serve mock APIs</p>
          </div>
          <nav className="nav">
            {isAuthenticated && (
              <>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                  Dashboard
                </Link>
                <Link to="/import-openapi" className={location.pathname === '/import-openapi' ? 'active' : ''}>
                  Import OpenAPI
                </Link>
                <Link to="/graphql-tester" className={location.pathname === '/graphql-tester' ? 'active' : ''}>
                  GraphQL Tester
                </Link>
                <Link to="/workspaces" className={location.pathname === '/workspaces' ? 'active' : ''}>
                  Workspaces
                </Link>
                <Link to="/webhooks" className={location.pathname === '/webhooks' ? 'active' : ''}>
                  Webhooks
                </Link>
                <Link to="/analytics" className={location.pathname === '/analytics' ? 'active' : ''}>
                  Analytics
                </Link>
                <Link to="/audit-logs" className={location.pathname === '/audit-logs' ? 'active' : ''}>
                  Audit Logs
                </Link>
                <Link to="/api-keys" className={location.pathname === '/api-keys' ? 'active' : ''}>
                  API Keys
                </Link>
                <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
                  Profile
                </Link>
                <Link to="/2fa" className={location.pathname === '/2fa' ? 'active' : ''}>
                  2FA
                </Link>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <ThemeToggle />
                  <WorkspaceSelector />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    👤 {user?.name || user?.email}
                  </span>
                  <button
                    onClick={logout}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </header>
      {isAuthenticated && <WorkspaceSelector />}
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/apis/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ApiDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/apis/:apiId/endpoints/:endpointId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EndpointEditorPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AnalyticsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspaces"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WorkspacesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/import-openapi"
        element={
          <ProtectedRoute>
            <AppLayout>
              <OpenApiImportPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/webhooks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WebhooksPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/graphql-tester"
        element={
          <ProtectedRoute>
            <AppLayout>
              <GraphQLTesterPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AuditLogsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspaces/:workspaceId/members"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WorkspaceMembersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/api-keys"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ApiKeysPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/2fa"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TwoFactorAuthPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ToasterWrapper() {
  const { theme } = useTheme();
  
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === 'dark' ? '#374151' : '#fff',
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
          border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <ToasterWrapper />
            <AppRoutes />
          </WorkspaceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

