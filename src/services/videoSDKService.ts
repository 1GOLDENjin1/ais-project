import axios from 'axios';

// VideoSDK Configuration (provided)
export const VIDEOSDK_CONFIG = {
  API_KEY: 'dc525489-e793-446e-bfc9-c9e57a8d42a0',
  SECRET_KEY: '2b57177be1f2a955f8248919200f1aad1e9669f02d9c4a37eb6fc820d56a788f',
  API_BASE_URL: 'https://api.videosdk.live'
};

// Lightweight JWT (HS256) generator using Web Crypto API (dev-only; move to server for production)
async function generateDevToken({
  apikey,
  secret,
  permissions = ['allow_join'],
  expiresInSeconds = 60 * 60, // 1 hour
}: {
  apikey: string;
  secret: string;
  permissions?: string[];
  expiresInSeconds?: number;
}): Promise<string> {
  const enc = new TextEncoder();

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: Record<string, any> = {
    apikey,
    permissions,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const base64url = (input: string) =>
    btoa(input)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const signatureB64 = base64url(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${signatureB64}`;
}

export interface VideoCallSession {
  meetingId: string;
  token: string;
  participantToken: string;
  meetingUrl: string;
  appointmentId?: string;
}

export interface CreateMeetingRequest {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  duration?: number;
  enableRecording?: boolean;
}

export class VideoSDKService {
  private static instance: VideoSDKService;
  
  public static getInstance(): VideoSDKService {
    if (!VideoSDKService.instance) {
      VideoSDKService.instance = new VideoSDKService();
    }
    return VideoSDKService.instance;
  }

  /**
   * Create a new meeting session
   */
  async createMeeting(): Promise<{ meetingId: string }> {
    try {
      const token = await generateDevToken({
        apikey: VIDEOSDK_CONFIG.API_KEY,
        secret: VIDEOSDK_CONFIG.SECRET_KEY,
        permissions: ['allow_join', 'allow_mod'],
      });

      const response = await axios.post(
        `${VIDEOSDK_CONFIG.API_BASE_URL}/v2/rooms`,
        {},
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        meetingId: response.data.roomId
      };
    } catch (error) {
      console.error('Error creating VideoSDK meeting:', error);
      throw new Error('Failed to create video meeting');
    }
  }

  /**
   * Generate participant token for joining a meeting
   */
  generateParticipantToken(meetingId: string, participantId: string): string {
    // Deprecated sync API; prefer async getParticipantToken
    console.warn('generateParticipantToken() is deprecated. Use getParticipantToken()');
    return '';
  }

  async getParticipantToken(role: 'doctor' | 'patient'): Promise<string> {
    const permissions = ['allow_join', ...(role === 'doctor' ? ['allow_mod'] : [])];
    return generateDevToken({
      apikey: VIDEOSDK_CONFIG.API_KEY,
      secret: VIDEOSDK_CONFIG.SECRET_KEY,
      permissions,
    });
  }

  /**
   * Start a video call session for an appointment
   */
  async startVideoCallSession(request: CreateMeetingRequest): Promise<VideoCallSession> {
    try {
      // First: if appointment already has a video call, reuse it
      if (request.appointmentId) {
        const existing = await this.getVideoCallByAppointment(request.appointmentId);
        if (existing && existing.room_id && (existing.status === 'scheduled' || existing.status === 'ongoing')) {
          const token = await this.getParticipantToken('doctor');
          const participantToken = await this.getParticipantToken('patient');
          const meetingId = existing.room_id;
          const meetingUrl = existing.call_link || `${window.location.origin}/video-call/${meetingId}`;
          return {
            meetingId,
            token,
            participantToken,
            meetingUrl,
            appointmentId: request.appointmentId,
          };
        }
      }

      // Otherwise create a fresh meeting
      const { meetingId } = await this.createMeeting();

      const token = await this.getParticipantToken('doctor');
      const participantToken = await this.getParticipantToken('patient');

      const meetingUrl = `${window.location.origin}/video-call/${meetingId}`;

      // Try to persist; if a conflict occurs (409), fall back to the existing call
      try {
        await this.saveVideoCallToDatabase({
          appointmentId: request.appointmentId,
          doctorId: request.doctorId,
          patientId: request.patientId,
          meetingId,
          meetingUrl,
          enableRecording: request.enableRecording || false,
        });
      } catch (err: any) {
        const status = err?.status || err?.code;
        if (status === 409 || status === '23505') {
          // Fetch existing row created previously and reuse its identifiers
          if (request.appointmentId) {
            const existing = await this.getVideoCallByAppointment(request.appointmentId);
            if (existing && existing.room_id) {
              return {
                meetingId: existing.room_id,
                token,
                participantToken,
                meetingUrl: existing.call_link || `${window.location.origin}/video-call/${existing.room_id}`,
                appointmentId: request.appointmentId,
              };
            }
          }
          // If we couldn't fetch, rethrow original conflict
          throw err;
        }
        throw err;
      }

      return {
        meetingId,
        token,
        participantToken,
        meetingUrl,
        appointmentId: request.appointmentId,
      };
    } catch (error) {
      console.error('Error starting video call session:', error);
      throw new Error('Failed to start video call');
    }
  }

  /**
   * Join an existing meeting
   */
  async joinMeeting(meetingId: string, participantId: string): Promise<string> {
    // Always issue a patient token from client-side join
    return this.getParticipantToken('patient');
  }

  /**
   * End a meeting
   */
  async endMeeting(meetingId: string): Promise<void> {
    try {
      const token = await generateDevToken({
        apikey: VIDEOSDK_CONFIG.API_KEY,
        secret: VIDEOSDK_CONFIG.SECRET_KEY,
        permissions: ['allow_join', 'allow_mod'],
      });
      await axios.post(
        `${VIDEOSDK_CONFIG.API_BASE_URL}/v2/rooms/${meetingId}/end`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw new Error('Failed to end meeting');
    }
  }

  /**
   * Get meeting recordings
   */
  async getMeetingRecordings(meetingId: string): Promise<any[]> {
    try {
      const token = await generateDevToken({
        apikey: VIDEOSDK_CONFIG.API_KEY,
        secret: VIDEOSDK_CONFIG.SECRET_KEY,
        permissions: ['allow_join', 'allow_mod'],
      });
      const response = await axios.get(
        `${VIDEOSDK_CONFIG.API_BASE_URL}/v2/recordings?roomId=${meetingId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  }

  /**
   * Save video call session to database
   */
  private async saveVideoCallToDatabase(data: {
    appointmentId?: string;
    doctorId: string;
    patientId?: string;
    meetingId: string;
    meetingUrl: string;
    enableRecording: boolean;
  }): Promise<void> {
    // This would use your Supabase client to save to video_calls table
    const { supabase } = await import('@/lib/supabase');
    
    try {
      const insertPayload: any = {
        appointment_id: data.appointmentId || null,
        doctor_id: data.doctorId,
        patient_id: data.patientId || null,
        room_id: data.meetingId,
        call_link: data.meetingUrl,
        status: 'scheduled',
        is_recording: data.enableRecording ?? false
      };

      const { error, status } = await supabase
        .from('video_calls')
        .insert(insertPayload);

      if (error) {
        // Surface HTTP status if available for upstream handling
        (error as any).status = status;
        throw error;
      }
    } catch (error) {
      console.error('Error saving video call to database:', error);
      throw error;
    }
  }

  /**
   * Get video call by appointment ID
   */
  async getVideoCallByAppointment(appointmentId: string): Promise<any> {
    const { supabase } = await import('@/lib/supabase');
    
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching video call:', error);
      return null;
    }
  }
}