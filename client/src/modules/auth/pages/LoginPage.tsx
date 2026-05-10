/**
 * Login Page — Authentication entry point with 180° Flip Effect
 *
 * Includes:
 * - Login View (Front)
 * - Forgot Password View (Back)
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  type LoginInput,
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '../../../shared/lib/validators';
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // --- Login Form ---
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { domain: '', username: '', password: '' },
  });

  const onLoginSubmit = async (data: LoginInput): Promise<void> => {
    setLoginError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/v2/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const result: LoginResponse & { message?: string } = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'Login failed');
      setAccessToken(result.data.accessToken);
      setTenantDomain(data.domain);
      navigate(from, { replace: true });
    } catch (err) {
      setLoginError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Forgot Password Form ---
  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
    reset: resetForgot,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { domain: '', username: '' },
  });

  const onForgotSubmit = async (data: ForgotPasswordInput): Promise<void> => {
    setForgotError(null);
    setForgotSuccess(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/v2/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.message || 'Failed to send reset link');
      setForgotSuccess(result.message || 'If an account exists, a reset link has been sent.');
      resetForgot();
    } catch (err) {
      setForgotError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
    setLoginError(null);
    setForgotError(null);
    setForgotSuccess(null);
  };

  const hasError =
    loginError ||
    Object.keys(loginErrors).length > 0 ||
    forgotError ||
    Object.keys(forgotErrors).length > 0;
  const cardHeight = hasError ? 'h-[560px]' : 'h-[500px]';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 perspective-1000 overflow-hidden">
      <div
        className={`w-full max-w-sm ${cardHeight} transition-all duration-300 relative flip-card-inner ${isFlipped ? 'flipped' : ''}`}
      >
        {/* --- FRONT: Login --- */}
        <div className="flip-card-front">
          <form
            onSubmit={handleSubmitLogin(onLoginSubmit)}
            className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 space-y-4 h-full"
            noValidate
          >
            <div className="text-center mb-1">
              <img src={logo} alt="SAIL Logo" className="h-16 w-auto mx-auto mb-1" />
            </div>

            {loginError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                type="text"
                autoComplete="username"
                {...registerLogin('username')}
                className={loginErrors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {loginErrors.username && (
                <p className="text-xs text-red-500">{loginErrors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...registerLogin('password')}
                className={loginErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={toggleFlip}
                  className="text-xs text-[#16569e] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-xs text-red-500">{loginErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-domain">Domain</Label>
              <Input
                id="login-domain"
                type="text"
                autoComplete="organization"
                {...registerLogin('domain')}
                className={loginErrors.domain ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {loginErrors.domain && (
                <p className="text-xs text-red-500">{loginErrors.domain.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#16569e] hover:bg-[#1e5fa8] text-white"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        {/* --- BACK: Forgot Password --- */}
        <div className="flip-card-back">
          <form
            onSubmit={handleSubmitForgot(onForgotSubmit)}
            className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 space-y-4 h-full"
            noValidate
          >
            <div className="text-center mb-1">
              <img src={logo} alt="SAIL Logo" className="h-16 w-auto mx-auto mb-1" />
              <h2 className="text-lg font-bold text-gray-900">Forgot Password</h2>
            </div>

            {forgotError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                {forgotSuccess}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="forgot-username">Username</Label>
              <Input
                id="forgot-username"
                type="text"
                {...registerForgot('username')}
                className={forgotErrors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {forgotErrors.username && (
                <p className="text-xs text-red-500">{forgotErrors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-domain">Domain</Label>
              <Input
                id="forgot-domain"
                type="text"
                {...registerForgot('domain')}
                className={forgotErrors.domain ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {forgotErrors.domain && (
                <p className="text-xs text-red-500">{forgotErrors.domain.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!forgotSuccess}
              className="w-full h-11 bg-[#16569e] hover:bg-[#1e5fa8] text-white"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={toggleFlip}
                className="text-sm font-medium text-[#16569e] hover:underline"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
