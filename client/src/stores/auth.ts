import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, SignupForm, LoginForm } from '@/types';
import { authService } from '@/services/auth';

interface AuthStore extends AuthState {
  signup: (data: SignupForm) => Promise<void>;
  login: (data: LoginForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      signup: async (data: SignupForm) => {
        set({ isLoading: true, error: null });
        try {
          const authResponse = await authService.signup(data);
          set({
            user: authResponse.user,
            token: authResponse.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Signup failed',
            isLoading: false,
          });
          throw error;
        }
      },

      login: async (data: LoginForm) => {
        set({ isLoading: true, error: null });
        try {
          const authResponse = await authService.login(data);
          set({
            user: authResponse.user,
            token: authResponse.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshUser: async () => {
        const { token, isAuthenticated } = get();
        if (!token || !isAuthenticated) return;

        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          set({ user, isLoading: false });
        } catch (error) {
          console.error('Failed to refresh user:', error);
          // Don't clear auth state on refresh failure
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);