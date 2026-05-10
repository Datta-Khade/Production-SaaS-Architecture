/**
 * Protected Route — Guards routes by authentication and role
 *
 * Checks:
 * 1. User is authenticated (has valid access token)
 * 2. User has the minimum required role
 *
 * Redirects to /login if not authenticated.
 */
import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getAccessToken, decodeToken } from '../lib/auth';

type UserRole = 'superadmin' | 'admin' | 'manager' | 'user';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  manager: 1,
  admin: 2,
  superadmin: 3,
};

interface Props {
  requiredRole?: UserRole;
  children: ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ requiredRole = 'user', children }) => {
  const location = useLocation();

  // Check authentication
  if (!isAuthenticated()) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if specified
  if (requiredRole) {
    const token = getAccessToken();
    if (token) {
      const decoded = decodeToken(token);
      const userRole = decoded?.role as UserRole | undefined;

      if (userRole) {
        const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
        const requiredLevel = ROLE_HIERARCHY[requiredRole];

        if (userLevel < requiredLevel) {
          // Insufficient permissions — show 403-like redirect
          return (
            <div className="flex items-center justify-center min-h-screen p-8">
              <div className="card p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Access Denied</h2>
                <p className="text-sm text-neutral-500 mb-4">
                  {"You don't have permission to access this page. Required role:"}{' '}
                  <span className="font-medium">{requiredRole}</span>
                </p>
                <button
                  onClick={() => (window.location.href = '/dashboard')}
                  className="btn-primary"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          );
        }
      }
    }
  }

  return <>{children}</>;
};
