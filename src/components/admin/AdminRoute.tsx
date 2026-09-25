import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('paperprofit_admin_auth') === 'true';
    const loginTime = Number(sessionStorage.getItem('paperprofit_admin_time') || 0);
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    // Check expiration
    if (isAuth && Date.now() - loginTime < TWELVE_HOURS) {
      setIsAuthenticated(true);
    } else {
      sessionStorage.removeItem('paperprofit_admin_auth');
      sessionStorage.removeItem('paperprofit_admin_time');
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}
