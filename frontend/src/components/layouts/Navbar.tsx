import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { socket } from '../../hooks/useSocket';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const [totalMarketQuota, setTotalMarketQuota] = useState(0);

  // Only show pool quota for superadmin and agent (not for child)
  const showMarketStats = user?.role === 'superadmin' || user?.role === 'agent';

  useEffect(() => {
    if (!showMarketStats) return;

    const fetchStats = async () => {
      try {
        const { data } = await api.get('/quota/stats');
        setTotalMarketQuota(data.data.totalQuota);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();

    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }
    
    // Join marketplace room to get updates
    socket.emit('join-marketplace-room');

    const handleStatsUpdated = (data: { totalQuotaAvailable: number }) => {
      setTotalMarketQuota(data.totalQuotaAvailable);
    };

    socket.on('stats-updated', handleStatsUpdated);

    return () => {
      socket.off('stats-updated', handleStatsUpdated);
    };
  }, [showMarketStats]);

  return (
    <div className="navbar bg-base-300 shadow-sm sticky top-0 z-50 min-h-[4rem] px-2 sm:px-4">
      <div className="flex-none lg:hidden">
        <button 
          className="btn btn-square btn-ghost min-h-[2.75rem] min-w-[2.75rem]" 
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-6 h-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <Link to="/" className="btn btn-ghost text-sm sm:text-base lg:text-xl normal-case px-2 sm:px-4 truncate">
          <span className="hidden sm:inline">Agent Management System</span>
          <span className="sm:hidden">AMS</span>
        </Link>
      </div>
      <div className="flex-none flex items-center gap-1 sm:gap-2 md:gap-4">
        
        {/* Live Market Quota Counter */}
        {showMarketStats && (
          <div className="hidden md:flex items-center gap-3 bg-base-100/50 px-3 py-1.5 rounded-full border border-base-content/10 mr-2 shadow-sm">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-300"></span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] uppercase font-bold text-base-content tracking-wider">Market Quota</span>
              <span className="text-sm font-bold font-mono text-base-content">{totalMarketQuota.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* User Info and Avatar */}
        <div className="hidden lg:flex flex-col items-end mr-2">
          <span className="text-sm font-bold truncate max-w-[120px]">{user?.name}</span>
          <span className="text-xs opacity-70 capitalize">{user?.role}</span>
        </div>
        <div className="dropdown dropdown-end">
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost btn-circle avatar placeholder min-h-[2.75rem] min-w-[2.75rem]"
            aria-label="User menu"
          >
            <div className="bg-neutral text-neutral-content rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
              <span className="text-lg sm:text-xl">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow-lg menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-300"
          >
            {/* Show user info on mobile */}
            <li className="lg:hidden menu-title px-4 py-2">
              <span className="text-sm font-bold">{user?.name}</span>
              <span className="text-xs opacity-70 capitalize">{user?.role}</span>
            </li>
            <li className="lg:hidden"><div className="divider my-0"></div></li>
            {/* Show Market Quota on mobile menu */}
            {showMarketStats && (
              <li className="md:hidden">
                <div className="flex justify-between items-center bg-base-200/50 rounded-lg mb-2">
                  <span className="text-xs font-bold opacity-70">Market Quota</span>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300"></span>
                    </span>
                    <span className="font-mono font-bold text-base-content">{totalMarketQuota.toLocaleString()}</span>
                  </div>
                </div>
              </li>
            )}
            <li>
              <Link to="/profile" className="justify-between">
                Profile
              </Link>
            </li>
            <li>
              <button 
                onClick={() => logout()} 
                className="text-error"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
