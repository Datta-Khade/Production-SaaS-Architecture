/**
 * Login Page — Authentication entry point
 *
 * Form fields per AUTH-1:
 *   - Domain (tenant identifier)
 *   - Username (email or login name)
 *   - Password
 *
 * On success:
 *   - Access token stored in memory
 *   - Tenant domain stored in localStorage
 *   - Redirect to intended destination or /dashboard
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../../../shared/lib/validators';
import { setAccessToken, setTenantDomain } from '../../../shared/lib/auth';
import { getErrorMessage } from '../../../shared/lib/errors';

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: {
      uuid: string;
      email: string;
      username: string;
      role: string;
      first_name: string;
      last_name: string;
    };
  };
}

const LoginPage: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [error, setError]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { domain: '', username: '', password: '' },
  });

  const onSubmit = async (data: LoginInput): Promise<void> => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v2/auth/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(data),
      });

      const result: LoginResponse & { message?: string; code?: string } = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Login failed');
      }

      setAccessToken(result.data.accessToken);
      setTenantDomain(data.domain);

      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4" noValidate>

          {/* Error banner */}
          {error && (
            <div
              id="login-error"
              className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-fade-in"
            >
              {error}
            </div>
          )}

          {/* Domain */}
          <div>
            <label htmlFor="domain" className="label">Domain</label>
            <input
              id="domain"
              type="text"
              className={`input ${errors.domain ? 'border-red-500' : ''}`}
              placeholder="dev.localhost"
              autoComplete="organization"
              {...register('domain')}
            />
            {errors.domain && <p className="error-text">{errors.domain.message}</p>}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="label">Username</label>
            <input
              id="username"
              type="text"
              className={`input ${errors.username ? 'border-red-500' : ''}`}
              placeholder="admin@dev.localhost"
              autoComplete="username"
              {...register('username')}
            />
            {errors.username && <p className="error-text">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              className={`input ${errors.password ? 'border-red-500' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
            id="login-submit"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Dev hint */}
          <div className="text-xs text-neutral-400 text-center pt-2 space-y-0.5">
            <p className="font-medium text-neutral-500">Dev Credentials</p>
            <p>Domain: <code className="font-mono">dev.localhost</code></p>
            <p>Username: <code className="font-mono">admin@dev.localhost</code></p>
            <p>Password: <code className="font-mono">Admin@1234</code></p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
