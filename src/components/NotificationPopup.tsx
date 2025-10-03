// ===================================================
// NOTIFICATION POPUP COMPONENT
// Dropdown notification panel for navbar
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell,
  Calendar,
  TestTube,
  Pill,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  X,
  Eye,
  MoreHorizontal,
  Settings,
  Check,
  AlertCircle,
  Info,
  Zap,
  CreditCard,
  FileText,
  User,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationService, type Notification } from '@/services/notificationService';

interface NotificationPopupProps {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  userId,
  onNotificationClick,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const popupRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await notificationService.getNotifications(userId, { 
        limit: 20,
        unreadOnly: activeTab === 'unread'
      });
      
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    const channel = notificationService.subscribeToNotifications(
      userId,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          });
        }
      },
      (updatedNotification) => {
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        if (updatedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      },
      (deletedId) => {
        setNotifications(prev => prev.filter(n => n.id !== deletedId));
      }
    );

    return () => {
      notificationService.unsubscribeFromNotifications(userId);
    };
  }, [userId, activeTab]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'urgent' ? 'text-red-500' : 
                     priority === 'high' ? 'text-orange-500' : 
                     priority === 'medium' ? 'text-blue-500' : 'text-gray-500';
    
    switch (type) {
      case 'appointment': return <Calendar className={`h-4 w-4 ${iconClass}`} />;
      case 'payment': return <CreditCard className={`h-4 w-4 ${iconClass}`} />;
      case 'record': return <FileText className={`h-4 w-4 ${iconClass}`} />;
      case 'message': return <MessageSquare className={`h-4 w-4 ${iconClass}`} />;
      case 'reminder': return <Clock className={`h-4 w-4 ${iconClass}`} />;
      case 'system': return <Settings className={`h-4 w-4 ${iconClass}`} />;
      default: return <Bell className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id);
    }

    // Handle action
    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      {/* Notification Bell Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={togglePopup}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Popup */}
      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-96 max-h-[500px] shadow-lg border-0 bg-white z-50">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mt-3">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  activeTab === 'unread'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-full max-h-96">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm font-medium ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            } line-clamp-1`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.is_read && (
                                <div className={`h-2 w-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            
                            {notification.metadata?.sender && (
                              <span className="text-xs text-gray-400">
                                from {notification.metadata.sender}
                              </span>
                            )}
                          </div>

                          {/* Action button */}
                          {notification.metadata?.action_text && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="mt-2 text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              {notification.metadata.action_text}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {activeTab === 'unread' 
                      ? "You're all caught up!" 
                      : "New notifications will appear here"
                    }
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="border-t border-gray-100 p-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationPopup;