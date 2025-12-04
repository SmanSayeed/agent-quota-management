import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { usePoolStore } from '../store/poolStore';
import toast from 'react-hot-toast';

// If VITE_API_URL contains /api, we want to strip it for the socket connection
// or just use the base URL.
const getSocketUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (e) {
    return url;
  }
};

const SOCKET_URL = getSocketUrl();

export const useSocket = () => {
  const { user, updateQuotaBalance, updateCreditBalance } = useAuthStore();
  const { setAvailableQuota } = usePoolStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Child agents do not have real-time features
    if (!user || user.role === 'child') {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket'],
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Socket connected');
        // Join rooms based on role
        if (user.role === 'superadmin' || user.role === 'admin') {
          socket.emit('join-admin-room');
          socket.emit('join-pool-room', user.role);
          // Admin might also need their own user room if they have personal balances
          socket.emit('join-user-room', user._id); 
        } else if (user.role === 'agent') {
          socket.emit('join-user-room', user._id);
          socket.emit('join-pool-room', user.role);
        }
      });

      socket.on('pool-updated', (data: { availableQuota: number }) => {
        console.log('Pool updated:', data);
        setAvailableQuota(data.availableQuota);
      });

      socket.on('quota-balance-updated', (data: { quotaBalance: number }) => {
        console.log('Quota balance updated:', data);
        updateQuotaBalance(data.quotaBalance);
        toast.success(`Quota updated: ${data.quotaBalance}`);
      });

      socket.on('credit-balance-updated', (data: { creditBalance: number }) => {
        console.log('Credit balance updated:', data);
        updateCreditBalance(data.creditBalance);
        toast.success(`Credit updated: ${data.creditBalance}`);
      });

      socket.on('new-passport', (_data: any) => {
        if (user.role === 'superadmin' || user.role === 'admin') {
          toast('New passport uploaded!', { icon: '📄' });
          // Ideally we would invalidate queries here, but we need access to queryClient
          // We can use a global event bus or just let the user refresh/navigate
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
}, [user, setAvailableQuota, updateQuotaBalance, updateCreditBalance]);

  return socketRef.current;
};

// Create singleton socket instance for components outside hooks
export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
  autoConnect: false,
});
