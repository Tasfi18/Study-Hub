'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoginForm as LoginFormType } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormType) => {
    const success = await login(data);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[#0d121b] text-2xl sm:text-3xl font-black leading-tight tracking-tight">
          Welcome back, Scholar
        </h2>
        <p className="text-[#4c669a] text-base">
          Access your study materials and notes.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Social Login */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex items-center justify-center gap-3 w-full h-12 rounded-lg border border-[#cfd7e7] bg-white hover:bg-gray-50 transition-colors text-[#0d121b] font-medium disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Connecting...' : 'Sign in with Google'}
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[#e7ebf3]"></div>
        <span className="flex-shrink-0 mx-4 text-sm text-[#4c669a]">Or continue with</span>
        <div className="flex-grow border-t border-[#e7ebf3]"></div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[#0d121b] text-sm font-medium">
            Email or Username
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={`
              w-full h-12 px-4 rounded-lg border bg-white text-[#0d121b] 
              placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#135bec]/20 
              focus:border-[#135bec] outline-none transition-all
              ${errors.email ? 'border-red-400' : 'border-[#cfd7e7]'}
            `}
            placeholder="student@university.edu"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[#0d121b] text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`
                w-full h-12 pl-4 pr-12 rounded-lg border bg-white text-[#0d121b] 
                placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#135bec]/20 
                focus:border-[#135bec] outline-none transition-all
                ${errors.password ? 'border-red-400' : 'border-[#cfd7e7]'}
              `}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-4 text-[#4c669a] hover:text-[#135bec] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full h-12 bg-[#135bec] hover:bg-[#0d4ac7] text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading || isSubmitting ? 'Signing In...' : 'Log In'}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[#4c669a] text-sm">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#135bec] font-bold hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;