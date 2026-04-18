import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/hooks/useAuth';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, isAuthenticated, tenant } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Intravos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (tenant) {
    if (tenant.subscription_status === 'suspended' || !tenant.is_active) {
      return <Navigate to="/suspended" replace />;
    }
  }

  return <>{children}</>;
};
