'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallback() {
  const router = useRouter();
  const { updateUser, setLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Auth callback error:', sessionError);
          setError('Failed to get session. Please try again.');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        // Set the Supabase access token for API calls
        apiClient.setToken(session.access_token);
        
        // Create basic user object from session
        const basicUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          avatar_url: session.user.user_metadata?.avatar_url || '',
        };
        
        try {
          // Try to get user profile from backend
          const profileResponse = await apiClient.getProfile();
          
          if (profileResponse.success && profileResponse.data) {
            const profile = profileResponse.data;
            
            // Check if profile is complete
            if (profile.role && profile.discipline_id && profile.is_active) {
              // Profile complete - redirect to home
              updateUser(profile);
              router.push('/');
            } else {
              // Profile incomplete - redirect to completion
              updateUser({ ...basicUser, ...profile });
              router.push('/complete-profile');
            }
          } else {
            // Profile fetch failed but we have session - redirect to complete profile
            updateUser(basicUser as any);
            router.push('/complete-profile');
          }
        } catch (apiError: any) {
          console.error('Profile fetch error:', apiError);
          // If profile doesn't exist or is incomplete, redirect to complete-profile with basic info
          updateUser(basicUser as any);
          router.push('/complete-profile');
        }
      } catch (error) {
        console.error('Callback handler error:', error);
        setError('An error occurred. Redirecting...');
        setTimeout(() => router.push('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, updateUser, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
