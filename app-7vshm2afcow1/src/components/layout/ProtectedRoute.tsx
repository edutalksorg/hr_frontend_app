import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from './MainLayout';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    console.log('🔒 ProtectedRoute: Loading authentication...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  const normalizedUserRole = String(user.role || '').toLowerCase().replace('role_', '').trim();
  const normalizedAllowedRoles = allowedRoles?.map(r => r.toLowerCase().trim());

  if (allowedRoles && normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedUserRole)) {
    console.log('🚫 ProtectedRoute: Access denied. User role:', normalizedUserRole, 'Allowed:', normalizedAllowedRoles);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600 max-w-md">
            You do not have permission to access this page. <br />
            Current Role: <span className="font-mono bg-slate-200 px-1 rounded">{user.role}</span>
          </p>
          <a href="/dashboard" className="inline-block px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;
