import { Button } from "@/components/ui/button";
import { User, Menu, Package, Settings, Bell, Home, ShoppingCart, Calendar, MessageCircle, Video, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { MessagingService } from "@/services/messagingService";
import { VideoSDKService } from "@/services/videoSDKService";
import { MessagingModal } from "./MessagingModal";
import { VideoCallModal } from "./VideoCallModal";
import NotificationPopup from "./NotificationPopup";
import type { Notification } from "@/services/notificationService";

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  
  const messagingService = MessagingService.getInstance();
  const videoSDKService = VideoSDKService.getInstance();

  useEffect(() => {
    if (user) {
      // Load unread message count
      loadUnreadCount();
      
      // Subscribe to real-time updates
      const messageChannel = messagingService.subscribeToMessages(
        user.id,
        () => {
          loadUnreadCount(); // Reload count when new message arrives
        },
        () => {
          loadUnreadCount(); // Reload count when message is read
        }
      );

      return () => {
        messageChannel.unsubscribe();
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (user) {
      try {
        const threads = await messagingService.getMessageThreads(user.id);
        const totalUnread = threads.reduce((sum, thread) => sum + (thread.unread_count || 0), 0);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    }
  };

  const handleMessagingClick = () => {
    setShowMessaging(true);
  };

  const handleVideoCallClick = () => {
    setShowVideoCall(true);
  };

    const handleLogoutClick = async () => {
    console.log('🖱️ Logout button clicked in Navigation');
    try {
      await logout();
      console.log('✅ Logout completed, navigating to login');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force redirect even if logout fails
      console.log('🔀 Force redirecting to login due to logout error');
      navigate('/login', { replace: true });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Handle notification click actions based on type
    if (notification.metadata?.action_url) {
      navigate(notification.metadata.action_url);
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'appointment':
          navigate('/dashboard');
          break;
        case 'payment':
          navigate('/payments');
          break;
        case 'record':
          navigate('/medical-records');
          break;
        default:
          break;
      }
    }
  };

  return (
    <nav className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/95acf376-10b9-4fad-927e-89c2971dd7be.png" 
              alt="Mendoza Diagnostic Center Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold text-foreground">Mendoza Diagnostic Center</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Hide Home, Services and Packages for admin users */}
            {user?.role !== 'admin' && (
              <>
                <Link to="/">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Services</span>
                  </Button>
                </Link>
                <Link to="/package">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Packages</span>
                  </Button>
                </Link>
              </>
            )}

            {user ? (
              <>
                {user.role === 'patient' && (
                  <Link to="/dashboard">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                )}
                {user.role === 'doctor' && (
                  <Link to="/doctor-dashboard">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Doctor Portal</span>
                    </Button>
                  </Link>
                )}
                {user.role === 'staff' && (
                  <Link to="/staff-dashboard">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Practitioner Portal</span>
                    </Button>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Admin Portal</span>
                    </Button>
                  </Link>
                )}
                {/* Messaging */}
                <Button variant="ghost" size="icon" className="relative" onClick={handleMessagingClick}>
                  <MessageCircle className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{unreadCount}</span>
                    </span>
                  )}
                </Button>

                {/* Video Call - hidden for doctors and admins */}
                {user.role !== 'doctor' && user.role !== 'admin' && (
                  <Button variant="ghost" size="icon" onClick={handleVideoCallClick}>
                    <Video className="h-4 w-4" />
                  </Button>
                )}

                {/* Notifications - hidden for admins */}
                {user.role !== 'admin' && (
                  <NotificationPopup 
                    userId={user.id}
                    onNotificationClick={handleNotificationClick}
                  />
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user.name}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogoutClick();
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="medical" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messaging Modal */}
      <MessagingModal 
        isOpen={showMessaging} 
        onClose={() => setShowMessaging(false)} 
      />

      {/* Video Call Modal - hidden for doctors and admins */}
      {user?.role !== 'doctor' && user?.role !== 'admin' && (
        <VideoCallModal 
          isOpen={showVideoCall} 
          onClose={() => setShowVideoCall(false)} 
        />
      )}
    </nav>
  );
};

export default Navigation;