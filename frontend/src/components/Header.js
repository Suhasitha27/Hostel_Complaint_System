import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

function Header() {
  const token = localStorage.getItem('token');
  const location = useLocation();

  // Determine if we're on authentication pages
  const isAuthPage = location.pathname === '/' || location.pathname === '/signup';
  const justifyClass = isAuthPage ? 'justify-center' : 'justify-between';

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className={`flex items-center ${justifyClass}`}>
          <div className={isAuthPage ? 'w-full text-center' : 'flex-1 text-center md:text-left'}>
            <h1 className="text-2xl md:text-3xl font-bold">
              Digital Hostel Service Request Management
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Only show notifications when authenticated and not on auth pages */}
            {token && !isAuthPage && <NotificationBell />}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
