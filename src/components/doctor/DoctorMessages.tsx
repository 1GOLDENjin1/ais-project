import React, { useEffect, useState, useRef } from 'react';
import DoctorManagementService, { DoctorMessageThread, DoctorProfile } from '@/services/doctorDatabaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Search, Phone, Video, MoreVertical, ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MessagingService, Message } from '@/services/messagingService';
import { format } from 'date-fns';

interface DoctorMessagesProps {
  doctorProfile: DoctorProfile;
}

const DoctorMessages: React.FC<DoctorMessagesProps> = ({ doctorProfile }) => {
  const [threads, setThreads] = useState<DoctorMessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<DoctorMessageThread | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStartingNew, setIsStartingNew] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactResults, setContactResults] = useState<Array<{ id: string; name: string; role: string; email?: string }>>([]);
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string; role: string; email?: string } | null>(null);
  const { toast } = useToast();
  const messagingService = MessagingService.getInstance();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    setLoading(true);
    try {
      // message_threads.doctor_id references the user's id, not doctors.id
      const data = await DoctorManagementService.getMyMessageThreads(doctorProfile.user_id);
      setThreads(data);
      if (!activeThread && data.length > 0) {
        setActiveThread(data[0]);
        setIsStartingNew(false);
      }
      if (data.length === 0) {
        // No threads yet: guide to New Message search
        setIsStartingNew(true);
      }
    } catch (e) {
      toast({ title: 'Failed to load messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [doctorProfile.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages for selected conversation (thread or direct contact)
  useEffect(() => {
    const run = async () => {
      if (!doctorProfile?.id) return;
      try {
        if (activeThread) {
          const otherUserId = activeThread.patient_id;
          const list = await messagingService.getMessages(doctorProfile.user_id, otherUserId, activeThread.appointment_id);
          setMessages(list);
          await messagingService.markMessagesAsRead(otherUserId, doctorProfile.user_id, activeThread.appointment_id);
        } else if (selectedContact) {
          const list = await messagingService.getMessages(doctorProfile.user_id, selectedContact.id);
          setMessages(list);
          await messagingService.markMessagesAsRead(selectedContact.id, doctorProfile.user_id);
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error('Error loading messages:', e);
      }
    };
    run();
  }, [activeThread, selectedContact, doctorProfile.id]);

  // Debounced search for contacts (patients + staff)
  useEffect(() => {
    if (!isStartingNew) return;
    const t = setTimeout(async () => {
      try {
  const list = await messagingService.searchContacts(doctorProfile.user_id, 'doctor', contactQuery, 20);
        setContactResults(list);
      } catch (e) {
        console.error('Contact search failed:', e);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [contactQuery, isStartingNew, doctorProfile.id]);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      if (selectedContact && !activeThread) {
        const sent = await messagingService.sendMessage(doctorProfile.user_id, selectedContact.id, message.trim());
        setMessages((prev) => [...prev, sent]);
        setMessage('');
        return;
      }

      if (!activeThread) return;
      const otherUserId = activeThread.patient_id;
      const sent = await messagingService.sendMessage(
        doctorProfile.user_id,
        otherUserId,
        message.trim(),
        activeThread.appointment_id
      );
      setMessages((prev) => [...prev, sent]);
      setMessage('');
      loadThreads();
    } catch (e) {
      toast({ title: 'Failed to send', variant: 'destructive' });
    }
  };

  const filteredThreads = threads.filter((t) =>
    t.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-200px)] flex bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Left Sidebar - Conversations */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h3 className="text-lg font-semibold mb-3">Messages</h3>
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* New Message Button */}
            <Button
              className="w-full mb-3"
              variant={isStartingNew ? 'default' : 'outline'}
              onClick={() => { setIsStartingNew(!isStartingNew); setActiveThread(null); }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              New Message
            </Button>

            {isStartingNew && (
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Search patients and staff..."
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-1 max-h-64 overflow-auto">
                  {contactResults.map((c) => (
                    <button
                      key={c.id}
                      className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                        selectedContact?.id === c.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => { setSelectedContact(c); setActiveThread(null); setIsStartingNew(false); }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {c.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{c.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{c.role}</div>
                        </div>
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </button>
                  ))}
                  {contactResults.length === 0 && (
                    <div className="py-6 text-center text-gray-500 text-sm">No results</div>
                  )}
                </div>
              </div>
            )}

            {/* Active Threads */}
            {!isStartingNew && filteredThreads.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-2 px-2">Recent Conversations</h4>
                {filteredThreads.map((t) => (
                  <button
                    key={t.id}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors mb-1 ${
                      activeThread?.id === t.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => { setActiveThread(t); setSelectedContact(null); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {t.patient?.name?.charAt(0).toUpperCase() || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{t.patient?.name || 'Patient'}</div>
                        <div className="text-xs text-gray-500 truncate">
                          Last message
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-[10px] text-gray-400">
                          {format(new Date(t.last_message_at), 'MMM d')}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isStartingNew && threads.length === 0 && !loading && (
              <div className="text-center text-sm text-gray-400 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                No conversations yet
              </div>
            )}

            {loading && (
              <div className="py-8 text-center text-gray-500">Loading…</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeThread || selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-300 text-gray-600">
                    {(activeThread?.patient?.name || selectedContact?.name)?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base">
                    {activeThread?.patient?.name || selectedContact?.name || 'User'}
                  </h3>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    No messages yet. Start the conversation!
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === doctorProfile.user_id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-3xl ${
                      m.sender_id === doctorProfile.user_id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap break-words">{m.message_text}</div>
                      <div className={`text-xs mt-1 ${
                        m.sender_id === doctorProfile.user_id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {format(new Date(m.created_at), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 rounded-full border-gray-300 bg-gray-50"
                />
                <Button 
                  onClick={handleSend} 
                  className="bg-blue-500 hover:bg-blue-600 rounded-full h-10 w-10 p-0"
                  disabled={!message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorMessages;
