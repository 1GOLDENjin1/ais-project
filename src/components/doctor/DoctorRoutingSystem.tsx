import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  MessageSquare, 
  FileText,
  Stethoscope,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Home,
  ChevronDown,
  Menu,
  X,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DoctorManagementService, { DoctorProfile, DoctorAppointment } from '@/services/doctorDatabaseService';

// Import doctor-specific components
import DoctorDashboardMain from './DoctorDashboardMain';
import DoctorAppointments from './DoctorAppointments';
import DoctorPatients from './DoctorPatients';
import DoctorMedicalRecords from './DoctorMedicalRecords';

import DoctorScheduleManagement from './DoctorScheduleManagement';
import DoctorMessages from './DoctorMessages';

type DoctorView = 'dashboard' | 'appointments' | 'patients' | 'records' | 'schedule' | 'messages' | 'profile';

const DoctorRoutingSystem: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // State management
  const [currentView, setCurrentView] = useState<DoctorView>('dashboard');
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<DoctorAppointment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard' as DoctorView,
      label: 'Dashboard',
      icon: Home,
      description: 'Overview and today\'s schedule'
    },
    {
      id: 'appointments' as DoctorView,
      label: 'Appointments',
      icon: Calendar,
      description: 'Manage patient appointments'
    },
    {
      id: 'patients' as DoctorView,
      label: 'My Patients',
      icon: Users,
      description: 'Patient information and history'
    },
    {
      id: 'records' as DoctorView,
      label: 'Medical Records',
      icon: FileText,
      description: 'Patient records and prescriptions'
    },
    {
      id: 'schedule' as DoctorView,
      label: 'Schedule',
      icon: Clock,
      description: 'Manage availability and time slots'
    },
    {
      id: 'messages' as DoctorView,
      label: 'Messages',
      icon: MessageSquare,
      description: 'Patient communications'
    }
  ];

  // Load doctor profile and initial data
  useEffect(() => {
    if (user?.role !== 'doctor') {
      // Don't redirect - let the auth system handle it
      // This prevents unwanted redirects on page reload
      return;
    }

    loadDoctorData();
  }, [user, navigate]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!doctorProfile) return;

    const appointmentSubscription = DoctorManagementService.subscribeToMyAppointments(
      doctorProfile.id,
      (payload) => {
        console.log('Appointment update:', payload);
        loadTodayAppointments();
      }
    );

    return () => {
      // DoctorManagementService.unsubscribe(appointmentSubscription);
    };
  }, [doctorProfile]);

  const loadDoctorData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch the actual doctor row by the current user's id
      const profile = await DoctorManagementService.getDoctorProfileByUserId(user.id);
      
      if (profile) {
        setDoctorProfile(profile);
        await loadTodayAppointments(profile.id);
      } else {
        toast({
          title: "Profile Not Found",
          description: "Doctor profile not found. Please contact administration.",
          variant: "destructive"
        });
        // Don't redirect - show error message but stay on page
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load doctor profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAppointments = async (doctorId?: string) => {
    if (!doctorProfile && !doctorId) return;
    
    try {
      const appointments = await DoctorManagementService.getTodaysAppointments(
        doctorId || doctorProfile!.id
      );
      setTodayAppointments(appointments);
    } catch (error) {
      console.error('Error loading today appointments:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderCurrentView = () => {
    if (!doctorProfile) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading doctor profile...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <DoctorDashboardMain doctorProfile={doctorProfile} />;
      case 'appointments':
        return <DoctorAppointments doctorProfile={doctorProfile} />;
      case 'patients':
        return <DoctorPatients doctorProfile={doctorProfile} />;
      case 'records':
        return <DoctorMedicalRecords doctorProfile={doctorProfile} />;

      case 'schedule':
        return <DoctorScheduleManagement doctorProfile={doctorProfile} />;
      case 'messages':
        return <DoctorMessages doctorProfile={doctorProfile} />;
      case 'profile':
        return (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Settings</h3>
            <p className="text-gray-500">Profile management coming soon...</p>
          </div>
        );
      default:
        return <DoctorDashboardMain doctorProfile={doctorProfile} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Doctor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex-shrink-0 flex items-center ml-2">
                <Stethoscope className="h-8 w-8 text-blue-600 mr-2" />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">Doctor Portal</h1>
                  <p className="text-sm text-gray-500">Healthcare Management System</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                {navigationItems.slice(0, 4).map((item) => (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center space-x-2 ${
                      currentView === item.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Right side - Quick actions and user menu */}
            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Quick Actions</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setCurrentView('appointments')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>View Appointments</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('records')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Create Medical Record</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setCurrentView('schedule')}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Update Schedule</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {doctorProfile?.users?.name?.split(' ').map(n => n[0]).join('') || 'DR'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Dr. {doctorProfile?.users?.name || 'Doctor'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {doctorProfile?.specialty || 'Specialty'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {doctorProfile?.users?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrentView('profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('schedule')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Doctor Portal</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentView(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb/Current View Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {navigationItems.find(item => item.id === currentView)?.label || 'Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              {navigationItems.find(item => item.id === currentView)?.description}
            </p>
          </div>
          
          {/* Desktop Quick Navigation */}
          <div className="hidden lg:flex space-x-2">
            {navigationItems.slice(4).map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView(item.id)}
                className="flex items-center space-x-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Current View Content */}
        <div className="space-y-6">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
};

export default DoctorRoutingSystem;