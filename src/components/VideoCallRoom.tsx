/**
 * Video Call Room Component
 * Provides video calling interface using VideoSDK.live for patient-doctor consultations
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  useMeeting, 
  useParticipant, 
  MeetingProvider,
  Constants
} from '@videosdk.live/react-sdk';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone,
  PhoneOff,
  MessageCircle,
  Settings,
  Monitor,
  Camera,
  Users,
  Clock,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { videoSDK, type VideoMeeting } from '@/services/videoSDK';
import { useToast } from "@/hooks/use-toast";

interface VideoCallRoomProps {
  appointmentId: string;
  participantName: string;
  participantRole: 'doctor' | 'patient';
  onLeave?: () => void;
}

interface MeetingViewProps {
  meetingId: string;
  token: string;
  participantName: string;
  participantRole: 'doctor' | 'patient';
  onLeave?: () => void;
}

// Individual participant video component
const ParticipantView: React.FC<{ participantId: string }> = ({ participantId }) => {
  const { webcamStream, micOn, webcamOn, displayName, isLocal } = useParticipant(participantId);
  const micRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (micRef.current && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      micRef.current.srcObject = mediaStream;
      micRef.current.play().catch(err => console.error('Error playing audio:', err));
    }
  }, [webcamStream]);

  useEffect(() => {
    if (videoRef.current && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(err => console.error('Error playing video:', err));
    }
  }, [webcamStream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      {webcamOn && webcamStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="h-8 w-8" />
            </div>
            <p className="text-sm">{displayName}</p>
          </div>
        </div>
      )}

      <audio ref={micRef} autoPlay playsInline />

      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
        <Badge variant={isLocal ? "default" : "secondary"} className="text-xs">
          {isLocal ? "You" : displayName}
        </Badge>
        <div className="flex gap-1">
          {!micOn && (
            <div className="bg-red-500 rounded-full p-1">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main meeting view component
const MeetingView: React.FC<MeetingViewProps> = ({ 
  meetingId, 
  token, 
  participantName, 
  participantRole,
  onLeave 
}) => {
  const { toast } = useToast();
  const [isJoined, setIsJoined] = useState(false);

  const {
    join,
    leave,
    participants,
    localMicOn,
    localWebcamOn,
    toggleMic,
    toggleWebcam
  } = useMeeting({
    onMeetingJoined: () => {
      setIsJoined(true);
      toast({
        title: "Joined Video Call",
        description: "You've successfully joined the consultation.",
      });
    },
    onMeetingLeft: () => {
      setIsJoined(false);
      onLeave?.();
    },
    onParticipantJoined: (participant) => {
      toast({
        title: "Participant Joined", 
        description: `${participant.displayName} has joined the call.`,
      });
    },
    onParticipantLeft: (participant) => {
      toast({
        title: "Participant Left",
        description: `${participant.displayName} has left the call.`,
        variant: "destructive"
      });
    }
  });

  const participantsList = [...participants.keys()];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Medical Consultation - {participantRole === 'doctor' ? 'Doctor' : 'Patient'}
                </CardTitle>
                <Badge variant={isJoined ? "default" : "secondary"}>
                  {isJoined ? "Connected" : "Connecting"}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </div>

        {!isJoined ? (
          <div className="text-center">
            <Card className="bg-gray-800 border-gray-700 max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <Video className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Ready to join?</h2>
                  <p className="text-gray-400">{participantName} ({participantRole})</p>
                </div>
                <Button onClick={join} className="w-full" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Join Consultation
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {participantsList.map((participantId) => (
                <ParticipantView key={participantId} participantId={participantId} />
              ))}
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-4">
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant={localMicOn ? "default" : "destructive"}
                    size="lg"
                    onClick={() => toggleMic()}
                    className="rounded-full w-12 h-12"
                  >
                    {localMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant={localWebcamOn ? "default" : "destructive"}
                    size="lg"
                    onClick={() => toggleWebcam()}
                    className="rounded-full w-12 h-12"
                  >
                    {localWebcamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={leave}
                    className="rounded-full w-12 h-12"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-2 ml-4">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {participantsList.length} participant{participantsList.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  appointmentId,
  participantName,
  participantRole,
  onLeave
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<VideoMeeting | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        let existingMeeting = videoSDK.getMeetingByAppointment(appointmentId);
        
        if (!existingMeeting) {
          existingMeeting = await videoSDK.createMeeting({
            appointmentId,
            doctorName: participantRole === 'doctor' ? participantName : 'Doctor',
            patientName: participantRole === 'patient' ? participantName : 'Patient'
          });
        }

        const joinData = await videoSDK.joinMeeting({
          meetingId: existingMeeting.meetingId,
          participantName,
          role: participantRole
        });

        setMeeting(existingMeeting);
        setToken(joinData.token);
      } catch (err) {
        console.error('Error initializing video meeting:', err);
        toast({
          title: "Video Call Error",
          description: "Could not initialize the video call.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && participantName) {
      initializeMeeting();
    }
  }, [appointmentId, participantName, participantRole, toast]);

  if (loading || !meeting || !token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Initializing video call...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: meeting.meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: participantName,
        mode: "SEND_AND_RECV" as const,
        debugMode: false
      }}
      token={token}
    >
      <MeetingView
        meetingId={meeting.meetingId}
        token={token}
        participantName={participantName}
        participantRole={participantRole}
        onLeave={onLeave}
      />
    </MeetingProvider>
  );
};