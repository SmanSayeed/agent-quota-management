import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-2"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={(e) => setIsDrawerOpen(e.target.checked)}
      />
      <div className="drawer-content flex flex-col min-h-screen bg-base-100">
        <Navbar onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <div className="drawer-side z-[100]">
        <label
          aria-label="close sidebar"
          className="drawer-overlay cursor-pointer"
          onClick={() => setIsDrawerOpen(false)}
        ></label>
        <Sidebar onClose={() => setIsDrawerOpen(false)} />
      </div>
    </div>
  );
}
