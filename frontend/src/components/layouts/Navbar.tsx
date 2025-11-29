import { useState } from 'react';
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
    <div className="navbar bg-base-100 shadow-sm z-10">
      <div className="flex-none lg:hidden">
        <button className="btn btn-square btn-ghost" onClick={onMenuClick}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-5 h-5 stroke-current"
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
      <div className="flex-1">
        <a className="btn btn-ghost text-xl normal-case">Agent Management</a>
      </div>
      <div className="flex-none flex items-center gap-4">
        {/* Live Pool Quota */}
        {showPoolQuota && (
          <div className="hidden md:flex items-center px-3 py-2 bg-base-200 rounded-lg">
            <LivePoolQuota showLabel={false} />
          </div>
        )}

        {/* Return to Pool Button - Only for Agents */}
        {showAgentActions && (
          <button 
            onClick={() => setIsReturnToPoolOpen(true)}
            className="flex items-center gap-3 group relative hidden md:flex"
            title="Return unused quota to global pool"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg z-10 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
                <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
              </svg>
            </div>
            <div className="bg-yellow-900 text-white px-4 py-1.5 rounded-r-full rounded-l-none text-sm font-medium -ml-5 pl-7 shadow-md transition-transform group-hover:scale-105">
              Share to Pool
            </div>
          </button>
        )}

        {/* User Info and Avatar */}
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-sm font-bold">{user?.name}</span>
          <span className="text-xs opacity-70 capitalize">{user?.role}</span>
        </div>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-10">
              <span className="text-xl">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <button onClick={() => logout()} className="btn btn-error btn-sm w-full text-white">Logout</button>
            </li>
          </ul>
        </div>
      </div>

      {/* Return to Pool Modal */}
      <ReturnToPoolModal isOpen={isReturnToPoolOpen} onClose={() => setIsReturnToPoolOpen(false)} />
    </div>
  );
}
