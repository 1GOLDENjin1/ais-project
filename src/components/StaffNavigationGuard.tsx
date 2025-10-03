// ===================================================
// STAFF NAVIGATION GUARD
// Universal component that ensures staff users can always return to Staff Dashboard
// from folder2
// ===================================================

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { BackToStaffDashboard, FixedBackToStaff } from '@/components/BackToStaffDashboard';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

interface StaffNavigationGuardProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  showFixedButton?: boolean;
  autoRedirectOnBack?: boolean;
}

export const StaffNavigationGuard: React.FC<StaffNavigationGuardProps> = ({
  children,
  showBackButton = true,
  showFixedButton = false,
  autoRedirectOnBack = true
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return;
    }

    // Set up staff navigation protection
    const currentPath = location.pathname;
    
    // Mark this as a staff-accessible page
    sessionStorage.setItem('staff_accessible_page', currentPath);
    sessionStorage.setItem('staff_navigation_protected', 'true');
    
    // Override back button behavior
    if (autoRedirectOnBack) {
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        
        // Check if we should return to staff dashboard
        const staffReturnPath = localStorage.getItem('staff_return_path') || '/staff-portal';
        
        // Force return to staff dashboard
        window.location.href = staffReturnPath;
      };

      // Add popstate listener
      window.addEventListener('popstate', handlePopState);
      
      // Push current state to enable back button interception
      window.history.pushState({ staffProtected: true }, '', currentPath);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [user, location.pathname, autoRedirectOnBack]);

  // Don't render guard for non-staff users
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Fixed back button overlay */}
      {showFixedButton && <FixedBackToStaff />}
      
      {/* Header back button */}
      {showBackButton && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
          <BackToStaffDashboard />
        </div>
      )}
      
      {/* Main content */}
      {children}
    </>
  );
};

// Hook to programmatically trigger staff return
export const useStaffReturn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const returnToStaffDashboard = () => {
    if (user && (user.role === 'staff' || user.role === 'admin')) {
      // Clear any existing navigation state
      sessionStorage.removeItem('staff_accessible_page');
      sessionStorage.setItem('staff_navigation_return', 'true');
      
      // Force navigation to staff portal
      window.location.href = '/staff-portal';
    }
  };

  const isStaffUser = user?.role === 'staff' || user?.role === 'admin';

  return { returnToStaffDashboard, isStaffUser };
};

// Component that adds staff return functionality to any page
export const WithStaffReturn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Auto-add navigation guard for staff users
  if (user && (user.role === 'staff' || user.role === 'admin')) {
    return (
      <StaffNavigationGuard showBackButton={true} showFixedButton={false}>
        {children}
      </StaffNavigationGuard>
    );
  }

  return <>{children}</>;
};

// Emergency staff return button (for any situation)
export const EmergencyStaffReturn: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only show for staff/admin users
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return null;
  }

  // Don't show if already in staff portal or admin pages
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/staff') || currentPath.startsWith('/admin')) {
    return null;
  }

  const handleEmergencyReturn = () => {
    // Set staff navigation flags
    sessionStorage.setItem('staff_navigation_active', 'true');
    sessionStorage.setItem('staff_portal_active', 'true');
    localStorage.setItem('staff_return_path', '/staff-portal');
    localStorage.setItem('emergency_staff_return', 'true');
    localStorage.setItem('current_user_role', user.role);
    
    // Navigate back to staff portal
    navigate('/staff-portal');
  };

  return (
    <Button
      onClick={handleEmergencyReturn}
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 animate-pulse hover:animate-none transition-all"
    >
      <Home className="h-5 w-5" />
      <span>Return to Staff Portal</span>
    </Button>
  );
};