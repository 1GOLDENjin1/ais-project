import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Stethoscope, 
  FileText, 
  Settings, 
  Home,
  Bell,
  Search,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Import all staff management components
import ImprovedStaffDashboard from '@/components/ImprovedStaffDashboard';
import AppointmentManagement from '@/components/AppointmentManagement';
import DoctorManagement from '@/components/DoctorManagement';
import StaffManagementInterface from '@/components/StaffManagementInterface';

interface StaffRoutingSystemProps {
  onLogout?: () => void;
}

const StaffRoutingSystem: React.FC<StaffRoutingSystemProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Navigation items for staff
  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      component: ImprovedStaffDashboard,
      description: 'Overview and quick actions'
    },
    {
      id: 'appointments',
      name: 'Appointments',
      icon: Calendar,
      component: AppointmentManagement,
      description: 'Manage patient appointments'
    },
    {
      id: 'doctors',
      name: 'Doctors',
      icon: Stethoscope,
      component: DoctorManagement,
      description: 'Doctor profiles and schedules'
    },
    {
      id: 'management',
      name: 'Full Management',
      icon: Settings,
      component: StaffManagementInterface,
      description: 'Complete system management'
    }
  ];

  const handleLogout = async () => {
    console.log('🔴 Staff logout function called');
    try {
      await logout();
      console.log('✅ Logout successful');
      if (onLogout) {
        onLogout();
      }
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const currentNavItem = navigationItems.find(item => item.id === currentPage);
  const CurrentComponent = currentNavItem?.component || ImprovedStaffDashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Mobile Navigation Trigger */}
      <div className="lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
            <div className="flex items-center space-x-3">
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <h1 className="text-xl font-bold text-blue-600">Practitioner Portal</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-400" />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Practitioner Navigation</SheetTitle>
              <SheetDescription>
                Access all practitioner management tools and features
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.name || 'Practitioner'}</p>
                    <p className="text-xs text-blue-600">Practitioner Portal</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 bg-white border-r shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Practitioner Portal</h1>
                <p className="text-blue-100 text-sm">Healthcare Management</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search features..."
                className="pl-10 bg-white"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  {isActive && (
                    <Badge className="bg-blue-500 hover:bg-blue-600">
                      Active
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t bg-gray-50">
            <div className="p-3 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user?.name || 'Practitioner'}</p>
                  <p className="text-sm text-blue-600">Practitioner Portal</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full mt-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-80">
          {/* Top Header for Desktop */}
          <div className="hidden lg:flex items-center justify-between p-6 bg-white border-b shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentNavItem?.name}</h2>
              <p className="text-gray-600">{currentNavItem?.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge className="ml-2 bg-red-500 text-white">3</Badge>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                </div>
                <span className="font-medium text-gray-700">{user?.name || 'Practitioner'}</span>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <CurrentComponent />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StaffRoutingSystem;