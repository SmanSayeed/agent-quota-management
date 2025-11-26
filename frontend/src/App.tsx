import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import AgentDashboard from './pages/Agent/Dashboard';
import ChildDashboard from './pages/Child/Dashboard';

function App() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {user?.role === 'superadmin' && (
          <>
            <Route path="/admin/*" element={<SuperAdminDashboard />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        )}
        
        {user?.role === 'agent' && (
          <>
            <Route path="/agent/*" element={<AgentDashboard />} />
            <Route path="*" element={<Navigate to="/agent" replace />} />
          </>
        )}
        
        {user?.role === 'child' && (
          <>
            <Route path="/child/*" element={<ChildDashboard />} />
            <Route path="*" element={<Navigate to="/child" replace />} />
          </>
        )}
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
