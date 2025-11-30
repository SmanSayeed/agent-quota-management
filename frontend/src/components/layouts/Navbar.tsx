import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LivePoolQuota from '../ui/LivePoolQuota';
import ReturnToPoolModal from '../modals/ReturnToPoolModal';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const [isReturnToPoolOpen, setIsReturnToPoolOpen] = useState(false);

  // Only show pool quota for superadmin and agent (not for child)
  const showPoolQuota = user?.role === 'superadmin' || user?.role === 'agent';
  
  // Only show Share Quota and Return to Pool buttons for agents
  const showAgentActions = user?.role === 'agent';

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
        {/* Live Pool Quota */}
        {showPoolQuota && (
          <div className="hidden md:flex items-center px-3 lg:px-4 py-2 bg-base-100/80 backdrop-blur-sm rounded-lg border border-base-content/10 shadow-lg">
            <LivePoolQuota showLabel={true} />
          </div>
        )}

        {/* Return to Pool Button - Only for Agents */}
        {showAgentActions && (
          <>
            {/* Mobile icon-only version */}
            <button 
              onClick={() => setIsReturnToPoolOpen(true)}
              className="md:hidden btn btn-circle btn-ghost btn-sm min-h-[2.5rem] min-w-[2.5rem]"
              title="Return unused quota to global pool"
              aria-label="Share to pool"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-warning flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary-content" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
                  <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
                </svg>
              </div>
            </button>
            
            {/* Desktop full button */}
            <button 
              onClick={() => setIsReturnToPoolOpen(true)}
              className="hidden md:flex items-center gap-2 lg:gap-3 group relative"
              title="Return unused quota to global pool"
            >
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-secondary to-warning flex items-center justify-center shadow-lg z-10 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5 text-secondary-content" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
                  <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
                </svg>
              </div>
              <div className="bg-secondary/20 text-secondary px-3 lg:px-4 py-1 lg:py-1.5 rounded-r-full rounded-l-none text-xs lg:text-sm font-bold -ml-4 lg:-ml-5 pl-6 lg:pl-7 shadow-md transition-transform group-hover:scale-105 border border-secondary/30">
                SHARE QUOTA
              </div>
            </button>
          </>
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
            <div className="bg-neutral text-neutral-content rounded-full w-9 h-9 sm:w-10 sm:h-10">
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

      {/* Return to Pool Modal */}
      <ReturnToPoolModal isOpen={isReturnToPoolOpen} onClose={() => setIsReturnToPoolOpen(false)} />
    </div>
  );
}
