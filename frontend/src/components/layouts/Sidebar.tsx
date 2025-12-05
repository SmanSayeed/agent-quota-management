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
            to: '/admin/super-admins', 
            label: 'Super Admins',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
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
          { 
            to: '/admin/pending-purchases', 
            label: 'Pending Purchases',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          },
          { 
            to: '/admin/marketplace', 
            label: 'Buy Quota',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
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
            to: '/agent/marketplace', 
            label: 'Buy Quota',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          },
          { 
            to: '/agent/list-quota', 
            label: 'List Quota for Sale',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
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
        className={`menu p-4 min-h-full bg-base-300 text-base-content flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${className}`}
      >
        <div className={`mb-6 flex items-center min-h-[3.5rem] relative ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
          {isCollapsed ? (
            // Collapsed: Just centered logo with padding to avoid button
            <div className="pr-2 flex-shrink-0">
              <img src="/logo.png" alt="AMS Logo" className="w-14 h-14 flex-shrink-0 transition-all duration-300 drop-shadow-lg" />
            </div>
          ) : (
            // Expanded: Logo with text
            <div className="flex items-center gap-3 flex-shrink-0">
              <img src="/logo.png" alt="AMS Logo" className="w-14 h-14 flex-shrink-0 transition-all duration-300 drop-shadow-md" />
              <div className="flex flex-col flex-shrink-0">
                <span className="text-sm font-semibold text-base-content/60 leading-tight whitespace-nowrap">Agent & Quota</span>
                <span className="text-sm font-semibold text-base-content/60 leading-tight whitespace-nowrap">Management</span>
              </div>
            </div>
          )}
          
          {/* Desktop Collapse Button - Positioned at edge */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 cursor-pointer bg-transparent hover:bg-transparent border-none outline-none group"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50 group-hover:text-primary transition-colors duration-200 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50 group-hover:text-primary transition-colors duration-200 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            )}
          </button>

          {/* Mobile Close Button - Larger touch target */}
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square lg:hidden min-h-[2.5rem] min-w-[2.5rem] ml-auto"
            aria-label="Close sidebar"
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
                      ? 'bg-primary text-primary-content font-semibold shadow-md shadow-primary/20' 
                      : 'hover:bg-base-100 text-base-content/80 hover:text-base-content'
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
          <div className={`mt-auto pt-6 border-t border-base-content/10 ${isCollapsed ? 'px-0' : 'px-2'}`}>
            <div className={`flex flex-col gap-3 ${isCollapsed ? 'items-center' : ''}`}>
              
              {/* Slip Request Button - Tan/Beige */}
              <button
                onClick={() => navigate(getUploadPath())}
                className={`flex items-center group relative transition-all hover:scale-105 ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full'}`}
                title="Slip Request"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xl z-10 shrink-0 border-2 border-amber-200/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {!isCollapsed && (
                  <div className="bg-base-100/50 backdrop-blur-sm text-base-content px-4 py-2 rounded-r-full rounded-l-none text-sm font-bold -ml-6 pl-8 flex-1 text-left shadow-lg border border-base-content/10 group-hover:bg-base-100/70 transition-all">
                    Slip request
                  </div>
                )}
              </button>

              {/* Buy Credit Button - Silver/Gray (Only for Agents) */}
              {user?.role === 'agent' && (
                <button
                  onClick={() => setIsBuyCreditOpen(true)}
                  className={`flex items-center group relative transition-all hover:scale-105 ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full'}`}
                  title="Buy Credit"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 flex items-center justify-center shadow-xl z-10 shrink-0 border-2 border-gray-200/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.89.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                    </svg>
                  </div>
                  {!isCollapsed && (
                    <div className="bg-base-100/50 backdrop-blur-sm text-base-content px-4 py-2 rounded-r-full rounded-l-none text-sm font-bold -ml-6 pl-8 flex-1 text-left shadow-lg border border-base-content/10 group-hover:bg-base-100/70 transition-all">
                      buy credit
                    </div>
                  )}
                </button>
              )}

              {/* Buy Quota Button - Purple/Violet (Only for Child Agents) */}
              {user?.role === 'child' && (
                <button
                  onClick={() => setIsBuyQuotaOpen(true)}
                  className={`flex items-center group relative transition-all hover:scale-105 ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full'}`}
                  title="Buy Quota"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 flex items-center justify-center shadow-xl z-10 shrink-0 border-2 border-purple-300/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  {!isCollapsed && (
                    <div className="bg-base-100/50 backdrop-blur-sm text-base-content px-4 py-2 rounded-r-full rounded-l-none text-sm font-bold -ml-6 pl-8 flex-1 text-left shadow-lg border border-base-content/10 group-hover:bg-base-100/70 transition-all">
                      buy quota
                    </div>
                  )}
                </button>
              )}

              {/* Quota Marketplace Button - Green/Teal (Only for Agents) */}
              {user?.role === 'agent' && (
                <button
                  onClick={() => navigate('/agent/marketplace')}
                  className={`flex items-center group relative transition-all hover:scale-105 ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full'}`}
                  title="Quota Marketplace"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-300 via-teal-400 to-teal-500 flex items-center justify-center shadow-xl z-10 shrink-0 border-2 border-teal-200/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  {!isCollapsed && (
                    <div className="bg-base-100/50 backdrop-blur-sm text-base-content px-4 py-2 rounded-r-full rounded-l-none text-sm font-bold -ml-6 pl-8 flex-1 text-left shadow-lg border border-base-content/10 group-hover:bg-base-100/70 transition-all">
                      marketplace
                    </div>
                  )}
                </button>
              )}

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
