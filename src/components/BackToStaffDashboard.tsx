// ===================================================
// BACK TO STAFF DASHBOARD BUTTON
// Universal back button component that ensures return to Staff Dashboard
// from folder2
// ===================================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface BackToStaffDashboardProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  position?: 'fixed' | 'relative';
}

export const BackToStaffDashboard: React.FC<BackToStaffDashboardProps> = ({
  variant = 'outline',
  size = 'default',
  showIcon = true,
  showText = true,
  className = '',
  position = 'relative'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToStaff = () => {
    // Clear any navigation state
    sessionStorage.removeItem('redirect_after_login');
    localStorage.setItem('staff_return_path', '/staff-portal');
    
    // Force navigation to staff portal
    window.location.href = '/staff-portal';
  };

  // Only show for staff users
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return null;
  }

  const buttonClasses = `
    ${position === 'fixed' ? 'fixed top-4 left-4 z-50' : ''}
    ${className}
  `;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBackToStaff}
      className={buttonClasses}
    >
      {showIcon && (
        <div className="flex items-center mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <Shield className="h-4 w-4" />
        </div>
      )}
      {showText && 'Back to Staff Dashboard'}
    </Button>
  );
};

// Fixed position variant for overlaying on any page
export const FixedBackToStaff: React.FC = () => (
  <BackToStaffDashboard
    position="fixed"
    variant="default"
    size="sm"
    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
  />
);

// Compact version for tight spaces
export const CompactBackToStaff: React.FC = () => (
  <BackToStaffDashboard
    variant="ghost"
    size="sm"
    showText={false}
    className="p-2"
  />
);

// Header version for navigation bars
export const HeaderBackToStaff: React.FC = () => (
  <BackToStaffDashboard
    variant="outline"
    size="default"
    className="border-gray-300"
  />
);