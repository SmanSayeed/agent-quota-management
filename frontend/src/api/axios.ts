import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import toast from 'react-hot-toast';

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'Something went wrong';
    
    // Don't show toast for 401 on checkAuth (me) endpoint
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Handle unauthorized - only redirect if not already on login page
      if (window.location.pathname !== '/login') {
         // We might want to clear store here too, but circular dependency risk
         window.location.href = '/login';
      }
    }
    
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
