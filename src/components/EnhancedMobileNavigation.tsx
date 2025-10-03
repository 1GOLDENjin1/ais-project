import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Menu,
  Home,
  Calendar,
  Activity,
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  Plus,
  FileText,
  Heart,
  TestTube,
  Phone,
  Video,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
  X
} from 'lucide-react';

interface MobileNavigationProps {
  unreadNotifications?: number;
  upcomingAppointments?: number;
}

export const EnhancedMobileNavigation: React.FC<MobileNavigationProps> = ({
  unreadNotifications = 0,
  upcomingAppointments = 0
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    {
      label: 'Book Appointment',
      icon: Plus,
      action: () => navigate('/book-appointment'),
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Schedule with a doctor'
    },
    {
      label: 'Emergency',
      icon: Phone,
      action: () => navigate('/emergency'),
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Get immediate help'
    },
    {
      label: 'Video Call',
      icon: Video,
      action: () => navigate('/video-call'),
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Join consultation'
    },
    {
      label: 'Message Doctor',
      icon: MessageSquare,
      action: () => navigate('/send-message'),
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Chat with healthcare team'
    }
  ];

  const mainNavItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      badge: null
    },
    {
      label: 'Appointments',
      icon: Calendar,
      path: '/appointments',
      badge: upcomingAppointments > 0 ? upcomingAppointments : null
    },
    {
      label: 'Health Metrics',
      icon: Activity,
      path: '/health-metrics',
      badge: null
    },
    {
      label: 'Messages',
      icon: MessageSquare,
      path: '/send-message',
      badge: null
    },
    {
      label: 'Lab Results',
      icon: TestTube,
      path: '/lab-results',
      badge: null
    },
    {
      label: 'Medical Records',
      icon: FileText,
      path: '/medical-records',
      badge: null
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/notifications',
      badge: unreadNotifications > 0 ? unreadNotifications : null
    }
  ];

  const settingsItems = [
    {
      label: 'Profile Settings',
      icon: User,
      path: '/profile',
      description: 'Update personal information'
    },
    {
      label: 'Privacy & Security',
      icon: Shield,
      path: '/privacy',
      description: 'Manage your data and security'
    },
    {
      label: 'Billing & Payments',
      icon: CreditCard,
      path: '/billing',
      description: 'View payment history'
    },
    {
      label: 'Help & Support',
      icon: HelpCircle,
      path: '/support',
      description: 'Get help and contact support'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-white">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Menu</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 p-1"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {user && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white/30">
                        <AvatarFallback className="bg-white/20 text-white font-bold">
                          {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-blue-100 text-sm">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        onClick={action.action}
                        className={`${action.color} text-white p-3 h-auto flex flex-col items-center gap-2`}
                      >
                        <action.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Navigation
                    </h3>
                    <nav className="space-y-1">
                      {mainNavItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNavigation(item.path)}
                          className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                            <span className="font-medium text-gray-900 group-hover:text-blue-600">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          </div>
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Settings
                    </h3>
                    <nav className="space-y-1">
                      {settingsItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNavigation(item.path)}
                          className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                            <div>
                              <span className="font-medium text-gray-900 group-hover:text-blue-600 block">
                                {item.label}
                              </span>
                              <span className="text-xs text-gray-500">{item.description}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-bold text-gray-900">HealthCare</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/notifications')}
            className="relative p-2"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Badge>
            )}
          </Button>
          
          <Avatar 
            className="h-8 w-8 cursor-pointer" 
            onClick={() => navigate('/profile')}
          >
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Bottom Navigation (Alternative mobile nav) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center gap-1 p-2 min-w-0"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/appointments')}
            className="flex flex-col items-center gap-1 p-2 min-w-0 relative"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Appointments</span>
            {upcomingAppointments > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-blue-500 text-white text-xs">
                {upcomingAppointments}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/book-appointment')}
            className="flex flex-col items-center gap-1 p-2 min-w-0 bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-full"
          >
            <Plus className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/health-metrics')}
            className="flex flex-col items-center gap-1 p-2 min-w-0"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Health</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/send-message')}
            className="flex flex-col items-center gap-1 p-2 min-w-0"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Messages</span>
          </Button>
        </div>
      </div>
    </>
  );
};