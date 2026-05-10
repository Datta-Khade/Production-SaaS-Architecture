import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '../../../shared/lib/validators';
import { getErrorMessage } from '../../../shared/lib/errors';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import logo from '@/assets/logo.svg';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token') || '';
  const domain = searchParams.get('domain') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, domain, new_password: '' },
  });

  const onSubmit = async (data: ResetPasswordInput): Promise<void> => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v2/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setSuccess('Your password has been reset successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !domain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center bg-white p-8 rounded-xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
          <p className="text-sm text-gray-500 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/login" className="text-sm font-medium text-[#16569e] hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 space-y-6"
        >
          <div className="text-center mb-6">
            <img src={logo} alt="SAIL Logo" className="h-20 w-auto mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
              {success}
              <div className="mt-4">
                <Link to="/auth/login" className="font-bold text-[#16569e] hover:underline">
                  Click here to Login
                </Link>
              </div>
            </div>
          )}

          {!success && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...register('new_password')}
                  className={errors.new_password ? 'border-red-500' : ''}
                />
                {errors.new_password && (
                  <p className="text-xs text-red-500">{errors.new_password.message}</p>
                )}
              </div>

              <input type="hidden" {...register('token')} />
              <input type="hidden" {...register('domain')} />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#16569e] hover:bg-[#1e5fa8]"
              >
                {isLoading ? 'Resetting...' : 'Update Password'}
              </Button>
            </>
          )}

          <div className="text-center">
            <Link to="/auth/login" className="text-sm font-medium text-[#16569e] hover:underline">
              Back to Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
