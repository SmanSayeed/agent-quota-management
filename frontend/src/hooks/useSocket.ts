import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { usePoolStore } from '../store/poolStore';

export const useSocket = () => {
  const { updateQuotaBalance, updateCreditBalance } = useAuthStore();
  const { setAvailableQuota } = usePoolStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for pool updates
    socket.on('pool-updated', (data: { availableQuota: number }) => {
      setAvailableQuota(data.availableQuota);
    });

    // Listen for quota balance updates
    socket.on('quota-balance-updated', (data: { quotaBalance: number }) => {
      updateQuotaBalance(data.quotaBalance);
    });

    // Listen for credit balance updates
    socket.on('credit-balance-updated', (data: { creditBalance: number }) => {
      updateCreditBalance(data.creditBalance);
    });

    return () => {
      socket.off('pool-updated');
      socket.off('quota-balance-updated');
      socket.off('credit-balance-updated');
    };
  }, [updateQuotaBalance, updateCreditBalance, setAvailableQuota]);
};
