import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  User,
  Calendar,
  Clock,
  Paperclip,
  Phone,
  Video,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DoctorManagementService from '@/services/doctorDatabaseService';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_content: string;
  sent_at: string;
  read_at?: string;
  message_type?: string;
  sender?: {
    name: string;
    email?: string;
  };
  recipient?: {
    name: string;
    email?: string;
  };
}

interface MessageThread {
  patient_id: string;
  patient_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: Message[];
}

const DoctorMessageCenter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessageThreads();
  }, []);

  const loadMessageThreads = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // For demo purposes, create some sample message threads
      const sampleThreads: MessageThread[] = [
        {
          patient_id: 'patient-1',
          patient_name: 'John Doe',
          last_message: 'Thank you for the prescription, Doctor.',
          last_message_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          unread_count: 2,
          messages: []
        },
        {
          patient_id: 'patient-2',
          patient_name: 'Jane Smith',
          last_message: 'When should I schedule my follow-up?',
          last_message_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          unread_count: 0,
          messages: []
        },
        {
          patient_id: 'patient-3',
          patient_name: 'Mike Johnson',
          last_message: 'I\'m experiencing some side effects from the medication.',
          last_message_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          unread_count: 1,
          messages: []
        }
      ];
      
      setMessageThreads(sampleThreads);
    } catch (error) {
      console.error('Error loading message threads:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (patientId: string) => {
    if (!user?.id) return;

    try {
      // For demo purposes, create sample messages
      const sampleMessages: Message[] = [
        {
          id: 'msg-1',
          sender_id: patientId,
          recipient_id: user.id,
          message_content: 'Hello Doctor, I wanted to ask about my medication.',
          sent_at: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          sender: { name: selectedThread?.patient_name || 'Patient' }
        },
        {
          id: 'msg-2',
          sender_id: user.id,
          recipient_id: patientId,
          message_content: 'Hello! I\'m happy to help. What specific questions do you have about your medication?',
          sent_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          sender: { name: user.name || 'Doctor' }
        },
        {
          id: 'msg-3',
          sender_id: patientId,
          recipient_id: user.id,
          message_content: 'I\'m experiencing some mild nausea. Is this normal?',
          sent_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          sender: { name: selectedThread?.patient_name || 'Patient' }
        },
        {
          id: 'msg-4',
          sender_id: user.id,
          recipient_id: patientId,
          message_content: 'Mild nausea can be a common side effect. Try taking the medication with food. If it persists or gets worse, please let me know.',
          sent_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          sender: { name: user.name || 'Doctor' }
        }
      ];

      setMessages(sampleMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim() || !user?.id) return;

    try {
      setSending(true);
      
      // For demo purposes, simulate sending a message
      const messageData = {
        id: 'msg-' + Date.now(),
        sender_id: user.id,
        recipient_id: selectedThread.patient_id,
        message_content: newMessage,
        sent_at: new Date().toISOString(),
        sender: { name: user.name || 'Doctor' }
      };

      setMessages(prev => [...prev, messageData]);
      
      // Update the thread's last message
      setMessageThreads(prev => 
        prev.map(thread => 
          thread.patient_id === selectedThread.patient_id
            ? { ...thread, last_message: newMessage, last_message_at: new Date().toISOString() }
            : thread
        )
      );

      setNewMessage('');
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleThreadSelect = (thread: MessageThread) => {
    setSelectedThread(thread);
    loadMessages(thread.patient_id);
    
    // Mark as read
    if (thread.unread_count > 0) {
      setMessageThreads(prev => 
        prev.map(t => 
          t.patient_id === thread.patient_id
            ? { ...t, unread_count: 0 }
            : t
        )
      );
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredThreads = messageThreads.filter(thread =>
    thread.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnreadCount = messageThreads.reduce((acc, thread) => acc + thread.unread_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalUnreadCount}</p>
                <p className="text-sm text-gray-600">Unread Messages</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{messageThreads.length}</p>
                <p className="text-sm text-gray-600">Active Conversations</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {messages.filter(m => m.sender_id === user?.id).length}
                </p>
                <p className="text-sm text-gray-600">Messages Sent Today</p>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Message Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
            {/* Message Threads Sidebar */}
            <div className="lg:col-span-1 border-r pr-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredThreads.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No conversations found</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <div
                      key={thread.patient_id}
                      onClick={() => handleThreadSelect(thread)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedThread?.patient_id === thread.patient_id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{thread.patient_name}</h4>
                            {thread.unread_count > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {thread.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {thread.last_message}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatMessageTime(thread.last_message_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Conversation */}
            <div className="lg:col-span-2">
              {selectedThread ? (
                <div className="flex flex-col h-full">
                  {/* Conversation Header */}
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedThread.patient_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedThread.patient_name}</h3>
                        <p className="text-sm text-gray-500">Patient</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message_content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id 
                                ? 'text-blue-100' 
                                : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.sent_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          rows={2}
                          className="resize-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-6"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorMessageCenter;