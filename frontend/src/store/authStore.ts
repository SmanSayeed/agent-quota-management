import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  emailVerified?: boolean;
  role: 'superadmin' | 'admin' | 'agent' | 'child';
  status: 'pending' | 'active' | 'disabled';
  creditBalance?: number;
  quotaBalance?: number;
  todayPurchased?: number;
  parentId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateQuotaBalance: (balance: number) => void;
  updateCreditBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start loading to check auth on mount

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        localStorage.setItem('has_logged_in', 'true');
        set({ user: data.data, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout failed', error);
        } finally {
          localStorage.removeItem('has_logged_in');
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        // Optimization: Check if we have a login flag before making the request
        // We can't check the HttpOnly cookie directly, so this flag acts as a hint
        const hasLoginFlag = localStorage.getItem('has_logged_in');
        
        if (!hasLoginFlag) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');
          // If data.data is null, it means not authenticated but no error
          if (data.data) {
            // Ensure flag is set if request succeeds (in case it was missing)
            localStorage.setItem('has_logged_in', 'true');
            set({ user: data.data, isAuthenticated: true, isLoading: false });
          } else {
            localStorage.removeItem('has_logged_in');
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          localStorage.removeItem('has_logged_in');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateQuotaBalance: (balance) =>
        set((state) => ({
          user: state.user ? { ...state.user, quotaBalance: balance } : null,
        })),

      updateCreditBalance: (balance) =>
        set((state) => ({
          user: state.user ? { ...state.user, creditBalance: balance } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Don't persist isLoading
    }
  )
);
