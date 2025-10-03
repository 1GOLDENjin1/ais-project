// Video SDK service for managing video call functionality
// Uses VideoSDK.live API for creating and managing video meetings

export interface VideoMeeting {
  meetingId: string;
  roomId: string;
  token: string;
  participants: VideoParticipant[];
  status: 'created' | 'ongoing' | 'ended';
  createdAt: Date;
  endedAt?: Date;
  appointmentId?: string;
}

export interface VideoParticipant {
  participantId: string;
  name: string;
  role: 'doctor' | 'patient';
  isHost: boolean;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface CreateMeetingRequest {
  appointmentId: string;
  doctorName: string;
  patientName: string;
  duration?: number; // minutes
}

export interface JoinMeetingRequest {
  meetingId: string;
  participantName: string;
  role: 'doctor' | 'patient';
}

class VideoSDKService {
  private readonly apiKey = 'dc525489-e793-446e-bfc9-c9e57a8d42a0';
  private readonly secretKey = '2b57177be1f2a955f8248919200f1aad1e9669f02d9c4a37eb6fc820d56a788f';
  private readonly baseUrl = 'https://api.videosdk.live';
  
  private meetings: Map<string, VideoMeeting> = new Map();

  // Generate authentication token for VideoSDK
  private async generateToken(options: { 
    permissions?: string[], 
    version?: number,
    roomId?: string 
  } = {}): Promise<string> {
    try {
      const payload = {
        apikey: this.apiKey,
        permissions: options.permissions || ['allow_join', 'allow_mod'],
        version: options.version || 2,
        ...(options.roomId && { roomId: options.roomId })
      };

      const response = await fetch(`${this.baseUrl}/v2/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': this.secretKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`VideoSDK API error: ${data.message || response.statusText}`);
      }

      return data.token;
    } catch (error) {
      console.error('Error generating VideoSDK token:', error);
      throw error;
    }
  }

  // Create a new video meeting room
  async createMeeting(request: CreateMeetingRequest): Promise<VideoMeeting> {
    try {
      const token = await this.generateToken({
        permissions: ['allow_join', 'allow_mod', 'ask_join']
      });

      const response = await fetch(`${this.baseUrl}/v2/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': this.secretKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to create meeting room: ${data.message || response.statusText}`);
      }

      const meetingId = data.roomId;
      const meeting: VideoMeeting = {
        meetingId,
        roomId: meetingId,
        token,
        participants: [],
        status: 'created',
        createdAt: new Date(),
        appointmentId: request.appointmentId
      };

      this.meetings.set(meetingId, meeting);
      
      console.log(`Video meeting created: ${meetingId} for appointment: ${request.appointmentId}`);
      return meeting;
    } catch (error) {
      console.error('Error creating video meeting:', error);
      throw error;
    }
  }

  // Get meeting details
  getMeeting(meetingId: string): VideoMeeting | null {
    return this.meetings.get(meetingId) || null;
  }

  // Get meeting by appointment ID
  getMeetingByAppointment(appointmentId: string): VideoMeeting | null {
    for (const meeting of this.meetings.values()) {
      if (meeting.appointmentId === appointmentId) {
        return meeting;
      }
    }
    return null;
  }

  // Generate join token for a specific meeting
  async generateJoinToken(meetingId: string, participantName: string, role: 'doctor' | 'patient'): Promise<string> {
    try {
      const meeting = this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const token = await this.generateToken({
        permissions: ['allow_join', role === 'doctor' ? 'allow_mod' : 'ask_join'],
        roomId: meetingId
      });

      return token;
    } catch (error) {
      console.error('Error generating join token:', error);
      throw error;
    }
  }

  // Join a meeting
  async joinMeeting(request: JoinMeetingRequest): Promise<{ 
    token: string, 
    meetingId: string,
    config: any 
  }> {
    try {
      const meeting = this.getMeeting(request.meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const token = await this.generateJoinToken(
        request.meetingId, 
        request.participantName, 
        request.role
      );

      // Add participant to meeting
      const participant: VideoParticipant = {
        participantId: `${request.role}-${Date.now()}`,
        name: request.participantName,
        role: request.role,
        isHost: request.role === 'doctor',
        joinedAt: new Date()
      };

      meeting.participants.push(participant);
      meeting.status = 'ongoing';
      this.meetings.set(request.meetingId, meeting);

      const config = {
        meetingId: request.meetingId,
        micEnabled: false, // Start with mic muted
        webcamEnabled: false, // Start with camera off
        name: request.participantName,
        mode: 'CONFERENCE', // or 'VIEWER' for view-only
        multiStream: true
      };

      return { token, meetingId: request.meetingId, config };
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  }

  // End a meeting
  async endMeeting(meetingId: string): Promise<boolean> {
    try {
      const meeting = this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Call VideoSDK API to end the room (optional - rooms auto-end when empty)
      meeting.status = 'ended';
      meeting.endedAt = new Date();
      
      // Mark all participants as left
      meeting.participants = meeting.participants.map(p => ({
        ...p,
        leftAt: p.leftAt || new Date()
      }));

      this.meetings.set(meetingId, meeting);

      console.log(`Video meeting ended: ${meetingId}`);
      return true;
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  }

  // Get all meetings for an appointment
  getMeetingsForAppointment(appointmentId: string): VideoMeeting[] {
    return Array.from(this.meetings.values())
      .filter(meeting => meeting.appointmentId === appointmentId);
  }

  // Leave meeting (for a specific participant)
  async leaveMeeting(meetingId: string, participantId: string): Promise<boolean> {
    try {
      const meeting = this.getMeeting(meetingId);
      if (!meeting) {
        return false;
      }

      const participantIndex = meeting.participants.findIndex(p => p.participantId === participantId);
      if (participantIndex >= 0) {
        meeting.participants[participantIndex].leftAt = new Date();
        this.meetings.set(meetingId, meeting);
      }

      // Check if all participants have left
      const activeParticipants = meeting.participants.filter(p => !p.leftAt);
      if (activeParticipants.length === 0) {
        meeting.status = 'ended';
        meeting.endedAt = new Date();
      }

      return true;
    } catch (error) {
      console.error('Error leaving meeting:', error);
      return false;
    }
  }

  // Validate VideoSDK configuration
  async validateConnection(): Promise<boolean> {
    try {
      const token = await this.generateToken();
      return !!token;
    } catch (error) {
      console.error('VideoSDK connection validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const videoSDK = new VideoSDKService();

// Export types and service
export default VideoSDKService;
export { VideoSDKService };