import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  appointment_id?: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    name: string;
    role: string;
  };
  receiver?: {
    name: string;
    role: string;
  };
}

export interface MessageThread {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  last_message_id?: string;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  patient?: {
    name: string;
  };
  doctor?: {
    name: string;
  };
  last_message?: Message;
  unread_count?: number;
}

export interface OnlineStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  status_message?: string;
}

export class MessagingService {
  private static instance: MessagingService;
  
  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  /**
   * Send a new message
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    messageText: string,
    appointmentId?: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text'
  ): Promise<Message> {
    try {
      // Insert the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          appointment_id: appointmentId,
          message_text: messageText,
          message_type: messageType,
          is_read: false
        })
        .select('*')
        .single();

      if (messageError) throw messageError;

      // Update or create message thread
      await this.updateMessageThread(senderId, receiverId, messageData.id, appointmentId);

      // Return message with sender info
      const { data: messageWithSender, error: senderError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(name, role),
          receiver:users!messages_receiver_id_fkey(name, role)
        `)
        .eq('id', messageData.id)
        .single();

      if (senderError) throw senderError;

      return messageWithSender;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation between two users
   */
  async getMessages(
    userId1: string,
    userId2: string,
    appointmentId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(name, role),
          receiver:users!messages_receiver_id_fkey(name, role)
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Get message threads for a user
   */
  async getMessageThreads(userId: string): Promise<MessageThread[]> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          patient:users!message_threads_patient_id_fkey(name),
          doctor:users!message_threads_doctor_id_fkey(name),
          last_message:messages(*)
        `)
        .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get unread count for each thread
      const threadsWithUnreadCount = await Promise.all(
        (data || []).map(async (thread) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .or(`and(sender_id.eq.${thread.patient_id},receiver_id.eq.${userId}),and(sender_id.eq.${thread.doctor_id},receiver_id.eq.${userId})`)
            .eq('is_read', false);

          return {
            ...thread,
            unread_count: count || 0
          };
        })
      );

      return threadsWithUnreadCount;
    } catch (error) {
      console.error('Error fetching message threads:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(senderId: string, receiverId: string, appointmentId?: string): Promise<void> {
    try {
      let query = supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .eq('is_read', false);

      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Get or create message thread
   */
  async getOrCreateThread(
    patientId: string,
    doctorId: string,
    appointmentId?: string
  ): Promise<MessageThread> {
    try {
      // Try to find existing thread
      let query = supabase
        .from('message_threads')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId);

      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      }

      const { data: existingThread } = await query.single();

      if (existingThread) {
        return existingThread;
      }

      // Create new thread
      const { data: newThread, error } = await supabase
        .from('message_threads')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId,
          is_active: true
        })
        .select('*')
        .single();

      if (error) throw error;
      return newThread;
    } catch (error) {
      console.error('Error getting/creating thread:', error);
      throw error;
    }
  }

  /**
   * Update message thread with latest message
   */
  private async updateMessageThread(
    senderId: string,
    receiverId: string,
    messageId: string,
    appointmentId?: string
  ): Promise<void> {
    try {
      // Determine patient and doctor IDs
      const { data: senderData } = await supabase
        .from('users')
        .select('role')
        .eq('id', senderId)
        .single();

      const { data: receiverData } = await supabase
        .from('users')
        .select('role')
        .eq('id', receiverId)
        .single();

      // Only upsert threads for patient-doctor conversations.
      // For any conversation involving staff, skip thread upsert (direct messages will still work).
      const roles = [senderData?.role, receiverData?.role];
      const isPatientDoctorPair = roles.includes('patient') && roles.includes('doctor');
      if (!isPatientDoctorPair) {
        return;
      }

      const patientId = senderData?.role === 'patient' ? senderId : receiverId;
      const doctorId = senderData?.role === 'doctor' ? senderId : receiverId;

      // Try to find existing thread
      const { data: existingThread } = await supabase
        .from('message_threads')
        .select('id')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .is('appointment_id', appointmentId || null)
        .single();

      if (existingThread) {
        // Update existing thread
        const { error: updateError } = await supabase
          .from('message_threads')
          .update({
            last_message_id: messageId,
            last_message_at: new Date().toISOString(),
            is_active: true
          })
          .eq('id', existingThread.id);

        if (updateError) {
          console.error('Error updating thread:', updateError);
        }
      } else {
        // Create new thread
        const { error: insertError } = await supabase
          .from('message_threads')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_id: appointmentId,
            last_message_id: messageId,
            last_message_at: new Date().toISOString(),
            is_active: true
          });

        if (insertError) {
          console.error('Error creating thread:', insertError);
        }
      }
    } catch (error) {
      console.error('Error updating message thread:', error);
    }
  }

  /**
   * Search contacts by name/email constrained by the current user's allowed roles
   * - patient: can search doctor, staff
   * - doctor: can search patient, staff
   * - staff: can search doctor, patient, staff
   */
  async searchContacts(currentUserId: string, currentUserRole: 'patient' | 'doctor' | 'staff' | 'admin', query: string, limit: number = 20): Promise<Array<{ id: string; name: string; role: string; email?: string }>> {
    try {
      const roleMap: Record<string, string[]> = {
        patient: ['doctor', 'staff'],
        doctor: ['patient', 'staff'],
        staff: ['doctor', 'patient', 'staff'],
        admin: ['doctor', 'patient', 'staff', 'admin']
      };
      const allowedRoles = roleMap[currentUserRole] || ['doctor', 'patient', 'staff'];

      let q = supabase
        .from('users')
        .select('id, name, role, email')
        .neq('id', currentUserId)
        .in('role', allowedRoles)
        .order('name', { ascending: true })
        .limit(limit);

      if (query && query.trim()) {
        // Case-insensitive partial match on name or email
        q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string; role: string; email?: string }>;
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean, statusMessage?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_online_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          status_message: statusMessage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  /**
   * Get user online status
   */
  async getOnlineStatus(userId: string): Promise<OnlineStatus | null> {
    try {
      const { data, error } = await supabase
        .from('user_online_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching online status:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  subscribeToMessages(
    userId: string,
    onMessage: (message: Message) => void,
    onMessageUpdate: (message: Message) => void
  ) {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId}`
        },
        (payload) => {
          onMessageUpdate(payload.new as Message);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to online status updates
   */
  subscribeToOnlineStatus(onStatusUpdate: (status: OnlineStatus) => void) {
    const channel = supabase
      .channel('online_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_online_status'
        },
        (payload) => {
          onStatusUpdate(payload.new as OnlineStatus);
        }
      )
      .subscribe();

    return channel;
  }
}