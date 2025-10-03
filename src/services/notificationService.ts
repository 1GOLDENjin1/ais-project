// ===================================================
// NOTIFICATION SERVICE
// Real-time notification management with database integration
// ===================================================

// Use the shared Supabase client configured for this app
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'message' | 'record' | 'system' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  related_appointment_id?: string;
  related_test_id?: string;
  created_at: string;
  metadata?: {
    appointment_id?: string;
    doctor_name?: string;
    patient_name?: string;
    result_type?: string;
    action_url?: string;
    action_text?: string;
    sender?: string;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private subscriptions: Map<string, any> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Get all notifications for a user
  async getNotifications(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
    priority?: string;
  }): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: notifications, error } = await query;

      if (error) throw error;

      // Get total count
      const { count: total, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      // Get unread count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (unreadError) throw unreadError;

      return {
        notifications: notifications || [],
        total: total || 0,
        unreadCount: unreadCount || 0
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], total: 0, unreadCount: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Create new notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          is_read: false,
          related_appointment_id: notification.related_appointment_id,
          related_test_id: notification.related_test_id
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  // Subscribe to real-time notifications for a user
  subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void,
    onNotificationUpdated: (notification: Notification) => void,
    onNotificationDeleted: (notificationId: string) => void
  ) {
    const channelName = `notifications-${userId}`;
    
    // Unsubscribe from existing subscription
    if (this.subscriptions.has(channelName)) {
      this.subscriptions.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          onNewNotification(payload.new as Notification);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          onNotificationUpdated(payload.new as Notification);
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification deleted:', payload);
          onNotificationDeleted(payload.old.id);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from notifications
  unsubscribeFromNotifications(userId: string) {
    const channelName = `notifications-${userId}`;
    if (this.subscriptions.has(channelName)) {
      this.subscriptions.get(channelName).unsubscribe();
      this.subscriptions.delete(channelName);
    }
  }

  // Helper: Create appointment notification
  async createAppointmentNotification(
    userId: string, 
    appointmentId: string, 
    type: 'created' | 'confirmed' | 'reminder' | 'cancelled' | 'completed',
    appointmentDetails: {
      doctorName?: string;
      patientName?: string;
      date?: string;
      time?: string;
      service?: string;
    }
  ): Promise<boolean> {
    const notificationMap = {
      created: {
        title: 'New Appointment Booked',
        message: `Your appointment with Dr. ${appointmentDetails.doctorName} on ${appointmentDetails.date} at ${appointmentDetails.time} has been scheduled.`,
        priority: 'medium' as const,
        type: 'appointment' as const
      },
      confirmed: {
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${appointmentDetails.doctorName} on ${appointmentDetails.date} has been confirmed.`,
        priority: 'high' as const,
        type: 'appointment' as const
      },
      reminder: {
        title: 'Appointment Reminder',
        message: `Reminder: You have an appointment with Dr. ${appointmentDetails.doctorName} tomorrow at ${appointmentDetails.time}.`,
        priority: 'high' as const,
        type: 'reminder' as const
      },
      cancelled: {
        title: 'Appointment Cancelled',
        message: `Your appointment with Dr. ${appointmentDetails.doctorName} on ${appointmentDetails.date} has been cancelled.`,
        priority: 'urgent' as const,
        type: 'appointment' as const
      },
      completed: {
        title: 'Appointment Completed',
        message: `Your appointment with Dr. ${appointmentDetails.doctorName} has been completed. Medical records are now available.`,
        priority: 'medium' as const,
        type: 'appointment' as const
      }
    };

    const notificationData = notificationMap[type];
    
    return this.createNotification({
      user_id: userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority,
      is_read: false,
      related_appointment_id: appointmentId,
      metadata: {
        appointment_id: appointmentId,
        doctor_name: appointmentDetails.doctorName,
        patient_name: appointmentDetails.patientName,
        action_url: `/appointments/${appointmentId}`,
        action_text: 'View Details'
      }
    });
  }

  // Helper: Create lab result notification
  async createLabResultNotification(
    userId: string,
    testId: string,
    testType: string,
    doctorName?: string
  ): Promise<boolean> {
    return this.createNotification({
      user_id: userId,
      title: 'Lab Results Available',
      message: `Your ${testType} results are now available for review.`,
      type: 'record',
      priority: 'high',
      is_read: false,
      related_test_id: testId,
      metadata: {
        result_type: testType,
        doctor_name: doctorName,
        action_url: `/lab-results/${testId}`,
        action_text: 'View Results'
      }
    });
  }

  // Helper: Create payment notification
  async createPaymentNotification(
    userId: string,
    appointmentId: string,
    status: 'success' | 'failed' | 'pending',
    amount: number
  ): Promise<boolean> {
    const notificationMap = {
      success: {
        title: 'Payment Successful',
        message: `Your payment of ₱${amount.toLocaleString()} has been processed successfully.`,
        priority: 'medium' as const
      },
      failed: {
        title: 'Payment Failed',
        message: `Your payment of ₱${amount.toLocaleString()} could not be processed. Please try again.`,
        priority: 'urgent' as const
      },
      pending: {
        title: 'Payment Pending',
        message: `Your payment of ₱${amount.toLocaleString()} is being processed.`,
        priority: 'low' as const
      }
    };

    const notificationData = notificationMap[status];
    
    return this.createNotification({
      user_id: userId,
      title: notificationData.title,
      message: notificationData.message,
      type: 'payment',
      priority: notificationData.priority,
      is_read: false,
      related_appointment_id: appointmentId,
      metadata: {
        appointment_id: appointmentId,
        action_url: `/payments`,
        action_text: 'View Payment'
      }
    });
  }

  // Helper: Create system notification
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<boolean> {
    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'system',
      priority,
      is_read: false
    });
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    recentActivity: number; // notifications in last 24 hours
  }> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('type, priority, is_read, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        recentActivity: 0
      };

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      notifications.forEach(notification => {
        // Count by type
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // Count by priority
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
        
        // Count recent activity
        if (new Date(notification.created_at) > oneDayAgo) {
          stats.recentActivity++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
        recentActivity: 0
      };
    }
  }
}

export const notificationService = NotificationService.getInstance();