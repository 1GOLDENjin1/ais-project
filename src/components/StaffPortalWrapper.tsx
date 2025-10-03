import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StaffRoutingSystem from '@/components/StaffRoutingSystem';

interface StaffPortalWrapperProps {
  onLogout?: () => void;
}

const StaffPortalWrapper: React.FC<StaffPortalWrapperProps> = ({ onLogout }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff portal...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if user is not staff
  if (user.role !== 'staff' && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <StaffRoutingSystem onLogout={onLogout} />;
};

export default StaffPortalWrapper;