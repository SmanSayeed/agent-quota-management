import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import BuyQuotaModal from '../modals/BuyQuotaModal';
import BuyCreditModal from '../modals/BuyCreditModal';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className = '', onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isBuyQuotaOpen, setIsBuyQuotaOpen] = useState(false);
  const [isBuyCreditOpen, setIsBuyCreditOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getLinks = () => {
    const iconClass = "h-5 w-5";
    switch (user?.role) {
      case 'superadmin':
        return [
          { 
            to: '/admin/dashboard', 
            label: 'Dashboard', 
            end: true,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          },
          { 
            to: '/admin/agents', 
            label: 'Agents',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          },
          { 
            to: '/admin/credit-requests', 
            label: 'Credit Requests',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          },
          { 
            to: '/admin/passports', 
            label: 'Passports',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          },
        ];
      case 'agent':
        return [
          { 
            to: '/agent/dashboard', 
            label: 'Dashboard', 
            end: true,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          },
          { 
            to: '/agent/my-children', 
            label: 'My Child Agents',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          },
          { 
            to: '/agent/credit-requests', 
            label: 'Credit Requests',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          },
          { 
            to: '/agent/quota-requests', 
            label: 'Quota Requests',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          },
          { 
            to: '/agent/quota-history', 
            label: 'Quota History',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          },
          { 
            to: '/agent/my-slip-requests', 
            label: 'My Slip Requests',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          },
        ];
      case 'child':
        return [
          { 
            to: '/child/dashboard', 
            label: 'Dashboard', 
            end: true,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          },
          { 
            to: '/child/my-slip-requests', 
            label: 'My Slip Requests',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          },
          { 
            to: '/child/my-quota-requests', 
            label: 'My Quota Requests',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();
  const showActionButtons = user?.role === 'agent' || user?.role === 'child';

  const getUploadPath = () => {
    return user?.role === 'agent' ? '/agent/slip-request' : '/child/slip-request';
  };

  return (
    <>
      <div 
        className={`menu p-4 min-h-full bg-base-200 text-base-content flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${className}`}
      >
        <div className="mb-6 px-2 flex justify-between items-center">
          {!isCollapsed && <h2 className="text-2xl font-bold text-primary truncate">AMS</h2>}
          
          {/* Desktop Collapse Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-ghost btn-sm btn-square hidden lg:flex"
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            )}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <ul className="flex-1 space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) => 
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-content font-semibold' 
                      : 'hover:bg-base-300'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`
                }
                title={isCollapsed ? link.label : ''}
              >
                {link.icon}
                {!isCollapsed && <span>{link.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Action Buttons for Agent and Child */}
        {showActionButtons && (
          <div className={`mt-auto pt-4 border-t border-base-300 ${isCollapsed ? 'px-0' : 'px-2'}`}>
            <div className={`flex flex-col gap-4 ${isCollapsed ? 'items-center' : ''}`}>
              
              {/* Slip Request Button */}
              <button
                onClick={() => navigate(getUploadPath())}
                className={`flex items-center gap-3 group relative ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full'}`}
                title="Slip Request"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg z-10 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {!isCollapsed && (
                  <div className="bg-yellow-900 text-white px-4 py-1.5 rounded-r-full rounded-l-none text-sm font-medium -ml-5 pl-7 flex-1 text-left shadow-md transition-transform group-hover:scale-105">
                    Slip Request
                  </div>
                )}
              </button>

              {/* Buy Credit Button - Only for Agents */}
              {user?.role === 'agent' && (
                <button
                  onClick={() => setIsBuyCreditOpen(true)}
                  className={`flex items-center gap-3 group relative ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full'}`}
                  title="Buy Credit"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg z-10 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {!isCollapsed && (
                    <div className="bg-green-900 text-white px-4 py-1.5 rounded-r-full rounded-l-none text-sm font-medium -ml-5 pl-7 flex-1 text-left shadow-md transition-transform group-hover:scale-105">
                      Buy Credit
                    </div>
                  )}
                </button>
              )}

              {/* Buy Quota Button */}
              <button
                onClick={() => setIsBuyQuotaOpen(true)}
                className={`flex items-center gap-3 group relative ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full'}`}
                title={user?.role === 'child' ? 'Request Quota' : 'Buy Quota'}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg z-10 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                {!isCollapsed && (
                  <div className="bg-blue-900 text-white px-4 py-1.5 rounded-r-full rounded-l-none text-sm font-medium -ml-5 pl-7 flex-1 text-left shadow-md transition-transform group-hover:scale-105">
                    {user?.role === 'child' ? 'Request Quota' : 'Buy Quota'}
                  </div>
                )}
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <BuyQuotaModal isOpen={isBuyQuotaOpen} onClose={() => setIsBuyQuotaOpen(false)} />
      <BuyCreditModal isOpen={isBuyCreditOpen} onClose={() => setIsBuyCreditOpen(false)} />
    </>
  );
}
