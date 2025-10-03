// ===================================================
// STAFF PORTAL NAVIGATION CONTEXT - from folder2
// Ensures proper back navigation to Staff Portal Dashboard
// ===================================================

import React, { createContext, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface StaffNavigationContextType {
  returnToStaffDashboard: () => void;
  setReturnPath: (path: string) => void;
  getReturnPath: () => string;
}

const StaffNavigationContext = createContext<StaffNavigationContextType | null>(null);

export const StaffNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const STAFF_DASHBOARD_PATH = '/staff-portal';
  const STAFF_RETURN_KEY = 'staff_return_path';

  // Set the staff portal as return path whenever user is in staff areas
  useEffect(() => {
    const currentPath = location.pathname;
    
    // If user is in staff portal area, set it as the return path
    if (currentPath.startsWith('/staff')) {
      localStorage.setItem(STAFF_RETURN_KEY, STAFF_DASHBOARD_PATH);
    }
    
    // Store browser history for staff navigation
    if (currentPath.startsWith('/staff') || currentPath.includes('staff')) {
      sessionStorage.setItem('last_staff_path', currentPath);
    }
  }, [location.pathname]);

  const returnToStaffDashboard = () => {
    // Clear any existing navigation state
    localStorage.setItem(STAFF_RETURN_KEY, STAFF_DASHBOARD_PATH);
    sessionStorage.setItem('last_staff_path', STAFF_DASHBOARD_PATH);
    
    // Navigate back to staff dashboard
    navigate(STAFF_DASHBOARD_PATH, { replace: true });
  };

  const setReturnPath = (path: string) => {
    localStorage.setItem(STAFF_RETURN_KEY, path);
  };

  const getReturnPath = (): string => {
    return localStorage.getItem(STAFF_RETURN_KEY) || STAFF_DASHBOARD_PATH;
  };

  const contextValue: StaffNavigationContextType = {
    returnToStaffDashboard,
    setReturnPath,
    getReturnPath
  };

  return (
    <StaffNavigationContext.Provider value={contextValue}>
      {children}
    </StaffNavigationContext.Provider>
  );
};

export const useStaffNavigation = () => {
  const context = useContext(StaffNavigationContext);
  if (!context) {
    throw new Error('useStaffNavigation must be used within a StaffNavigationProvider');
  }
  return context;
};