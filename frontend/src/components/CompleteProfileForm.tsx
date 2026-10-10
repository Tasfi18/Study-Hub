'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Discipline } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import Button from './Button';
import { GraduationCap, Hash, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const completeProfileSchema = z.object({
  role: z.enum(['student', 'teacher'] as const),
  disciplineName: z.string().min(1, 'Please select your discipline'),
  studentId: z.string().optional(),
}).refine((data) => {
  if (data.role === 'student' && (!data.studentId || data.studentId.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Student ID is required for students",
  path: ["studentId"],
});

type CompleteProfileFormType = z.infer<typeof completeProfileSchema>;

const CompleteProfileForm: React.FC = () => {
  const router = useRouter();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loadingDisciplines, setLoadingDisciplines] = useState(false);
  const { completeProfile, isLoading, error, user } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CompleteProfileFormType>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      role: 'student',
    },
    mode: 'onChange',
  });

  const watchedRole = watch('role');

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

  const onSubmit = async (data: CompleteProfileFormType) => {
    const success = await completeProfile(data);
    if (success) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-sm text-gray-600 mt-2">
            Welcome, {user?.full_name || user?.email}! Please complete your profile to continue.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Role Field */}
            <div className="space-y-1">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-500" />
                <select
                  {...register('role')}
                  id="role"
                  className="input pl-10 h-12 text-base"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>

            {/* Discipline Field */}
            <div className="space-y-1">
              <label htmlFor="disciplineName" className="block text-sm font-medium text-gray-700">
                Discipline <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-500" />
                <select
                  {...register('disciplineName')}
                  id="disciplineName"
                  className={cn(
                    "input pl-10 h-12 text-base",
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
                <p className="text-sm text-red-600">{errors.disciplineName.message}</p>
              )}
            </div>

            {/* Student ID Field - Only for Students */}
            {watchedRole === 'student' && (
              <div className="space-y-1">
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5",
                    errors.studentId ? "text-red-400" : "text-primary-500"
                  )} />
                  <input
                    {...register('studentId')}
                    type="text"
                    id="studentId"
                    autoComplete="off"
                    className={cn(
                      "input pl-10 h-12 text-base",
                      errors.studentId && "input-error"
                    )}
                    placeholder="Enter your student ID"
                  />
                </div>
                {errors.studentId && (
                  <p className="text-sm text-red-600">{errors.studentId.message}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-6 h-12 text-base"
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? 'Completing...' : 'Complete Profile'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfileForm;
