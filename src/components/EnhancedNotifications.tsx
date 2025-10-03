import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Filter,
  Check,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'result' | 'reminder' | 'system' | 'message' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  sender?: string;
  metadata?: {
    appointment_id?: string;
    doctor_name?: string;
    result_type?: string;
  };
}

interface EnhancedNotificationsProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (notificationId: string) => void;
  onAction?: (notification: Notification) => void;
  variant?: 'full' | 'compact';
}

export const EnhancedNotifications: React.FC<EnhancedNotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onAction,
  variant = 'full'
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'urgent' ? 'text-red-600' : 
                     priority === 'high' ? 'text-orange-600' : 
                     priority === 'medium' ? 'text-blue-600' : 'text-gray-600';
    
    switch (type) {
      case 'appointment': return <Calendar className={`h-5 w-5 ${iconClass}`} />;
      case 'result': return <TestTube className={`h-5 w-5 ${iconClass}`} />;
      case 'reminder': return <Clock className={`h-5 w-5 ${iconClass}`} />;
      case 'message': return <MessageSquare className={`h-5 w-5 ${iconClass}`} />;
      case 'alert': return <AlertTriangle className={`h-5 w-5 ${iconClass}`} />;
      case 'system': return <Info className={`h-5 w-5 ${iconClass}`} />;
      default: return <Bell className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-50 border-l-blue-500';
      case 'result': return 'bg-green-50 border-l-green-500';
      case 'reminder': return 'bg-yellow-50 border-l-yellow-500';
      case 'message': return 'bg-purple-50 border-l-purple-500';
      case 'alert': return 'bg-red-50 border-l-red-500';
      case 'system': return 'bg-gray-50 border-l-gray-500';
      default: return 'bg-white border-l-gray-300';
    }
  };

  const filterNotifications = (filter: string) => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.is_read);
      case 'urgent': return notifications.filter(n => n.priority === 'urgent' || n.priority === 'high');
      case 'appointments': return notifications.filter(n => n.type === 'appointment');
      case 'results': return notifications.filter(n => n.type === 'result');
      default: return notifications;
    }
  };

  const getTabCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      urgent: notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length,
      appointments: notifications.filter(n => n.type === 'appointment').length,
      results: notifications.filter(n => n.type === 'result').length
    };
  };

  const tabCounts = getTabCounts();
  const filteredNotifications = filterNotifications(activeTab);

  if (variant === 'compact') {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notifications
              {tabCounts.unread > 0 && (
                <Badge className="bg-red-500 text-white">{tabCounts.unread}</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
              Mark all read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm ${
                getTypeColor(notification.type)
              } ${notification.is_read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                    <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {notifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No notifications</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {tabCounts.unread > 0 && (
            <Badge className="bg-red-500 text-white px-3 py-1">
              {tabCounts.unread} unread
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-white border shadow-sm">
          <TabsTrigger value="all" className="relative">
            All
            {tabCounts.all > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tabCounts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {tabCounts.unread > 0 && (
              <Badge className="ml-2 text-xs bg-red-500">
                {tabCounts.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="urgent" className="relative">
            Urgent
            {tabCounts.urgent > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {tabCounts.urgent}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments
            {tabCounts.appointments > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tabCounts.appointments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="results">
            Results
            {tabCounts.results > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tabCounts.results}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all duration-200 hover:shadow-md border-l-4 ${
                    getTypeColor(notification.type)
                  } ${notification.is_read ? 'bg-gray-50 opacity-75' : 'bg-white'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-900">{notification.title}</h3>
                              {!notification.is_read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-gray-700 mb-3">{notification.message}</p>
                            
                            {/* Metadata */}
                            {notification.metadata && (
                              <div className="text-sm text-gray-500 space-y-1">
                                {notification.metadata.doctor_name && (
                                  <p>Doctor: {notification.metadata.doctor_name}</p>
                                )}
                                {notification.metadata.result_type && (
                                  <p>Test: {notification.metadata.result_type}</p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right space-y-2">
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                            {notification.sender && (
                              <p className="text-xs text-gray-500">
                                from {notification.sender}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {notification.action_text && (
                              <Button
                                size="sm"
                                onClick={() => onAction?.(notification)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Zap className="h-4 w-4 mr-1" />
                                {notification.action_text}
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMarkAsRead?.(notification.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete?.(notification.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {activeTab === 'unread' ? 'All caught up!' : 
                   activeTab === 'urgent' ? 'No urgent notifications' :
                   'No notifications'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'unread' ? "You've read all your notifications." :
                   activeTab === 'urgent' ? "No urgent notifications at the moment." :
                   "You'll see new notifications here when they arrive."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};