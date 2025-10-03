import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { MessagingService, Message, MessageThread } from '@/services/messagingService';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialThread?: MessageThread;
}

export const MessagingModal: React.FC<MessagingModalProps> = ({
  isOpen,
  onClose,
  initialThread
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(initialThread || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartingNew, setIsStartingNew] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [contactResults, setContactResults] = useState<Array<{ id: string; name: string; role: string; email?: string }>>([]);
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string; role: string; email?: string } | null>(null);
  
  const messagingService = MessagingService.getInstance();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadThreads();
      
      // Subscribe to real-time messages
      const channel = messagingService.subscribeToMessages(
        user.id,
        handleNewMessage,
        handleMessageUpdate
      );

      return () => {
        channel.unsubscribe();
      };
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!user) return;
    if (selectedThread) {
      loadMessages();
      markMessagesAsRead();
    } else if (selectedContact) {
      loadDirectMessages();
      markDirectMessagesAsRead();
    }
  }, [selectedThread, selectedContact, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadThreads = async () => {
    if (!user) return;
    
    try {
      const threadList = await messagingService.getMessageThreads(user.id);
      setThreads(threadList);
      
      if (!selectedThread && threadList.length > 0) {
        setSelectedThread(threadList[0]);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  // Search contacts for new messages
  useEffect(() => {
    const run = async () => {
      if (!user || !isStartingNew) return;
      const list = await messagingService.searchContacts(user.id, user.role as any, contactQuery, 20);
      setContactResults(list);
    };
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [contactQuery, isStartingNew, user]);

  const loadMessages = async () => {
    if (!selectedThread || !user) return;
    
    try {
      setIsLoading(true);
      const otherUserId = selectedThread.patient_id === user.id 
        ? selectedThread.doctor_id 
        : selectedThread.patient_id;
        
      const messageList = await messagingService.getMessages(
        user.id,
        otherUserId,
        selectedThread.appointment_id
      );
      
      setMessages(messageList);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedThread || !user) return;
    
    try {
      const otherUserId = selectedThread.patient_id === user.id 
        ? selectedThread.doctor_id 
        : selectedThread.patient_id;
        
      await messagingService.markMessagesAsRead(
        otherUserId,
        user.id,
        selectedThread.appointment_id
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Direct contact (non-thread) chat support
  const loadDirectMessages = async () => {
    if (!selectedContact || !user) return;
    try {
      setIsLoading(true);
      const messageList = await messagingService.getMessages(user.id, selectedContact.id);
      setMessages(messageList);
    } catch (error) {
      console.error('Error loading direct messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markDirectMessagesAsRead = async () => {
    if (!selectedContact || !user) return;
    try {
      await messagingService.markMessagesAsRead(selectedContact.id, user.id);
    } catch (error) {
      console.error('Error marking direct messages as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    try {
      // When composing to a picked contact (no patient-doctor thread), send direct message using user ids.
      if (selectedContact && !selectedThread) {
        const message = await messagingService.sendMessage(
          user.id,
          selectedContact.id,
          newMessage.trim()
        );
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        // Do not rely on threads for staff or cross-role; keep chat in memory
        return;
      }

      if (!selectedThread) return;

      const otherUserId = selectedThread.patient_id === user.id 
        ? selectedThread.doctor_id 
        : selectedThread.patient_id;
      const message = await messagingService.sendMessage(
        user.id,
        otherUserId,
        newMessage.trim(),
        selectedThread.appointment_id
      );
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      loadThreads(); // Refresh thread list to update last message
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewMessage = (message: Message) => {
    // Append in thread view
    if (selectedThread && (message.sender_id === (selectedThread.patient_id === user?.id ? selectedThread.doctor_id : selectedThread.patient_id))) {
      setMessages(prev => [...prev, message]);
      loadThreads();
      return;
    }
    // Append in direct-contact view
    if (!selectedThread && selectedContact && message.sender_id === selectedContact.id) {
      setMessages(prev => [...prev, message]);
      return;
    }
  };

  const handleMessageUpdate = (message: Message) => {
    setMessages(prev => 
      prev.map(m => m.id === message.id ? message : m)
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherUser = (thread: MessageThread) => {
    if (!user) return null;
    
    if (user.role === 'patient') {
      return thread.doctor;
    } else {
      return thread.patient;
    }
  };

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    const otherUser = getOtherUser(thread);
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] p-0">
        <div className="flex h-full">
          {/* Threads List */}
          <div className="w-1/3 border-r bg-gray-50 flex flex-col">
            <DialogHeader className="p-4 border-b bg-white">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </DialogTitle>
              <div className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className={!isStartingNew ? 'bg-blue-600 text-white' : ''} variant={!isStartingNew ? 'default' : 'outline'} onClick={() => setIsStartingNew(false)}>Conversations</Button>
                  <Button size="sm" className={isStartingNew ? 'bg-blue-600 text-white' : ''} variant={isStartingNew ? 'default' : 'outline'} onClick={() => { setIsStartingNew(true); setSelectedThread(null); }}>New Message</Button>
                </div>
                {isStartingNew && (
                  <div className="space-y-2">
                    <Input
                      placeholder={user?.role === 'patient' ? 'Search doctors and staff...' : user?.role === 'doctor' ? 'Search patients and staff...' : 'Search doctors, patients, or staff...'}
                      value={contactQuery}
                      onChange={(e) => setContactQuery(e.target.value)}
                    />
                    <ScrollArea className="max-h-64">
                      <div className="space-y-1">
                        {contactResults.map(c => (
                          <div key={c.id} className={`p-2 rounded cursor-pointer flex items-center justify-between ${selectedContact?.id === c.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'}`} onClick={() => { setSelectedContact(c); setMessages([]); }}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8"><AvatarFallback>{c.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                              <div>
                                <div className="text-sm font-medium">{c.name}</div>
                                <div className="text-xs text-gray-500 capitalize">{c.role}</div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedThread(null); setSelectedContact(c); }}>Message</Button>
                          </div>
                        ))}
                        {contactResults.length === 0 && (
                          <div className="text-center text-xs text-gray-500 py-4">No results</div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {!isStartingNew && filteredThreads.map((thread) => {
                  const otherUser = getOtherUser(thread);
                  const isSelected = selectedThread?.id === thread.id;
                  
                  return (
                    <div
                      key={thread.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-100 border border-blue-200' : 'bg-white hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedThread(thread)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" alt={otherUser?.name} />
                            <AvatarFallback>
                              {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {otherUser?.name || 'Unknown User'}
                            </p>
                            {thread.unread_count && thread.unread_count > 0 && (
                              <Badge variant="default" className="text-xs">
                                {thread.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {thread.last_message?.message_text || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(thread.last_message_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {!isStartingNew && filteredThreads.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No conversations found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedThread || selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => { setSelectedThread(null); setSelectedContact(null); }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" alt={selectedThread ? getOtherUser(selectedThread)?.name : selectedContact?.name} />
                      <AvatarFallback>
                        {(selectedThread ? getOtherUser(selectedThread)?.name : selectedContact?.name)?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">{selectedThread ? (getOtherUser(selectedThread)?.name || 'Unknown User') : (selectedContact?.name || 'Unknown User')}</h3>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender_id === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-3xl ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="text-sm">{message.message_text}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                              {format(new Date(message.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 rounded-full border-gray-300 bg-gray-50"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className="bg-blue-500 hover:bg-blue-600 rounded-full h-10 w-10 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};