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

import { Toaster } from './shared/components/ui/toaster';

const LoginPage = lazy(() => import('./modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const TasksPage = lazy(() => import('./modules/tasks/pages/TasksPage'));
const UITestPage = lazy(() => import('./modules/dev/UITestPage'));

const App: React.FC = () => {
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
