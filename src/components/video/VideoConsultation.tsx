// ===================================================
// VIDEO CONSULTATION COMPONENT - Main video call interface
// Complete VideoSDK integration for patient-doctor consultations
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import { MeetingProvider, useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { supabase } from '@/lib/supabase';
import { VideoSDKService, VIDEOSDK_CONFIG } from '@/services/videoSDKService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MessageCircle,
  Users,
  Clock,
  FileText,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoConsultationProps {
  meetingId: string;
  appointmentId: string;
  userRole: 'doctor' | 'patient';
  userId: string;
  userName: string;
}

interface ParticipantViewProps {
  participantId: string;
  isLocal?: boolean;
}

// Participant Video View Component
function ParticipantView({ participantId, isLocal = false }: ParticipantViewProps) {
  const micRef = useRef<HTMLAudioElement>(null);
  const { webcamStream, micStream, webcamOn, micOn, isActiveSpeaker, displayName } = useParticipant(participantId);

  const videoStream = React.useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current && micStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      micRef.current.srcObject = mediaStream;
      micRef.current.play().catch(error => console.error('Error playing audio:', error));
    }
  }, [micStream]);

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden bg-gray-900",
      isActiveSpeaker && "ring-2 ring-blue-500",
      isLocal ? "aspect-video" : "aspect-video"
    )}>
      {/* Video Stream */}
      <div className="absolute inset-0">
        {webcamOn && videoStream ? (
          <video
            ref={(ref) => {
              if (ref && videoStream) {
                ref.srcObject = videoStream;
              }
            }}
            autoPlay
            muted={isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-semibold">
                  {displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <p className="text-sm opacity-75">{displayName || 'Participant'}</p>
              <p className="text-xs opacity-50 mt-1">Camera off</p>
            </div>
          </div>
        )}
      </div>

      {/* Audio Stream */}
      <audio ref={micRef} autoPlay muted={isLocal} />

      {/* Participant Info Overlay */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="bg-black/50 rounded px-2 py-1 flex items-center justify-between">
          <span className="text-white text-sm truncate">
            {displayName || 'Participant'} {isLocal && '(You)'}
          </span>
          <div className="flex items-center space-x-1">
            {!micOn && <MicOff className="h-3 w-3 text-red-400" />}
            {isActiveSpeaker && <Volume2 className="h-3 w-3 text-green-400" />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Controls Component
function MeetingControls() {
  const { 
    join, 
    leave, 
    toggleMic, 
    toggleWebcam, 
    startRecording, 
    stopRecording,
    meetingId,
    participants
  } = useMeeting();

  const [micOn, setMicOn] = useState(true);
  const [webcamOn, setWebcamOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [callStartTime]);

  const handleToggleMic = () => {
    toggleMic();
    setMicOn(prev => !prev);
  };

  const handleToggleWebcam = () => {
    toggleWebcam();
    setWebcamOn(prev => !prev);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(prev => !prev);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Call Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(callDuration)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{participants.size} participant{participants.size !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant={micOn ? "outline" : "destructive"}
            size="sm"
            onClick={handleToggleMic}
            className="w-12 h-12 rounded-full"
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          <Button
            variant={webcamOn ? "outline" : "destructive"}
            size="sm"
            onClick={handleToggleWebcam}
            className="w-12 h-12 rounded-full"
          >
            {webcamOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleRecording}
            className={cn(
              "w-12 h-12 rounded-full",
              isRecording && "bg-red-100 border-red-300 text-red-600"
            )}
          >
            <Monitor className="h-4 w-4" />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={leave}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Meeting Container Component
function MeetingContainer({ 
  appointmentId, 
  userRole, 
  userId, 
  userName 
}: Omit<VideoConsultationProps, 'meetingId'>) {
  const [joined, setJoined] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [videoCallData, setVideoCallData] = useState<any>(null);

  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => {
      console.log('✅ Meeting joined successfully');
      setJoined(true);
      handleMeetingJoined();
    },
    onMeetingLeft: () => {
      console.log('👋 Left meeting');
      setJoined(false);
      handleMeetingLeft();
    },
    onParticipantJoined: (participant) => {
      console.log('👤 Participant joined:', participant.displayName);
    },
    onParticipantLeft: (participant) => {
      console.log('👤 Participant left:', participant.displayName);
    }
  });

  useEffect(() => {
    loadAppointmentData();
  }, [appointmentId]);

  const loadAppointmentData = async () => {
    try {
      // Load appointment details
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!inner(
            *,
            users!inner(name, email, phone)
          ),
          doctors!inner(
            *,
            users!inner(name, email, phone)
          )
        `)
        .eq('id', appointmentId)
        .single();

      setAppointmentData(appointment);

      // Load video call details
      const videoSDKService = VideoSDKService.getInstance();
      const videoCall = await videoSDKService.getVideoCallByAppointment(appointmentId);
      setVideoCallData(videoCall);
    } catch (error) {
      console.error('Error loading appointment data:', error);
    }
  };

  const handleMeetingJoined = async () => {
    if (videoCallData) {
      const videoSDKService = VideoSDKService.getInstance();
      await videoSDKService.startVideoCall(videoCallData.id);
      await videoSDKService.addParticipant(videoCallData.id, userId, userRole === 'doctor');
    }
  };

  const handleMeetingLeft = async () => {
    if (videoCallData) {
      const videoSDKService = VideoSDKService.getInstance();
      await videoSDKService.removeParticipant(videoCallData.id, userId);
      
      // If this is the last participant, end the call
      if (participants.size <= 1) {
        const durationMinutes = videoCallData.started_at 
          ? Math.floor((Date.now() - new Date(videoCallData.started_at).getTime()) / 60000)
          : undefined;
        
        await videoSDKService.endVideoCall(videoCallData.id, durationMinutes);
      }
    }
  };

  const participantsArray = Array.from(participants.keys());
  const localParticipantId = participantsArray[0];
  const remoteParticipantId = participantsArray.find(id => id !== localParticipantId);

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Join Video Consultation</CardTitle>
            {appointmentData && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  {userRole === 'doctor' ? 'Patient' : 'Doctor'}: {
                    userRole === 'doctor' 
                      ? appointmentData.patients?.users?.name 
                      : appointmentData.doctors?.users?.name
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Service: {appointmentData.service_type}
                </p>
                <p className="text-sm text-gray-600">
                  Date: {new Date(appointmentData.appointment_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Time: {appointmentData.appointment_time}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Ready to start your video consultation?
            </p>
            <Button 
              onClick={join}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Join Call
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Video Area */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Appointment Info Header */}
          {appointmentData && (
            <Card className="mb-4 bg-white/10 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="font-semibold">
                      Video Consultation - {appointmentData.service_type}
                    </h2>
                    <p className="text-sm opacity-75">
                      {userRole === 'doctor' ? 'Patient' : 'Doctor'}: {
                        userRole === 'doctor' 
                          ? appointmentData.patients?.users?.name 
                          : appointmentData.doctors?.users?.name
                      }
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active Call
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Remote Participant (Doctor/Patient) */}
            {remoteParticipantId && (
              <div className="lg:col-span-2">
                <ParticipantView participantId={remoteParticipantId} />
              </div>
            )}
            
            {/* Local Participant (You) */}
            {localParticipantId && (
              <div className="lg:col-span-2 lg:max-w-sm lg:mx-auto">
                <ParticipantView participantId={localParticipantId} isLocal />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <MeetingControls />
    </div>
  );
}

// Main Video Consultation Component
export default function VideoConsultation({ 
  meetingId, 
  appointmentId, 
  userRole, 
  userId, 
  userName 
}: VideoConsultationProps) {
  return (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: userName,
        mode: 'SEND_AND_RECV',
        debugMode: false
      }}
      token={VIDEOSDK_CONFIG.TOKEN}
      children={
        <MeetingContainer 
          appointmentId={appointmentId}
          userRole={userRole}
          userId={userId}
          userName={userName}
        />
      }
    />
  );
}