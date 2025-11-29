import { create } from 'zustand';

interface PoolState {
  availableQuota: number;
  lastUpdated: number;
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
  lastUpdated: Date.now(),
  creditPrice: 1,
  quotaPrice: 20,
  dailyPurchaseLimit: 100,
  setAvailableQuota: (quota) => set({ availableQuota: quota, lastUpdated: Date.now() }),
  setCreditPrice: (price) => set({ creditPrice: price }),
  setQuotaPrice: (price) => set({ quotaPrice: price }),
  setPoolData: (data) => set((state) => ({
    availableQuota: data.availableQuota ?? state.availableQuota,
    lastUpdated: data.availableQuota !== undefined ? Date.now() : state.lastUpdated,
    creditPrice: data.creditPrice ?? state.creditPrice,
    quotaPrice: data.quotaPrice ?? state.quotaPrice,
    dailyPurchaseLimit: data.dailyPurchaseLimit ?? state.dailyPurchaseLimit,
  })),
}));
