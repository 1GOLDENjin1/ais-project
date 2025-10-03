// SMS Notification Service for Mendoza Diagnostic Center
// Integrates with appointment system for automated notifications

export interface SMSNotification {
  id: string;
  recipient: string; // Phone number
  message: string;
  type: 'appointment_confirmation' | 'appointment_reminder' | 'test_results' | 'payment_confirmation' | 'appointment_update';
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  appointmentId?: string;
  patientId: string;
}

export class SMSService {
  private static instance: SMSService;
  private notifications: SMSNotification[] = [];

  private constructor() {}

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  // Send appointment confirmation SMS
  async sendAppointmentConfirmation(
    patientPhone: string,
    patientName: string,
    appointmentDetails: {
      serviceName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      location: string;
      preparation?: string;
    },
    appointmentId: string,
    patientId: string
  ): Promise<boolean> {
    const message = this.formatAppointmentConfirmation(patientName, appointmentDetails);
    
    return this.sendSMS({
      id: `confirm-${appointmentId}-${Date.now()}`,
      recipient: patientPhone,
      message,
      type: 'appointment_confirmation',
      appointmentId,
      patientId,
      status: 'pending'
    });
  }

  // Send appointment reminder SMS (24 hours before)
  async sendAppointmentReminder(
    patientPhone: string,
    patientName: string,
    appointmentDetails: {
      serviceName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      preparation?: string;
    },
    appointmentId: string,
    patientId: string
  ): Promise<boolean> {
    const message = this.formatAppointmentReminder(patientName, appointmentDetails);
    
    return this.sendSMS({
      id: `reminder-${appointmentId}-${Date.now()}`,
      recipient: patientPhone,
      message,
      type: 'appointment_reminder',
      appointmentId,
      patientId,
      status: 'pending'
    });
  }

  // Send test results notification
  async sendTestResultsNotification(
    patientPhone: string,
    patientName: string,
    testName: string,
    patientId: string
  ): Promise<boolean> {
    const message = `Hi ${patientName}! Your ${testName} results are now ready for collection at Mendoza Diagnostic Center. Please bring a valid ID. For inquiries, call us. Thank you!`;
    
    return this.sendSMS({
      id: `results-${Date.now()}`,
      recipient: patientPhone,
      message,
      type: 'test_results',
      patientId,
      status: 'pending'
    });
  }

  // Send payment confirmation SMS
  async sendPaymentConfirmation(
    patientPhone: string,
    patientName: string,
    paymentDetails: {
      amount: number;
      serviceName: string;
      paymentMethod: string;
      transactionId: string;
    },
    patientId: string
  ): Promise<boolean> {
    const message = `Hi ${patientName}! Payment of ₱${paymentDetails.amount.toLocaleString()} for ${paymentDetails.serviceName} received via ${paymentDetails.paymentMethod}. Transaction ID: ${paymentDetails.transactionId}. Thank you!`;
    
    return this.sendSMS({
      id: `payment-${paymentDetails.transactionId}`,
      recipient: patientPhone,
      message,
      type: 'payment_confirmation',
      patientId,
      status: 'pending'
    });
  }

  // Send appointment update/cancellation SMS
  async sendAppointmentUpdate(
    patientPhone: string,
    patientName: string,
    updateDetails: {
      serviceName: string;
      updateType: 'rescheduled' | 'cancelled';
      newDate?: string;
      newTime?: string;
      reason?: string;
    },
    appointmentId: string,
    patientId: string
  ): Promise<boolean> {
    let message = '';
    
    if (updateDetails.updateType === 'cancelled') {
      message = `Hi ${patientName}! Your ${updateDetails.serviceName} appointment has been cancelled. ${updateDetails.reason ? `Reason: ${updateDetails.reason}` : ''} Please contact us to reschedule. Sorry for the inconvenience.`;
    } else {
      message = `Hi ${patientName}! Your ${updateDetails.serviceName} appointment has been rescheduled to ${updateDetails.newDate} at ${updateDetails.newTime}. ${updateDetails.reason ? `Reason: ${updateDetails.reason}` : ''} Thank you for your understanding.`;
    }
    
    return this.sendSMS({
      id: `update-${appointmentId}-${Date.now()}`,
      recipient: patientPhone,
      message,
      type: 'appointment_update',
      appointmentId,
      patientId,
      status: 'pending'
    });
  }

