import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, User, Phone, Video, MoreHorizontal, Paperclip, Smile, X } from 'lucide-react';

interface Appointment {
  id: string;
  patient_name?: string;
  doctor?: {
    id: string;
    name: string;
    specialty: string;
    email: string;
    phone: string;
  };
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface SendMessageModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  appointment,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm ready to assist you regarding your upcoming appointment on ${appointment?.appointment_date || 'your scheduled date'}. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromPatient: false,
      status: 'read'
    }
  ]);

  React.useEffect(() => {
    if (appointment && isOpen) {
      setMessages([{
        id: '1',
        content: `Hello! I'm ready to assist you regarding your upcoming appointment on ${appointment.appointment_date} at ${appointment.appointment_time}. How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromPatient: false,
        status: 'read'
      }]);
    }
  }, [appointment, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromPatient: true,
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status to delivered
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));

      // Simulate doctor response after a delay
      setTimeout(() => {
        const doctorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "Thank you for your message. I've received your inquiry and will review it shortly. If this is urgent, please don't hesitate to call our clinic directly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFromPatient: false,
          status: 'read'
        };
        setMessages(prev => [...prev, doctorResponse]);
      }, 2000);
      
      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${appointment?.doctor?.name || 'the doctor'}.`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md h-[600px] p-0 overflow-hidden">
        {/* Header - Messenger style */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {appointment.doctor?.name?.charAt(0) || 'D'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                Dr. {appointment.doctor?.name || 'Doctor'}
              </h3>
              <p className="text-xs text-gray-500">
                {appointment.doctor?.specialty || 'Medical Professional'} • Online
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Appointment Info Banner */}
        <div className="px-4 py-2 bg-blue-50 border-b">
          <div className="text-center">
            <p className="text-xs text-blue-600 font-medium">
              📅 Appointment: {appointment.appointment_date} at {appointment.appointment_time}
            </p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ maxHeight: '400px' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isFromPatient ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                  msg.isFromPatient
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm border'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div className={`flex items-center justify-end space-x-1 mt-1 ${
                  msg.isFromPatient ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  <span className="text-xs">{msg.timestamp}</span>
                  {msg.isFromPatient && (
                    <div className="flex space-x-0.5">
                      {msg.status === 'sent' && <div className="w-1 h-1 bg-blue-200 rounded-full"></div>}
                      {msg.status === 'delivered' && (
                        <>
                          <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
                          <div className="w-1 h-1 bg-blue-200 rounded-full"></div>
                        </>
                      )}
                      {msg.status === 'read' && (
                        <div className="w-3 h-3 rounded-full overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input - Messenger style */}
        <div className="p-3 border-t bg-white">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full hover:bg-gray-200"
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full hover:bg-gray-200"
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};