/**
 * Root App Component — Router with lazy-loaded modules
 *
 * Every module is:
 * 1. Lazy-loaded for code splitting
 * 2. Wrapped in ModuleErrorBoundary
 * 3. Wrapped in Suspense with PageSkeleton fallback
 * 4. Protected by ProtectedRoute with required role
 */
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleErrorBoundary } from './shared/components/ErrorBoundary';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { PageSkeleton } from './shared/components/PageSkeleton';
import { AppLayout } from './shared/layouts/AppLayout';
import ComingSoonPage from './shared/components/ComingSoonPage';
import { apiRequest } from './shared/lib/queryClient';
import { setAccessToken, getTenantDomain } from './shared/lib/auth';

import { Toaster } from './shared/components/ui/toaster';

const LoginPage = lazy(() => import('./modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const TasksPage = lazy(() => import('./modules/tasks/pages/TasksPage'));
const UITestPage = lazy(() => import('./modules/dev/UITestPage'));
const UsersPage = lazy(() => import('./modules/admin/pages/UsersPage'));
const RolesPage = lazy(() => import('./modules/admin/pages/RolesPage'));
const MenuMasterPage = lazy(() => import('./modules/admin/pages/MenuMasterPage'));
const AccessControlPage = lazy(() => import('./modules/admin/pages/AccessControlPage'));
const ResetPasswordPage = lazy(() => import('./modules/auth/pages/ResetPasswordPage'));

const App: React.FC = () => {
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      const domain = getTenantDomain();
      if (!domain) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // Attempt silent refresh
        const res = await apiRequest<{ data: { accessToken: string } }>('POST', '/auth/refresh');
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
        }
      } catch (err) {
        console.warn('Initial session check failed', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();
  }, []);

  if (isCheckingAuth) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ResetPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/dev/ui-test"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <UITestPage />
            </Suspense>
          }
        />

        {/* Protected routes — wrapped in AppLayout shell */}
        <Route
          element={
            <ProtectedRoute requiredRole="user">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ModuleErrorBoundary moduleName="Dashboard">
                <Suspense fallback={<PageSkeleton />}>
                  <DashboardPage />
                </Suspense>
              </ModuleErrorBoundary>
            }
          />
          <Route
            path="/tasks"
            element={
              <ModuleErrorBoundary moduleName="Tasks">
                <Suspense fallback={<PageSkeleton />}>
                  <TasksPage />
                </Suspense>
              </ModuleErrorBoundary>
            }
          />

          {/* Admin Module */}
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route
            path="/admin/users"
            element={
              <ModuleErrorBoundary moduleName="Admin/Users">
                <Suspense fallback={<PageSkeleton />}>
                  <UsersPage />
                </Suspense>
              </ModuleErrorBoundary>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ModuleErrorBoundary moduleName="Admin/Roles">
                <Suspense fallback={<PageSkeleton />}>
                  <RolesPage />
                </Suspense>
              </ModuleErrorBoundary>
            }
          />
          <Route
            path="/admin/menus"
            element={
              <ModuleErrorBoundary moduleName="Admin/Menus">
                <Suspense fallback={<PageSkeleton />}>
                  <MenuMasterPage />
                </Suspense>
              </ModuleErrorBoundary>
            }
          />
          <Route
            path="/admin/access-control"
            element={
              <ModuleErrorBoundary moduleName="Admin/AccessControl">
                <Suspense fallback={<PageSkeleton />}>
                  <AccessControlPage />
                </Suspense>
              </ModuleErrorBoundary>
            }
          />

          {/* Fallback for dynamic menus not yet implemented */}
          <Route path="*" element={<ComingSoonPage />} />

          {/* Add more module routes here as they are built */}
          {/* Example:
        <Route
          path="/items/*"
          element={
            <ModuleErrorBoundary moduleName="Items">
              <Suspense fallback={<PageSkeleton />}>
                <ItemsModule />
              </Suspense>
            </ModuleErrorBoundary>
          }
        />
        */}
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