  // Schedule SMS for future delivery
  async scheduleSMS(sms: SMSNotification, sendAt: Date): Promise<void> {
    sms.scheduledFor = sendAt;
    this.notifications.push(sms);
    
    // In a real implementation, you would use a job scheduler
    const delay = sendAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.sendScheduledSMS(sms);
      }, delay);
    }
  }

  // Get SMS history for a patient
  getSMSHistory(patientId: string): SMSNotification[] {
    return this.notifications.filter(sms => sms.patientId === patientId);
  }

  // Get pending SMS notifications
  getPendingSMS(): SMSNotification[] {
    return this.notifications.filter(sms => sms.status === 'pending');
  }

  private async sendSMS(sms: SMSNotification): Promise<boolean> {
    try {
      // Store the notification
      this.notifications.push(sms);
      
      // In a real implementation, you would integrate with an SMS provider
      // For demo purposes, we'll simulate sending
      console.log(`📱 SMS sent to ${sms.recipient}:`);
      console.log(`Message: ${sms.message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update status to sent
      sms.status = 'sent';
      sms.sentAt = new Date();
      
      // Simulate delivery confirmation after a short delay
      setTimeout(() => {
        sms.status = 'delivered';
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      sms.status = 'failed';
      return false;
    }
  }

  private async sendScheduledSMS(sms: SMSNotification): Promise<void> {
    await this.sendSMS(sms);
  }

  private formatAppointmentConfirmation(
    patientName: string,
    details: {
      serviceName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      location: string;
      preparation?: string;
    }
  ): string {
    let message = `Hi ${patientName}! Your appointment for ${details.serviceName} with ${details.doctorName} is confirmed for ${details.appointmentDate} at ${details.appointmentTime} at ${details.location}.`;
    
    if (details.preparation) {
      message += ` Important: ${details.preparation}`;
    }
    
    message += ' Please arrive 15 minutes early. Thank you!';
    
    return message;
  }

  private formatAppointmentReminder(
    patientName: string,
    details: {
      serviceName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      preparation?: string;
    }
  ): string {
    let message = `Hi ${patientName}! Reminder: You have a ${details.serviceName} appointment with ${details.doctorName} tomorrow (${details.appointmentDate}) at ${details.appointmentTime}.`;
    
    if (details.preparation) {
      message += ` Don't forget: ${details.preparation}`;
    }
    
    message += ' See you tomorrow!';
    
    return message;
  }
}

// Enhanced Notification System
export interface EnhancedNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'test_result' | 'payment' | 'reminder' | 'system' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('sms' | 'email' | 'push' | 'in_app')[];
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  metadata?: any;
  createdAt: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: EnhancedNotification[] = [];
  private smsService: SMSService;

  private constructor() {
    this.smsService = SMSService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Send multi-channel notification
  async sendNotification(notification: Omit<EnhancedNotification, 'id' | 'isRead' | 'createdAt'>): Promise<string> {
    const fullNotification: EnhancedNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date()
    };

    this.notifications.push(fullNotification);

    // Send through selected channels
    await Promise.all(
      notification.channels.map(channel => this.sendThroughChannel(fullNotification, channel))
    );

    return fullNotification.id;
  }

  // Get notifications for user
  getUserNotifications(userId: string, limit?: number): EnhancedNotification[] {
    let userNotifications = this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (limit) {
      userNotifications = userNotifications.slice(0, limit);
    }

    return userNotifications;
  }

  // Mark notification as read
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  // Get unread count
  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  private async sendThroughChannel(notification: EnhancedNotification, channel: string): Promise<void> {
    switch (channel) {
      case 'sms':
        // Implementation would depend on user's phone number
        console.log(`📱 SMS notification sent: ${notification.title}`);
        break;
      case 'email':
        console.log(`📧 Email notification sent: ${notification.title}`);
        break;
      case 'push':
        console.log(`🔔 Push notification sent: ${notification.title}`);
        break;
      case 'in_app':
        console.log(`📱 In-app notification created: ${notification.title}`);
        break;
    }
  }
}

// Appointment Reminder Scheduler
export class AppointmentReminderScheduler {
  private smsService: SMSService;
  private notificationService: NotificationService;

  constructor() {
    this.smsService = SMSService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  // Schedule all reminders for an appointment
  async scheduleAppointmentReminders(appointment: {
    id: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    serviceName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    preparation?: string;
  }): Promise<void> {
    const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.appointmentTime}`);
    
    // Schedule 24-hour reminder
    const reminderTime24h = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));
    if (reminderTime24h > new Date()) {
      await this.scheduleReminder(appointment, reminderTime24h, '24 hours');
    }

    // Schedule 2-hour reminder
    const reminderTime2h = new Date(appointmentDateTime.getTime() - (2 * 60 * 60 * 1000));
    if (reminderTime2h > new Date()) {
      await this.scheduleReminder(appointment, reminderTime2h, '2 hours');
    }
  }

  private async scheduleReminder(appointment: any, reminderTime: Date, timeframe: string): Promise<void> {
    // Schedule SMS reminder
    const smsNotification: SMSNotification = {
      id: `reminder-${timeframe}-${appointment.id}`,
      recipient: appointment.patientPhone,
      message: this.formatReminderMessage(appointment, timeframe),
      type: 'appointment_reminder',
      scheduledFor: reminderTime,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      status: 'pending'
    };

    await this.smsService.scheduleSMS(smsNotification, reminderTime);

    // Schedule in-app notification
    await this.notificationService.sendNotification({
      userId: appointment.patientId,
      title: `Appointment Reminder - ${timeframe}`,
      message: `Your ${appointment.serviceName} appointment is in ${timeframe}`,
      type: 'reminder',
      priority: timeframe === '2 hours' ? 'high' : 'medium',
      channels: ['in_app'],
      actionRequired: false,
      scheduledFor: reminderTime
    });
  }

  private formatReminderMessage(appointment: any, timeframe: string): string {
    let message = `Hi ${appointment.patientName}! Reminder: Your ${appointment.serviceName} appointment with ${appointment.doctorName} is in ${timeframe} (${appointment.appointmentDate} at ${appointment.appointmentTime}).`;
    
    if (appointment.preparation) {
      message += ` Remember: ${appointment.preparation}`;
    }
    
    return message;
  }
}

export default { SMSService, NotificationService, AppointmentReminderScheduler };