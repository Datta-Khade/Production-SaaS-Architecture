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
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import logo from '@/assets/logo.svg';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { domain: '', username: '', password: '' },
  });

  const onSubmit = async (data: LoginInput): Promise<void> => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v2/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="SAIL Logo" className="h-20 w-auto mx-auto mb-6" />
          {/* <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p> */}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 space-y-6" noValidate>

          {/* Error banner */}
          {error && (
            <div
              id="login-error"
              className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1"
            >
              {error}
            </div>
          )}

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              type="text"
              placeholder="dev.localhost"
              autoComplete="organization"
              {...register('domain')}
              className={errors.domain ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.domain && <p className="text-xs text-red-500">{errors.domain.message}</p>}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="admin@dev.localhost"
              autoComplete="username"
              {...register('username')}
              className={errors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#16569e] hover:bg-[#1e5fa8] text-white"
            id="login-submit"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>

          {/* Dev hint */}
          <div className="text-[10px] text-gray-400 text-center pt-2 space-y-1">
            <p className="font-semibold text-gray-500 uppercase tracking-wider">Dev Credentials</p>
            <p>Domain: <code className="font-mono bg-gray-50 px-1">dev.localhost</code></p>
            <p>User: <code className="font-mono bg-gray-50 px-1">admin@dev.localhost</code></p>
            <p>Pass: <code className="font-mono bg-gray-50 px-1">Admin@1234</code></p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
