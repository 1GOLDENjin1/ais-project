// ===================================================
// NOTIFICATIONS PAGE
// Full notification management interface
// ===================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, type Notification } from '@/services/notificationService';
import { EnhancedNotifications } from '@/components/EnhancedNotifications';
import { 
  Bell,
  Search,
  Filter,
  CheckCircle,
  Trash2,
  Settings,
  Download,
  RefreshCw,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    recentActivity: 0
  });

  // Load notifications and stats
  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [notificationsResult, statsResult] = await Promise.all([
        notificationService.getNotifications(user.id, { limit: 100 }),
        notificationService.getNotificationStats(user.id)
      ]);

      setNotifications(notificationsResult.notifications);
      setStats(statsResult);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    loadData();

    const channel = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1,
          recentActivity: prev.recentActivity + 1
        }));
      },
      (updatedNotification) => {
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        if (updatedNotification.is_read) {
          setStats(prev => ({
            ...prev,
            unread: Math.max(0, prev.unread - 1)
          }));
        }
      },
      (deletedId) => {
        setNotifications(prev => prev.filter(n => n.id !== deletedId));
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }));
      }
    );

    return () => {
      notificationService.unsubscribeFromNotifications(user.id);
    };
  }, [user?.id]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  // Handle notification actions
  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    await notificationService.markAllAsRead(user.id);
    loadData(); // Refresh data
  };

  const handleDelete = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
  };

  const handleNotificationAction = (notification: Notification) => {
    // Handle notification-specific actions
    console.log('Notification action:', notification);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your latest activities</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Unread</p>
                <p className="text-2xl font-bold text-red-900">{stats.unread}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Recent (24h)</p>
                <p className="text-2xl font-bold text-green-900">{stats.recentActivity}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Types</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Object.keys(stats.byType).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Types</option>
              <option value="appointment">Appointments</option>
              <option value="payment">Payments</option>
              <option value="record">Records</option>
              <option value="message">Messages</option>
              <option value="reminder">Reminders</option>
              <option value="system">System</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <EnhancedNotifications
        notifications={filteredNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onAction={handleNotificationAction}
        variant="full"
      />

      {/* Empty State */}
      {filteredNotifications.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || selectedType !== 'all' || selectedPriority !== 'all' 
                ? 'No matching notifications' 
                : 'No notifications yet'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedType !== 'all' || selectedPriority !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'New notifications will appear here when they arrive.'
              }
            </p>
            {(searchTerm || selectedType !== 'all' || selectedPriority !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedPriority('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationsPage;