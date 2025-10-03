import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DoctorRoutingSystem from './DoctorRoutingSystem';

interface DoctorPortalWrapperProps {
  onLogout?: () => void;
}

const DoctorPortalWrapper: React.FC<DoctorPortalWrapperProps> = ({ onLogout }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctor portal...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has doctor role (assuming role is stored in user object)
  // You may need to adjust this based on your actual user structure
  if (user.role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to access the doctor portal.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Current role: {user.role || 'No role assigned'}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Render the doctor portal
  return <DoctorRoutingSystem onLogout={onLogout} />;
};

export default DoctorPortalWrapper;