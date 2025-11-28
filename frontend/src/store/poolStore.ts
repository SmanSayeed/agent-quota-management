import { create } from 'zustand';

interface PoolState {
  availableQuota: number;
  creditPrice: number;
  quotaPrice: number;
  dailyPurchaseLimit: number;
  setAvailableQuota: (quota: number) => void;
  setCreditPrice: (price: number) => void;
  setQuotaPrice: (price: number) => void;
  setPoolData: (data: { availableQuota?: number; creditPrice?: number; quotaPrice?: number; dailyPurchaseLimit?: number }) => void;
}

export const usePoolStore = create<PoolState>((set) => ({
  availableQuota: 0,
  creditPrice: 1,
  quotaPrice: 20,
  dailyPurchaseLimit: 100,
  setAvailableQuota: (quota) => set({ availableQuota: quota }),
  setCreditPrice: (price) => set({ creditPrice: price }),
  setQuotaPrice: (price) => set({ quotaPrice: price }),
  setPoolData: (data) => set((state) => ({
    availableQuota: data.availableQuota ?? state.availableQuota,
    creditPrice: data.creditPrice ?? state.creditPrice,
    quotaPrice: data.quotaPrice ?? state.quotaPrice,
    dailyPurchaseLimit: data.dailyPurchaseLimit ?? state.dailyPurchaseLimit,
  })),
}));
