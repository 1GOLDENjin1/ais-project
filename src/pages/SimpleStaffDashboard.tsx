/**
 * Simple Staff Dashboard - from folder2
 * Clean interface for staff to access patient records
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, LogOut, Search } from 'lucide-react';

export const SimpleStaffDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const handlePatientRecords = () => {
    navigate('/staff/patient-records');
  };

  // Get staff name from user object
  const staffName = user?.name?.split(' ')[0] || 'Staff';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-100">
      {/* Header Navigation */}
      <header className="bg-gradient-to-r from-cyan-400 to-blue-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-white text-lg font-semibold">
                Mendoza Diagnostic Center
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <button className="text-white hover:text-blue-100 font-medium transition-colors">
                Home
              </button>
              <button className="text-white hover:text-blue-100 font-medium transition-colors">
                Services
              </button>
              <button className="text-white hover:text-blue-100 font-medium transition-colors">
                Packages
              </button>
              <button className="text-white hover:text-blue-100 font-medium transition-colors">
                About Us
              </button>
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Greeting */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800">
            Good morning, {staffName}!
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients, appointments, or services..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Patients Record Button */}
        <div className="flex justify-center">
          <button
            onClick={handlePatientRecords}
            className="group relative overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-20 py-12 rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative flex flex-col items-center space-y-4">
              <Users className="h-16 w-16" />
              <span className="text-3xl font-bold">Patients Record</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default SimpleStaffDashboard;
