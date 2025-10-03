import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Paperclip, 
  Search, 
  Plus, 
  MessageCircle, 
  Phone, 
  Video,
  MoreHorizontal,
  Clock,
  CheckCheck,
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessagingService } from '@/services/messagingService';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'doctor' | 'staff' | 'admin';
  recipientId: string;
  messageType: 'text' | 'image' | 'document' | 'audio' | 'system';
  messageContent: string;
  attachmentUrl?: string;
  isUrgent: boolean;
  isRead: boolean;
  readAt?: string;
  relatedAppointmentId?: string;
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  patientId: string;
  patientName: string;
  healthcareProviderId: string;
  healthcareProviderName: string;
  healthcareProviderRole: 'doctor' | 'staff';
  subject: string;
  conversationType: 'appointment_related' | 'general_inquiry' | 'prescription_refill' | 'lab_results' | 'follow_up' | 'complaint';
  status: 'active' | 'closed' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessagingSystemProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'patient' | 'doctor' | 'staff' | 'admin';
}

export const PatientDoctorMessaging: React.FC<MessagingSystemProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagingService = MessagingService.getInstance();

  const [newConversationData, setNewConversationData] = useState({
    recipientId: '',
    recipientName: '',
    subject: '',
    conversationType: 'general_inquiry' as Conversation['conversationType'],
    priority: 'normal' as Conversation['priority'],
    initialMessage: ''
  });

  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      // Get message threads from database
      const threads = await messagingService.getMessageThreads(currentUserId);
      
      // Convert MessageThread to Conversation format
      const conversations: Conversation[] = threads.map((thread: any) => ({
        id: thread.id,
        patientId: thread.patient_id,
        patientName: thread.patient?.name || 'Unknown Patient',
        healthcareProviderId: thread.doctor_id,
        healthcareProviderName: thread.doctor?.name || 'Unknown Doctor',
        healthcareProviderRole: 'doctor' as const,
        subject: `Conversation with ${currentUserRole === 'patient' ? thread.doctor?.name : thread.patient?.name}`,
        conversationType: 'general_inquiry' as const,
        status: 'active' as const,
        priority: 'normal' as const,
        lastMessageAt: thread.last_message_at || thread.created_at,
        unreadCount: thread.unread_count || 0,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at || thread.created_at
      }));

      setConversations(conversations);
      if (conversations.length > 0) {
        setSelectedConversation(conversations[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Find the conversation to get the other participant
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Determine the other participant
      const otherUserId = currentUserRole === 'patient' 
        ? conversation.healthcareProviderId 
        : conversation.patientId;

      // Get messages from database
      const dbMessages = await messagingService.getMessages(currentUserId, otherUserId);
      
      // Convert database messages to component format
      const formattedMessages: Message[] = dbMessages.map((msg: any) => ({
        id: msg.id,
        conversationId: conversationId,
        senderId: msg.sender_id,
        senderName: msg.sender?.name || 'Unknown',
        senderRole: msg.sender?.role === 'admin' ? 'staff' : (msg.sender?.role || 'patient') as 'patient' | 'doctor' | 'staff',
        recipientId: msg.receiver_id,
        messageType: msg.message_type === 'text' ? 'text' : msg.message_type as 'text' | 'image' | 'document' | 'audio' | 'system',
        messageContent: msg.message_text,
        isUrgent: false, // Could be added to database schema
        isRead: msg.is_read,
        readAt: msg.read_at,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at || msg.created_at
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && !attachedFile)) {
      return;
    }

    setIsSending(true);
    try {
      const recipientId = currentUserRole === 'patient' 
        ? selectedConversation.healthcareProviderId 
        : selectedConversation.patientId;
      
      // Send message through database service
      const messageType = attachedFile ? (attachedFile.type.startsWith('image/') ? 'image' : 'file') : 'text';
      
      const sentMessage = await messagingService.sendMessage(
        currentUserId,
        recipientId,
        newMessage.trim(),
        undefined, // appointmentId - could be added to conversation interface later
        messageType
      );

      // Convert database message to component format
      const newMessageObj: Message = {
        id: sentMessage.id,
        conversationId: selectedConversation.id,
        senderId: sentMessage.sender_id,
        senderName: sentMessage.sender?.name || currentUserName,
        senderRole: sentMessage.sender?.role === 'admin' ? 'admin' : (sentMessage.sender?.role || currentUserRole) as 'patient' | 'doctor' | 'staff' | 'admin',
        recipientId: sentMessage.receiver_id,
        messageType: sentMessage.message_type as 'text' | 'image' | 'document' | 'audio' | 'system',
        messageContent: sentMessage.message_text,
        attachmentUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined,
        isUrgent: false,
        isRead: sentMessage.is_read,
        readAt: sentMessage.read_at,
        createdAt: sentMessage.created_at,
        updatedAt: sentMessage.updated_at || sentMessage.created_at
      };

      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Update conversation's last message time
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessageAt: new Date().toISOString() }
          : conv
      ));

      toast({
        title: "Message Sent",
        description: "Your message has been delivered",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to Send",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setAttachedFile(file);
      toast({
        title: "File Attached",
        description: `${file.name} is ready to send`,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConversationTypeLabel = (type: string) => {
    const labels = {
      'appointment_related': 'Appointment',
      'general_inquiry': 'General',
      'prescription_refill': 'Prescription',
      'lab_results': 'Lab Results',
      'follow_up': 'Follow-up',
      'complaint': 'Complaint'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (currentUserRole === 'patient' ? conv.healthcareProviderName : conv.patientName)
      .toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[800px] bg-gray-50 rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button
              size="sm"
              onClick={() => setShowNewConversation(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {currentUserRole === 'patient' 
                        ? conversation.healthcareProviderName.split(' ').map(n => n[0]).join('')
                        : conversation.patientName.split(' ').map(n => n[0]).join('')
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">
                      {currentUserRole === 'patient' 
                        ? conversation.healthcareProviderName 
                        : conversation.patientName
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {getConversationTypeLabel(conversation.conversationType)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 truncate flex-1">
                  {conversation.subject}
                </p>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ml-2 ${getPriorityColor(conversation.priority)}`}
                >
                  {conversation.priority}
                </Badge>
              </div>
            </div>
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {currentUserRole === 'patient' 
                      ? selectedConversation.healthcareProviderName.split(' ').map(n => n[0]).join('')
                      : selectedConversation.patientName.split(' ').map(n => n[0]).join('')
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {currentUserRole === 'patient' 
                      ? selectedConversation.healthcareProviderName 
                      : selectedConversation.patientName
                    }
                  </h3>
                  <p className="text-sm text-gray-600">{selectedConversation.subject}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  Video
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {message.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">{message.senderName}</span>
                        </div>
                      )}
                      
                      <div
                        className={`p-3 rounded-lg ${
                          isOwn 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {message.isUrgent && (
                          <div className="flex items-center gap-1 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-red-500'}`}>
                              Urgent
                            </span>
                          </div>
                        )}
                        
                        {message.messageContent && (
                          <p className="text-sm">{message.messageContent}</p>
                        )}
                        
                        {message.attachmentUrl && (
                          <div className="mt-2">
                            {message.messageType === 'image' ? (
                              <img 
                                src={message.attachmentUrl} 
                                alt="Attachment" 
                                className="max-w-full h-auto rounded"
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">Attachment</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                          {isOwn && (
                            <div className="flex items-center gap-1">
                              {message.isRead ? (
                                <CheckCheck className="h-3 w-3 text-blue-100" />
                              ) : (
                                <Clock className="h-3 w-3 text-blue-100" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              {attachedFile && (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{attachedFile.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAttachedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="min-h-[40px] max-h-[120px] resize-none"
                    rows={1}
                  />
                </div>
                
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileAttach}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={isSending || (!newMessage.trim() && !attachedFile)}
                    className="flex items-center gap-1"
                  >
                    <Send className="h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Select a conversation to start messaging
              </h3>
              <p className="text-gray-500">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};