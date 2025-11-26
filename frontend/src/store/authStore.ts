import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  name: string;
  phone: string;
  role: 'superadmin' | 'admin' | 'agent' | 'child';
  status: 'pending' | 'active' | 'disabled';
  creditBalance?: number;
  quotaBalance?: number;
  dailyPurchaseLimit?: number;
  todayPurchased?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  updateQuotaBalance: (balance: number) => void;
  updateCreditBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
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
    }
  )
);
