import { create } from 'zustand';

interface PoolState {
  availableQuota: number;
  setAvailableQuota: (quota: number) => void;
}

export const usePoolStore = create<PoolState>((set) => ({
  availableQuota: 0,
  setAvailableQuota: (quota) => set({ availableQuota: quota }),
}));
