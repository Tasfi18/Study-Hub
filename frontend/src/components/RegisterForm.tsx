'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RegisterForm as RegisterFormType, UserRole, Discipline } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import Button from './Button';
import { Eye, EyeOff, Mail, Lock, User, UserCheck, BookOpen, Check, GraduationCap, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmailVerificationModal from './EmailVerificationModal';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  role: z.enum(['student', 'teacher'] as const),
  disciplineName: z.string().min(1, 'Please select your discipline'),
  studentId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Student ID is required for students
  if (data.role === 'student' && (!data.studentId || data.studentId.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Student ID is required for students",
  path: ["studentId"],
});

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loadingDisciplines, setLoadingDisciplines] = useState(false);
  const { register: registerUser, resendVerificationEmail, isLoading, error } = useAuthStore();
  
  // Load disciplines for registration (public endpoint)
  useEffect(() => {
    const loadDisciplines = async () => {
      setLoadingDisciplines(true);
      try {
        const response = await apiClient.getDisciplines();
        if (response.success && response.data) {
          setDisciplines(response.data);
        }
      } catch (error) {
        console.error('Failed to load disciplines:', error);
      } finally {
        setLoadingDisciplines(false);
      }
    };

    loadDisciplines();
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
    mode: 'onChange',
  });

  const watchedPassword = watch('password');
  const watchedEmail = watch('email');
  const watchedFullName = watch('fullName');
  const watchedConfirmPassword = watch('confirmPassword');
  const watchedRole = watch('role');

  // Compact password strength calculation
  const passwordStrength = useMemo(() => {
    if (!watchedPassword) return { score: 0, isStrong: false };
    
    const checks = [
      watchedPassword.length >= 8,
      /[a-z]/.test(watchedPassword),
      /[A-Z]/.test(watchedPassword),
      /\d/.test(watchedPassword),
    ];
    
    const score = checks.filter(Boolean).length;
    return { score, isStrong: score >= 4 };
  }, [watchedPassword]);

  const onSubmit = async (data: RegisterFormType) => {
    const success = await registerUser(data);
    if (success) {
      setRegisteredEmail(data.email);
      setShowVerificationModal(true);
    }
  };

  const handleResendEmail = async () => {
    if (registeredEmail) {
      await resendVerificationEmail(registeredEmail);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Compact Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
          <BookOpen className="w-6 h-6 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Join KU Study</h1>
        <p className="text-sm text-gray-600 mt-1">Create your account</p>
      </div>

      {/* Form Card */}
      <div className="card p-6 space-y-4">
        {/* Compact Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          {/* Name and Email Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Full Name Field */}
            <div className="space-y-1">
              <label htmlFor="fullName" className="block text-xs font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <User className={cn(
                  "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                  errors.fullName ? "text-red-400" : watchedFullName ? "text-primary-500" : "text-gray-400"
                )} />
                <input
                  {...register('fullName')}
                  type="text"
                  id="fullName"
                  autoComplete="name"
                  className={cn(
                    "input pl-9 h-10 text-sm",
                    errors.fullName && "input-error"
                  )}
                  placeholder="Your name"
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-1">
              <label htmlFor="role" className="block text-xs font-medium text-gray-700">
                Role
              </label>
              <div className="relative">
                <UserCheck className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-500" />
                <select
                  {...register('role')}
                  id="role"
                  className="input pl-9 h-10 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>
          </div>

          {/* Discipline Field - Required for All Users */}
          <div className="space-y-1">
            <label htmlFor="disciplineName" className="block text-xs font-medium text-gray-700">
              Discipline <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-500" />
              <select
                {...register('disciplineName')}
                id="disciplineName"
                className={cn(
                  "input pl-9 h-10 text-sm",
                  errors.disciplineName && "input-error"
                )}
                disabled={loadingDisciplines}
              >
                <option value="">
                  {loadingDisciplines ? 'Loading...' : 'Select your discipline'}
                </option>
                {disciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.name}>
                    {discipline.name} ({discipline.code})
                  </option>
                ))}
              </select>
            </div>
            {errors.disciplineName && (
              <p className="text-xs text-red-600">{errors.disciplineName.message}</p>
            )}
          </div>

          {/* Student ID Field - Only for Students */}
          {watchedRole === 'student' && (
            <div className="space-y-1">
              <label htmlFor="studentId" className="block text-xs font-medium text-gray-700">
                Student ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className={cn(
                  "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                  errors.studentId ? "text-red-400" : "text-primary-500"
                )} />
                <input
                  {...register('studentId')}
                  type="text"
                  id="studentId"
                  autoComplete="off"
                  className={cn(
                    "input pl-9 h-10 text-sm",
                    errors.studentId && "input-error"
                  )}
                  placeholder="Enter your student ID"
                />
              </div>
              {errors.studentId && (
                <p className="text-xs text-red-600">{errors.studentId.message}</p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className={cn(
                "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                errors.email ? "text-red-400" : watchedEmail ? "text-primary-500" : "text-gray-400"
              )} />
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className={cn(
                  "input pl-9 h-10 text-sm",
                  errors.email && "input-error"
                )}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                Password
              </label>
              {watchedPassword && (
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    passwordStrength.score < 2 ? "bg-red-400" : 
                    passwordStrength.score < 4 ? "bg-yellow-400" : "bg-green-400"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    passwordStrength.score < 2 ? "text-red-600" : 
                    passwordStrength.score < 4 ? "text-yellow-600" : "text-green-600"
                  )}>
                    {passwordStrength.score < 2 ? "Weak" : 
                     passwordStrength.score < 4 ? "Medium" : "Strong"}
                  </span>
                </div>
              )}
            </div>
            <div className="relative">
              <Lock className={cn(
                "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                errors.password ? "text-red-400" : watchedPassword ? "text-primary-500" : "text-gray-400"
              )} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                className={cn(
                  "input pl-9 pr-9 h-10 text-sm",
                  errors.password && "input-error"
                )}
                placeholder="Create password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className={cn(
                "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                errors.confirmPassword ? "text-red-400" : 
                watchedConfirmPassword && watchedPassword === watchedConfirmPassword ? "text-green-500" :
                watchedConfirmPassword ? "text-primary-500" : "text-gray-400"
              )} />
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                className={cn(
                  "input pl-9 pr-9 h-10 text-sm",
                  errors.confirmPassword && "input-error"
                )}
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {watchedConfirmPassword && watchedPassword === watchedConfirmPassword && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full mt-4"
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        {/* Switch to Login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Have an account?</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full text-center py-2.5 px-4 border border-gray-300 rounded-lg text-primary-600 hover:text-primary-700 hover:border-primary-300 hover:bg-primary-50 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm"
        >
          Sign In Instead
        </button>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          if (onSuccess) {
            onSuccess();
          }
        }}
        email={registeredEmail}
        onResendEmail={handleResendEmail}
      />
    </div>
  );
};

export default RegisterForm;