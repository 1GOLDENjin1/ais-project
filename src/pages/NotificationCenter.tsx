import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Bell, 
  User, 
  Calendar,
  Clock,
  MessageSquare,
  Mail,
  Phone,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
  Settings,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'reminder' | 'alert' | 'info' | 'promotion';
  category: 'appointment' | 'payment' | 'health' | 'general';
}

interface ScheduledNotification {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_type: 'patient' | 'doctor' | 'staff';
  title: string;
  message: string;
  notification_type: 'reminder' | 'alert' | 'info' | 'promotion';
  delivery_method: 'email' | 'sms' | 'both' | 'app';
  scheduled_time: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  created_at: string;
}

interface NotificationForm {
  recipients: string[];
  title: string;
  message: string;
  type: 'reminder' | 'alert' | 'info' | 'promotion';
  delivery_method: 'email' | 'sms' | 'both' | 'app';
  send_immediately: boolean;
  scheduled_time?: string;
  repeat_type?: 'none' | 'daily' | 'weekly' | 'monthly';
}

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get initial data from navigation state
  const initialData = location.state;
  const appointment = initialData?.appointment;
  
  // States
  const [activeTab, setActiveTab] = useState<'create' | 'scheduled' | 'history'>('create');
  const [form, setForm] = useState<NotificationForm>({
    recipients: [],
    title: '',
    message: '',
    type: 'reminder',
    delivery_method: 'both',
    send_immediately: true,
    repeat_type: 'none'
  });
  
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<ScheduledNotification[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sample data
  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'temp1',
      name: '24hr Appointment Reminder',
      title: 'Appointment Reminder - Tomorrow',
      message: 'Dear {patient_name},\n\nThis is a reminder that you have an appointment tomorrow at {time} with {doctor_name}.\n\nPlease arrive 15 minutes early.\n\nThank you!',
      type: 'reminder',
      category: 'appointment'
    },
    {
      id: 'temp2',
      name: '1hr Appointment Reminder',
      title: 'Your appointment is in 1 hour',
      message: 'Hi {patient_name},\n\nYour appointment with {doctor_name} is starting in 1 hour at {time}.\n\nPlease make your way to the clinic.\n\nSee you soon!',
      type: 'reminder',
      category: 'appointment'
    },
    {
      id: 'temp3',
      name: 'Payment Due Reminder',
      title: 'Payment Reminder',
      message: 'Dear {patient_name},\n\nThis is a friendly reminder that you have an outstanding balance of ${amount}.\n\nPlease contact our billing department to arrange payment.\n\nThank you!',
      type: 'reminder',
      category: 'payment'
    },
    {
      id: 'temp4',
      name: 'Lab Results Available',
      title: 'Your lab results are ready',
      message: 'Hi {patient_name},\n\nYour lab results are now available. Please log into your patient portal to view them or contact us to schedule a follow-up appointment.\n\nBest regards,\nMedical Team',
      type: 'info',
      category: 'health'
    },
    {
      id: 'temp5',
      name: 'Annual Checkup Due',
      title: 'Time for your annual checkup',
      message: 'Dear {patient_name},\n\nIt\'s time for your annual health checkup. Regular checkups help maintain your health and catch potential issues early.\n\nCall us to schedule your appointment today!\n\nStay healthy!',
      type: 'info',
      category: 'health'
    }
  ];

  const sampleRecipients = [
    { id: 'pat1', name: 'John Doe', type: 'patient' as const, contact: 'john.doe@email.com' },
    { id: 'pat2', name: 'Jane Smith', type: 'patient' as const, contact: 'jane.smith@email.com' },
    { id: 'pat3', name: 'Mike Johnson', type: 'patient' as const, contact: 'mike.johnson@email.com' },
    { id: 'doc1', name: 'Dr. Sarah Wilson', type: 'doctor' as const, contact: 'sarah.wilson@clinic.com' },
    { id: 'doc2', name: 'Dr. Michael Chen', type: 'doctor' as const, contact: 'michael.chen@clinic.com' }
  ];

  const sampleScheduled: ScheduledNotification[] = [
    {
      id: 'sched1',
      recipient_id: 'pat1',
      recipient_name: 'John Doe',
      recipient_type: 'patient',
      title: 'Appointment Reminder - Tomorrow',
      message: 'Your appointment with Dr. Wilson is tomorrow at 9:00 AM',
      notification_type: 'reminder',
      delivery_method: 'both',
      scheduled_time: '2025-10-01T08:00:00',
      status: 'scheduled',
      created_at: '2025-09-30T10:00:00'
    },
    {
      id: 'sched2',
      recipient_id: 'pat2',
      recipient_name: 'Jane Smith',
      recipient_type: 'patient',
      title: 'Lab Results Available',
      message: 'Your lab results are now available in your patient portal',
      notification_type: 'info',
      delivery_method: 'email',
      scheduled_time: '2025-10-01T14:00:00',
      status: 'scheduled',
      created_at: '2025-09-30T09:30:00'
    }
  ];

  const sampleHistory: ScheduledNotification[] = [
    {
      id: 'hist1',
      recipient_id: 'pat3',
      recipient_name: 'Mike Johnson',
      recipient_type: 'patient',
      title: 'Payment Reminder',
      message: 'Outstanding balance of $150 for recent services',
      notification_type: 'reminder',
      delivery_method: 'both',
      scheduled_time: '2025-09-29T10:00:00',
      status: 'sent',
      created_at: '2025-09-28T15:00:00'
    },
    {
      id: 'hist2',
      recipient_id: 'pat1',
      recipient_name: 'John Doe',
      recipient_type: 'patient',
      title: 'Appointment Confirmed',
      message: 'Your appointment has been confirmed for Oct 1st at 9:00 AM',
      notification_type: 'info',
      delivery_method: 'sms',
      scheduled_time: '2025-09-28T16:30:00',
      status: 'sent',
      created_at: '2025-09-28T16:25:00'
    }
  ];

  useEffect(() => {
    setScheduledNotifications(sampleScheduled);
    setNotificationHistory(sampleHistory);
    
    // Pre-populate if appointment data provided
    if (appointment) {
      setForm(prev => ({
        ...prev,
        title: `Appointment Reminder - ${appointment.date}`,
        message: `Dear ${appointment.patient_name},\n\nThis is a reminder about your appointment on ${appointment.date} at ${appointment.time}.\n\nPlease arrive 15 minutes early.\n\nThank you!`,
        recipients: [appointment.patient_id || 'pat1']
      }));
    }
  }, [appointment]);

  const handleInputChange = (field: keyof NotificationForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template) {
      let title = template.title;
      let message = template.message;
      
      // Replace placeholders with actual data
      if (appointment) {
        title = title.replace('{patient_name}', appointment.patient_name);
        message = message
          .replace('{patient_name}', appointment.patient_name)
          .replace('{doctor_name}', 'Dr. Sarah Wilson')
          .replace('{time}', appointment.time)
          .replace('{date}', appointment.date);
      }
      
      setForm(prev => ({
        ...prev,
        title,
        message,
        type: template.type
      }));
    }
  };

  const addRecipient = (recipientId: string) => {
    if (!form.recipients.includes(recipientId)) {
      setForm(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientId]
      }));
    }
  };

  const removeRecipient = (recipientId: string) => {
    setForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter(id => id !== recipientId)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (form.recipients.length === 0) {
      newErrors.recipients = 'At least one recipient is required';
    }

    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!form.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!form.send_immediately && !form.scheduled_time) {
      newErrors.scheduled_time = 'Scheduled time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendNotification = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before sending.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const recipientCount = form.recipients.length;
      const action = form.send_immediately ? 'sent' : 'scheduled';
      
      toast({
        title: `Notification ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `Notification ${action} to ${recipientCount} recipient(s).`,
      });

      // Reset form
      setForm({
        recipients: [],
        title: '',
        message: '',
        type: 'reminder',
        delivery_method: 'both',
        send_immediately: true,
        repeat_type: 'none'
      });

      navigate('/staff-dashboard', { 
        state: { 
          message: `Notification ${action} successfully` 
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNotification = async (notificationId: string) => {
    try {
      const updatedNotifications = scheduledNotifications.map(n =>
        n.id === notificationId ? { ...n, status: 'cancelled' as const } : n
      );
      setScheduledNotifications(updatedNotifications);
      
      toast({
        title: "Notification Cancelled",
        description: "The scheduled notification has been cancelled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel notification.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate('/staff-dashboard');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'alert':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'info':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'promotion':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'both':
        return <MessageSquare className="h-4 w-4" />;
      case 'app':
        return <Bell className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Notification Center
              </h1>
              <p className="text-gray-600">
                Send reminders, alerts, and notifications to patients and staff
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
          <Button
            variant={activeTab === 'create' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('create')}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Notification
          </Button>
          <Button
            variant={activeTab === 'scheduled' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('scheduled')}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            Scheduled ({scheduledNotifications.filter(n => n.status === 'scheduled').length})
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className="flex-1"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>

        {/* Create Notification Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Templates */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Templates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {notificationTemplates.map(template => (
                    <div 
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        applyTemplate(template.id);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <Badge className={`${getTypeColor(template.type)} text-xs px-2 py-1`}>
                          {template.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{template.title}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Notification Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <span>Create Notification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipients */}
                  <div>
                    <Label>Recipients *</Label>
                    <div className="mt-2 space-y-2">
                      {form.recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {form.recipients.map(recipientId => {
                            const recipient = sampleRecipients.find(r => r.id === recipientId);
                            return recipient ? (
                              <div key={recipientId} className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded">
                                <span className="text-sm">{recipient.name}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeRecipient(recipientId)}
                                  className="h-auto p-0 text-blue-600 hover:bg-blue-200"
                                >
                                  ×
                                </Button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                      
                      <select 
                        onChange={(e) => e.target.value && addRecipient(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value=""
                      >
                        <option value="">Select recipient...</option>
                        {sampleRecipients
                          .filter(r => !form.recipients.includes(r.id))
                          .map(recipient => (
                          <option key={recipient.id} value={recipient.id}>
                            {recipient.name} ({recipient.type})
                          </option>
                        ))}
                      </select>
                      {errors.recipients && (
                        <p className="text-red-500 text-sm">{errors.recipients}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <select 
                        id="type"
                        value={form.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="reminder">Reminder</option>
                        <option value="alert">Alert</option>
                        <option value="info">Information</option>
                        <option value="promotion">Promotion</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="delivery_method">Delivery Method</Label>
                      <select 
                        id="delivery_method"
                        value={form.delivery_method}
                        onChange={(e) => handleInputChange('delivery_method', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="email">📧 Email Only</option>
                        <option value="sms">📱 SMS Only</option>
                        <option value="both">📧📱 Email & SMS</option>
                        <option value="app">🔔 App Notification</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter notification title"
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Enter notification message"
                      rows={6}
                      className={errors.message ? 'border-red-500' : ''}
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Characters: {form.message.length}/500
                    </p>
                  </div>

                  {/* Scheduling Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="send_immediately"
                        checked={form.send_immediately}
                        onChange={(e) => handleInputChange('send_immediately', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="send_immediately">Send immediately</Label>
                    </div>

                    {!form.send_immediately && (
                      <div>
                        <Label htmlFor="scheduled_time">Schedule for later</Label>
                        <Input
                          id="scheduled_time"
                          type="datetime-local"
                          value={form.scheduled_time || ''}
                          onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className={errors.scheduled_time ? 'border-red-500' : ''}
                        />
                        {errors.scheduled_time && (
                          <p className="text-red-500 text-sm mt-1">{errors.scheduled_time}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendNotification}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {form.send_immediately ? 'Sending...' : 'Scheduling...'}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {form.send_immediately ? 'Send Now' : 'Schedule'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Scheduled Notifications Tab */}
        {activeTab === 'scheduled' && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Scheduled Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledNotifications.filter(n => n.status === 'scheduled').map(notification => (
                  <div key={notification.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge className={getTypeColor(notification.notification_type)}>
                            {notification.notification_type}
                          </Badge>
                          <div className="flex items-center space-x-1 text-gray-500">
                            {getDeliveryIcon(notification.delivery_method)}
                            <span className="text-xs">{notification.delivery_method}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>To: {notification.recipient_name}</span>
                          <span>Scheduled: {new Date(notification.scheduled_time).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelNotification(notification.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
                
                {scheduledNotifications.filter(n => n.status === 'scheduled').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No scheduled notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5 text-primary" />
                <span>Notification History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationHistory.map(notification => (
                  <div key={notification.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{notification.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                        <Badge className={getTypeColor(notification.notification_type)}>
                          {notification.notification_type}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>To: {notification.recipient_name}</span>
                      <span>Sent: {new Date(notification.scheduled_time).toLocaleString()}</span>
                      <div className="flex items-center space-x-1">
                        {getDeliveryIcon(notification.delivery_method)}
                        <span>{notification.delivery_method}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notificationHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No notification history</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;