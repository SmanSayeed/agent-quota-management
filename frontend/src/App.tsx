import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';
import MainLayout from './components/layouts/MainLayout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import Agents from './pages/SuperAdmin/Agents';
import CreditRequests from './pages/SuperAdmin/CreditRequests';
import Passports from './pages/SuperAdmin/Passports';
import AgentDashboard from './pages/Agent/Dashboard';
import MyChildAgents from './pages/Agent/MyChildAgents';
import UploadPassport from './pages/Agent/UploadPassport';
import RequestCredit from './pages/Agent/RequestCredit';
import SlipRequest from './pages/Agent/SlipRequest';
import BuyQuota from './pages/Agent/BuyQuota';
import AgentCreditRequests from './pages/Agent/AgentCreditRequests';
import AgentQuotaRequests from './pages/Agent/AgentQuotaRequests';
import MySlipRequests from './pages/Agent/MySlipRequests';
import LiveToPool from './pages/Agent/LiveToPool';
import ChildDashboard from './pages/Child/Dashboard';
import ChildUploadPassport from './pages/Child/UploadPassport';
import ChildSlipRequest from './pages/Child/SlipRequest';
import ChildBuyQuota from './pages/Child/BuyQuota';
import QuotaHistory from './pages/Agent/QuotaHistory';
import MyQuotaRequests from './pages/Child/MyQuotaRequests';

function App() {
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  
  // Initialize socket connection
  useSocket();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route element={<MainLayout />}>
            {user?.role === 'superadmin' && (
              <>
                <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/admin/agents" element={<Agents />} />
                <Route path="/admin/credit-requests" element={<CreditRequests />} />
                <Route path="/admin/passports" element={<Passports />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </>
            )}
            
            {user?.role === 'agent' && (
              <>
                <Route path="/agent/dashboard" element={<AgentDashboard />} />
                <Route path="/agent/request-credit" element={<RequestCredit />} />
                <Route path="/agent/slip-request" element={<SlipRequest />} />
                <Route path="/agent/my-slip-requests" element={<MySlipRequests />} />
                <Route path="/agent/buy-quota" element={<BuyQuota />} />
                <Route path="/agent/live-to-pool" element={<LiveToPool />} />
                <Route path="/agent/my-children" element={<MyChildAgents />} />
                <Route path="/agent/credit-requests" element={<AgentCreditRequests />} />
                <Route path="/agent/quota-requests" element={<AgentQuotaRequests />} />
                <Route path="/agent/quota-history" element={<QuotaHistory />} />
                <Route path="/agent/upload-passport" element={<UploadPassport />} />
                <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
              </>
            )}
            
            {user?.role === 'child' && (
              <>
                <Route path="/child/dashboard" element={<ChildDashboard />} />
                <Route path="/child/slip-request" element={<ChildSlipRequest />} />
                <Route path="/child/my-slip-requests" element={<MySlipRequests />} />
                <Route path="/child/buy-quota" element={<ChildBuyQuota />} />
                <Route path="/child/my-quota-requests" element={<MyQuotaRequests />} />
                <Route path="/child/upload-passport" element={<ChildUploadPassport />} />
                <Route path="*" element={<Navigate to="/child/dashboard" replace />} />
              </>
            )}
            
            {/* Fallback if role doesn't match */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
