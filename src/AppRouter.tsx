/**
 * Main App Router
 * Routes users to appropriate dashboards based on their role
 */

import React, { useEffect, useState } from 'react';
import { authService } from '@/services/auth-service';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { PatientDashboard } from '@/pages/PatientDashboard';
import { NewDoctorDashboard } from '@/pages/NewDoctorDashboard';
import { StaffDashboard } from '@/pages/StaffDashboard';

// User type definition
interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  phone?: string;
}

type ViewMode = 'login' | 'signup' | 'dashboard';

const AppRouter: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication session on app load
    const checkAuthSession = () => {
      try {
        const context = authService.getCurrentContext();
        if (context?.user) {
          setCurrentUser(context.user);
          setViewMode('dashboard');
        } else {
          setViewMode('login');
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        setViewMode('login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthSession();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setViewMode('dashboard');
  };

  const handleSignupSuccess = (user: User) => {
    setCurrentUser(user);
    setViewMode('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate view based on current state
  if (viewMode === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={() => setViewMode('signup')}
      />
    );
  }

  if (viewMode === 'signup') {
    return (
      <SignupPage
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={() => setViewMode('login')}
      />
    );
  }

  // Dashboard view - route based on user role
  if (viewMode === 'dashboard' && currentUser) {
    switch (currentUser.role) {
      case 'patient':
        return <PatientDashboard onLogout={handleLogout} />;
        
      case 'doctor':
        return <NewDoctorDashboard />;
        
      case 'staff':
      case 'admin':
        return <StaffDashboard />;
        
      default:
        console.error('Unknown user role:', currentUser.role);
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              <h2 className="font-medium mb-2">Access Error</h2>
              <p>Unknown user role. Please contact system administrator.</p>
              <button
                onClick={handleLogout}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Return to Login
              </button>
            </div>
          </div>
        );
    }
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-md">
        <p>Application state error. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default AppRouter;