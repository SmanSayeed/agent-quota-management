import { useAuthStore } from '../../store/authStore';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();

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
      <div className="flex-none flex items-center gap-2">
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
    </div>
  );
}
