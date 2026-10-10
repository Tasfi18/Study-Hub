import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginForm, RegisterForm } from '@/types';
import { apiClient } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginForm) => Promise<boolean>;
  register: (userData: RegisterForm) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  completeProfile: (data: { role: string; disciplineName: string; studentId?: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (userData: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.login(credentials);
          
          if (response.success && response.data) {
            const { token, user } = response.data;
            apiClient.setToken(token); // Ensure API client has the token
            set({ 
              user, 
              token, 
              isLoading: false 
            });
            return true;
          } else {
            set({ 
              error: response.message || 'Login failed', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (userData: RegisterForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.register(userData);
          
          if (response.success) {
            set({ isLoading: false });
            return true;
          } else {
            set({ 
              error: response.message || 'Registration failed', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      resendVerificationEmail: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.resendVerificationEmail(email);
          
          if (response.success) {
            set({ isLoading: false });
            return true;
          } else {
            set({ 
              error: response.message || 'Failed to resend verification email', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      completeProfile: async (data: { role: string; disciplineName: string; studentId?: string }) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.completeProfile(data);
          
          if (response.success && response.data) {
            const { token, user } = response.data;
            apiClient.setToken(token);
            set({ 
              user, 
              token, 
              isLoading: false 
            });
            return true;
          } else {
            set({ 
              error: response.message || 'Profile completion failed', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile completion failed';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      logout: () => {
        apiClient.clearToken();
        set({ 
          user: null, 
          token: null, 
          error: null 
        });
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      updateUser: (userData: User) => set({ user: userData }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Sync token with API client when store rehydrates
          if (state?.token) {
            apiClient.setToken(state.token);
          }
        };
      },
    }
  )
);