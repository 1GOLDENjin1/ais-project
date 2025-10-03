import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  User, 
  Clock, 
  Phone, 
  Mail,
  Paperclip,
  Smile
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'patient' | 'doctor';
  message: string;
  timestamp: string;
  read: boolean;
}

const MessageDoctor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get appointment data from navigation state
  const appointment = location.state?.appointment || {
    id: "APT001",
    patient_name: "Juan Dela Cruz",
    service: "General Consultation",
    date: "Oct 31, 2025",
    time: "17:00:00",
    status: "pending" as const,
    patient_phone: "+63 912 345 6789",
    patient_email: "juan.delacruz@email.com",
    notes: "Digital X-ray appointment | Notes: tryyyyyyyyyyyy | Special...",
  };

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'patient',
      message: 'Hello Doctor, I have a question about my upcoming appointment.',
      timestamp: '2025-09-30T10:30:00Z',
      read: true
    },
    {
      id: '2', 
      sender: 'doctor',
      message: 'Hello! I\'m here to help. What would you like to know about your appointment?',
      timestamp: '2025-09-30T10:32:00Z',
      read: true
    },
    {
      id: '3',
      sender: 'patient', 
      message: 'Should I bring any specific documents or prepare anything special for the X-ray?',
      timestamp: '2025-09-30T10:35:00Z',
      read: true
    }
  ]);

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message before sending.",
        variant: "destructive"
      });
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'doctor',
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    
    toast({
      title: "Message Sent",
      description: `Message sent successfully to ${appointment.patient_name}`,
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
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
              onClick={() => navigate('/staff-dashboard')}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Message Doctor
              </h1>
              <p className="text-gray-600">Communicate with the patient's doctor</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Patient Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Patient Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {appointment.patient_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{appointment.patient_name}</h3>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{appointment.patient_phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{appointment.patient_email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{appointment.date} at {appointment.time}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
                  <p className="text-sm text-gray-600">{appointment.service}</p>
                  {appointment.notes && (
                    <p className="text-xs text-gray-500 mt-1">{appointment.notes}</p>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/appointment-details', { state: { appointment } })}
                >
                  View Full Details
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>Conversation with Dr. Sarah Wilson</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Regarding: {appointment.service} - {appointment.date}
                </p>
              </CardHeader>
              
              {/* Messages Area */}
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[400px]">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'doctor' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'doctor' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Message Input */}
                <div className="mt-4 space-y-3">
                  <Textarea
                    placeholder="Type your message to the doctor..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                      </span>
                    </div>
                    
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!messageText.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Message Templates */}
            <Card className="mt-6 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Quick Message Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="text-left justify-start h-auto p-3"
                    onClick={() => setMessageText("Thank you for your message. I'll review your case and get back to you shortly.")}
                  >
                    <div>
                      <p className="font-medium">Standard Response</p>
                      <p className="text-xs text-gray-500">Acknowledge message receipt</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="text-left justify-start h-auto p-3"
                    onClick={() => setMessageText("Please bring your previous medical records and any current medications you're taking.")}
                  >
                    <div>
                      <p className="font-medium">Preparation Instructions</p>
                      <p className="text-xs text-gray-500">Pre-appointment guidance</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="text-left justify-start h-auto p-3"
                    onClick={() => setMessageText("Your appointment has been confirmed. Please arrive 15 minutes early for check-in.")}
                  >
                    <div>
                      <p className="font-medium">Appointment Confirmation</p>
                      <p className="text-xs text-gray-500">Confirm and provide instructions</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="text-left justify-start h-auto p-3"
                    onClick={() => setMessageText("If you need to reschedule, please contact us at least 24 hours in advance.")}
                  >
                    <div>
                      <p className="font-medium">Reschedule Policy</p>
                      <p className="text-xs text-gray-500">Explain rescheduling rules</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDoctor;