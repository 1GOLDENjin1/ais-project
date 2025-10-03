/**
 * Protected Route Component
 * Handles role-based access control and authentication routing
 */

import React, { useEffect, useState } from 'react';
import { authService } from '@/services/auth-service';
import type { HealthcareUser } from '@/services/healthcare-service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  fallback = null,
  redirectTo
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState<HealthcareUser | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        setHasAccess(false);
        setUser(null);
        setIsChecking(false);
        
        // Redirect to login if specified
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
        return;
      }

      setUser(currentUser);

      // Check role permissions
      if (allowedRoles.length === 0 || allowedRoles.includes(currentUser.role)) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        
        // Redirect to appropriate dashboard if user has wrong role
        if (redirectTo === undefined) {
          const userRedirect = authService.getRedirectPath(currentUser.role);
          window.location.href = userRedirect;
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [allowedRoles, redirectTo]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          {user && (
            <div className="mb-6 p-4 bg-gray-100 rounded">
              <p className="text-sm text-gray-700">
                Logged in as: <strong>{user.name}</strong> ({user.role})
              </p>
            </div>
          )}
          <button
            onClick={() => {
              const userRedirect = user 
                ? authService.getRedirectPath(user.role) 
                : '/login';
              window.location.href = userRedirect;
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {user ? 'Go to Dashboard' : 'Go to Login'}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Role-specific route components
export const PatientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['patient']} redirectTo="/login">
    {children}
  </ProtectedRoute>
);

export const DoctorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['doctor']} redirectTo="/login">
    {children}
  </ProtectedRoute>
);

export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['staff', 'admin']} redirectTo="/login">
    {children}
  </ProtectedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
    {children}
  </ProtectedRoute>
);

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<HealthcareUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsChecking(false);
    
    // Redirect authenticated users to their dashboard
    if (currentUser) {
      const redirectPath = authService.getRedirectPath(currentUser.role);
      window.location.href = redirectPath;
    }
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show public content only if user is not authenticated
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
};