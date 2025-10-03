import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * StaffLoginRedirect Component
 * 
 * This component handles staff login redirects to ensure staff users 
 * are directed to the appropriate staff portal pages after login.
 * 
 * Usage: Import and use in your login success handler
 */

interface StaffLoginRedirectProps {
  userRole?: string;
  onRedirect?: (path: string) => void;
}

const StaffLoginRedirect: React.FC<StaffLoginRedirectProps> = ({ 
  userRole, 
  onRedirect 
}) => {
  const { user } = useAuth();
  
  useEffect(() => {
    const role = userRole || user?.role;
    
    if (role === 'staff' || role === 'admin') {
      const redirectPath = '/staff-portal';
      
      if (onRedirect) {
        onRedirect(redirectPath);
      }
      
      // Optionally, you can also programmatically navigate here
      // window.location.href = redirectPath;
    }
  }, [userRole, user, onRedirect]);

  // Determine redirect path based on user role
  const getRedirectPath = () => {
    const role = userRole || user?.role;
    
    switch (role) {
      case 'staff':
      case 'admin':
        return '/staff-portal';
      case 'doctor':
        return '/doctor-dashboard';
      case 'patient':
        return '/patient-dashboard';
      default:
        return '/dashboard';
    }
  };

  // If we have a user, redirect to appropriate dashboard
  if (user) {
    return <Navigate to={getRedirectPath()} replace />;
  }

  // Default fallback
  return <Navigate to="/login" replace />;
};

export default StaffLoginRedirect;