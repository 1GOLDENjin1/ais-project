import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  User, 
  Phone,
  Mail,
  Clock,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
  Zap,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MessageRecipient {
  id: string;
  name: string;
  role: 'doctor' | 'patient' | 'staff';
  email: string;
  phone?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'appointment' | 'reminder' | 'general' | 'medical';
}

interface MessageForm {
  recipients: MessageRecipient[];
  subject: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  send_method: 'email' | 'sms' | 'both';
  schedule_send?: string;
}

const SendMessage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get initial data from navigation state
  const initialData = location.state;
  const appointment = initialData?.appointment;
  const record = initialData?.record;
  const payment = initialData?.payment;
  
  // Form states
  const [form, setForm] = useState<MessageForm>({
    recipients: [],
    subject: '',
    body: '',
    priority: 'normal',
    send_method: 'email',
    schedule_send: undefined
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchRecipients, setSearchRecipients] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sample data
  const messageTemplates: MessageTemplate[] = [
    {
      id: 'template1',
      name: 'Appointment Reminder',
      subject: 'Appointment Reminder - {date} at {time}',
      body: 'Dear {patient_name},\n\nThis is a friendly reminder about your upcoming appointment on {date} at {time} with {doctor_name}.\n\nPlease arrive 15 minutes early for check-in.\n\nIf you need to reschedule, please call us at least 24 hours in advance.\n\nThank you,\nMedical Staff',
      category: 'reminder'
    },
    {
      id: 'template2',
      name: 'Appointment Confirmation',
      subject: 'Appointment Confirmed - {date} at {time}',
      body: 'Dear {patient_name},\n\nYour appointment has been confirmed for {date} at {time} with {doctor_name}.\n\nService: {service}\nLocation: Our clinic\n\nPlease bring your ID and insurance card.\n\nBest regards,\nMedical Staff',
      category: 'appointment'
    },
    {
      id: 'template3',
      name: 'Lab Results Ready',
      subject: 'Lab Results Available',
      body: 'Dear {patient_name},\n\nYour lab results are now available. Please schedule a follow-up appointment to discuss the results with your doctor.\n\nYou can view your results in your patient portal or call us to schedule an appointment.\n\nThank you,\nMedical Staff',
      category: 'medical'
    },
    {
      id: 'template4',
      name: 'Payment Reminder',
      subject: 'Payment Reminder - Outstanding Balance',
      body: 'Dear {patient_name},\n\nThis is a reminder that you have an outstanding balance of ${amount} for services received on {date}.\n\nPlease contact our billing department to arrange payment.\n\nThank you,\nBilling Department',
      category: 'general'
    }
  ];

  const availableRecipients: MessageRecipient[] = [
    { id: 'doc1', name: 'Dr. Sarah Wilson', role: 'doctor', email: 'sarah.wilson@clinic.com', phone: '+1234567890' },
    { id: 'doc2', name: 'Dr. Michael Chen', role: 'doctor', email: 'michael.chen@clinic.com', phone: '+1234567891' },
    { id: 'doc3', name: 'Dr. Lisa Rodriguez', role: 'doctor', email: 'lisa.rodriguez@clinic.com', phone: '+1234567892' },
    { id: 'pat1', name: 'John Doe', role: 'patient', email: 'john.doe@email.com', phone: '+1987654321' },
    { id: 'pat2', name: 'Jane Smith', role: 'patient', email: 'jane.smith@email.com', phone: '+1987654322' },
    { id: 'pat3', name: 'Mike Johnson', role: 'patient', email: 'mike.johnson@email.com', phone: '+1987654323' },
    { id: 'staff1', name: 'Alice Brown', role: 'staff', email: 'alice.brown@clinic.com', phone: '+1555123456' },
    { id: 'staff2', name: 'Bob Wilson', role: 'staff', email: 'bob.wilson@clinic.com', phone: '+1555123457' },
  ];

  useEffect(() => {
    // Pre-populate based on context
    if (appointment) {
      const patient = availableRecipients.find(r => r.name === appointment.patient_name);
      if (patient) {
        setForm(prev => ({ 
          ...prev, 
          recipients: [patient],
          subject: `Regarding your appointment on ${appointment.date}`,
          body: `Dear ${appointment.patient_name},\n\nThis message is regarding your appointment scheduled for ${appointment.date} at ${appointment.time}.\n\n`
        }));
      }
    } else if (record) {
      const patient = availableRecipients.find(r => r.name === record.patient_name);
      if (patient) {
        setForm(prev => ({ 
          ...prev, 
          recipients: [patient],
          subject: `Medical Record Update`,
          body: `Dear ${record.patient_name},\n\nThis message is regarding your recent medical record update.\n\n`
        }));
      }
    } else if (payment) {
      const patient = availableRecipients.find(r => r.name === payment.patient_name);
      if (patient) {
        setForm(prev => ({ 
          ...prev, 
          recipients: [patient],
          subject: `Payment Information`,
          body: `Dear ${payment.patient_name},\n\nThis message is regarding your recent payment of $${payment.amount}.\n\n`
        }));
      }
    }
  }, [appointment, record, payment]);

  const handleInputChange = (field: keyof MessageForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addRecipient = (recipient: MessageRecipient) => {
    if (!form.recipients.find(r => r.id === recipient.id)) {
      setForm(prev => ({ 
        ...prev, 
        recipients: [...prev.recipients, recipient] 
      }));
    }
  };

  const removeRecipient = (recipientId: string) => {
    setForm(prev => ({ 
      ...prev, 
      recipients: prev.recipients.filter(r => r.id !== recipientId) 
    }));
  };

  const applyTemplate = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      let subject = template.subject;
      let body = template.body;
      
      // Replace placeholders with actual data
      if (appointment) {
        subject = subject
          .replace('{date}', appointment.date)
          .replace('{time}', appointment.time)
          .replace('{patient_name}', appointment.patient_name)
          .replace('{doctor_name}', 'Dr. Sarah Wilson')
          .replace('{service}', appointment.service);
        
        body = body
          .replace('{date}', appointment.date)
          .replace('{time}', appointment.time)
          .replace('{patient_name}', appointment.patient_name)
          .replace('{doctor_name}', 'Dr. Sarah Wilson')
          .replace('{service}', appointment.service);
      }
      
      if (payment) {
        subject = subject.replace('{amount}', payment.amount.toString());
        body = body
          .replace('{amount}', payment.amount.toString())
          .replace('{patient_name}', payment.patient_name)
          .replace('{date}', new Date().toLocaleDateString());
      }

      setForm(prev => ({ ...prev, subject, body }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (form.recipients.length === 0) {
      newErrors.recipients = 'At least one recipient is required';
    }

    if (!form.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!form.body.trim()) {
      newErrors.body = 'Message body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendMessage = async () => {
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

      toast({
        title: "Message Sent Successfully",
        description: `Message sent to ${form.recipients.length} recipient(s) via ${form.send_method}.`,
      });

      navigate('/staff-dashboard', { 
        state: { 
          message: 'Message sent successfully' 
        }
      });
    } catch (error) {
      toast({
        title: "Error Sending Message",
        description: "Failed to send the message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/staff-dashboard');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patient':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'staff':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const filteredRecipients = availableRecipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchRecipients.toLowerCase()) ||
    recipient.email.toLowerCase().includes(searchRecipients.toLowerCase()) ||
    recipient.role.toLowerCase().includes(searchRecipients.toLowerCase())
  );

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
                Send Message
              </h1>
              <p className="text-gray-600">
                Send messages to doctors, patients, and staff members
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipients and Templates */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recipients Selection */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Recipients</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Recipients</Label>
                  <Input
                    id="search"
                    value={searchRecipients}
                    onChange={(e) => setSearchRecipients(e.target.value)}
                    placeholder="Search by name, email, or role..."
                  />
                </div>

                {/* Selected Recipients */}
                {form.recipients.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Selected Recipients</Label>
                    <div className="space-y-2 mt-2">
                      {form.recipients.map(recipient => (
                        <div key={recipient.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{recipient.name}</p>
                              <p className="text-xs text-gray-500">{recipient.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getRoleColor(recipient.role)}>
                              {recipient.role}
                            </Badge>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => removeRecipient(recipient.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.recipients && (
                      <p className="text-red-500 text-sm mt-1">{errors.recipients}</p>
                    )}
                  </div>
                )}

                {/* Available Recipients */}
                <div>
                  <Label className="text-sm font-medium">Available Recipients</Label>
                  <div className="max-h-64 overflow-y-auto space-y-1 mt-2">
                    {filteredRecipients
                      .filter(recipient => !form.recipients.find(r => r.id === recipient.id))
                      .map(recipient => (
                      <div 
                        key={recipient.id} 
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => addRecipient(recipient)}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{recipient.name}</p>
                            <p className="text-xs text-gray-500">{recipient.email}</p>
                          </div>
                        </div>
                        <Badge className={getRoleColor(recipient.role)}>
                          {recipient.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Templates */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Message Templates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {messageTemplates.map(template => (
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
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{template.subject}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Message Composition */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message Details */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>Compose Message</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select 
                      id="priority"
                      value={form.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="send_method">Send Method</Label>
                    <select 
                      id="send_method"
                      value={form.send_method}
                      onChange={(e) => handleInputChange('send_method', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="email">
                        📧 Email Only
                      </option>
                      <option value="sms">
                        📱 SMS Only
                      </option>
                      <option value="both">
                        📧📱 Email & SMS
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Enter message subject"
                    className={errors.subject ? 'border-red-500' : ''}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="body">Message Body *</Label>
                  <Textarea
                    id="body"
                    value={form.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    placeholder="Type your message here..."
                    rows={8}
                    className={errors.body ? 'border-red-500' : ''}
                  />
                  {errors.body && (
                    <p className="text-red-500 text-sm mt-1">{errors.body}</p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Characters: {form.body.length}/1000
                    </p>
                    <Badge className={getPriorityColor(form.priority)}>
                      {form.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="schedule_send">Schedule Send (Optional)</Label>
                  <Input
                    id="schedule_send"
                    type="datetime-local"
                    value={form.schedule_send || ''}
                    onChange={(e) => handleInputChange('schedule_send', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to send immediately
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Message Preview */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span>Message Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className={getPriorityColor(form.priority)}>
                      {form.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">
                      {form.send_method === 'both' ? 'Email & SMS' : form.send_method.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {form.subject || 'No subject'}
                  </h3>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                    {form.body || 'No message content'}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Recipients: {form.recipients.length > 0 ? form.recipients.map(r => r.name).join(', ') : 'None selected'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;