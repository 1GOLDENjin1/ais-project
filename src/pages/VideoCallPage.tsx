import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { MeetingProvider, MeetingConsumer, useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Users,
  Settings,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const VideoCallPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  if (!meetingId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Invalid Video Call</h2>
            <p className="text-gray-600 mb-4">Meeting ID or token is missing.</p>
            <Button onClick={() => window.close()}>Close Window</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user } = useAuth();
  const localDisplayName = user
    ? `${user.name || 'User'} - ${user.role === 'doctor' ? 'Doctor' : user.role === 'patient' ? 'Patient' : (user.role || 'User')}`
    : 'Guest - Viewer';

  // Narrow types after early return
  const safeToken = token as string;
  const safeMeetingId = meetingId as string;

  // Work around library typing that requires explicit children by casting provider to any
  const AnyMeetingProvider = MeetingProvider as any;

  return (
    <AnyMeetingProvider
      config={{
        meetingId: safeMeetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: localDisplayName,
        debugMode: false,
      }}
      token={safeToken}
    >
      <div>
        <VideoCallInterface />
      </div>
    </AnyMeetingProvider>
  );
};

const VideoCallInterface: React.FC = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPermissionGranted, setMediaPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    startRecording,
    stopRecording,
    participants,
    localMicOn,
    localWebcamOn,
    meetingId,
  } = useMeeting({
    onMeetingJoined: () => {
      toast({
        title: "Joined Meeting",
        description: "You have successfully joined the video call.",
      });
    },
    onMeetingLeft: () => {
      toast({
        title: "Left Meeting",
        description: "You have left the video call.",
      });
      // Redirect based on user role
      const role = user?.role;
      if (role === 'doctor') {
        navigate('/doctor-portal', { replace: true });
      } else if (role === 'patient') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    },
    onParticipantJoined: (participant) => {
      toast({
        title: "Participant Joined",
        description: `${participant.displayName} joined the call.`,
      });
    },
    onParticipantLeft: (participant) => {
      toast({
        title: "Participant Left",
        description: `${participant.displayName} left the call.`,
      });
    },
    onRecordingStarted: () => {
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "This call is now being recorded.",
      });
    },
    onRecordingStopped: () => {
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Call recording has been stopped.",
      });
    },
  });

  // Request media permissions before joining
  useEffect(() => {
    const requestMediaPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        setMediaPermissionGranted(true);
        toast({
          title: "Media Access Granted",
          description: "Camera and microphone are ready.",
        });
      } catch (error: any) {
        console.error('Media permission error:', error);
        setPermissionError(error.message || 'Failed to access camera/microphone');
        toast({
          title: "Media Access Denied",
          description: "Please allow camera and microphone access to join the call.",
          variant: "destructive",
        });
      }
    };

    requestMediaPermissions();
  }, [toast]);

  const hasJoinedRef = useRef(false);
  useEffect(() => {
    if (!hasJoinedRef.current && mediaPermissionGranted) {
      hasJoinedRef.current = true;
      join();
    }
  }, [mediaPermissionGranted, join]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Show permission error if media access denied
  if (permissionError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <CameraOff className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Camera/Microphone Access Required</h2>
            <p className="text-gray-600 mb-4">{permissionError}</p>
            <p className="text-sm text-gray-500 mb-4">
              Please enable camera and microphone permissions in your browser settings and reload the page.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Reload Page
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while requesting permissions
  if (!mediaPermissionGranted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Camera className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Requesting Media Access...</h2>
            <p className="text-gray-600">
              Please allow access to your camera and microphone when prompted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Video Call</h1>
          <span className="text-sm text-gray-300">Meeting ID: {meetingId}</span>
          {isRecording && (
            <span className="flex items-center text-red-400 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              Recording
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {participants.size}
          </span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {Array.from(participants.keys()).map((participantId) => (
            <ParticipantView key={participantId} participantId={participantId} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Microphone */}
          <Button
            variant={localMicOn ? "secondary" : "destructive"}
            size="lg"
            onClick={() => toggleMic()}
            className="rounded-full h-12 w-12"
          >
            {localMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Camera */}
          <Button
            variant={localWebcamOn ? "secondary" : "destructive"}
            size="lg"
            onClick={() => toggleWebcam()}
            className="rounded-full h-12 w-12"
          >
            {localWebcamOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </Button>

          {/* Recording */}
          <Button
            variant={isRecording ? "destructive" : "secondary"}
            size="lg"
            onClick={handleToggleRecording}
            className="rounded-full h-12 w-12"
          >
            {isRecording ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={leave}
            className="rounded-full h-12 w-12"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full h-12 w-12"
            onClick={() => toast({
              title: "Settings",
              description: "Settings panel coming soon.",
            })}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Chat */}
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full h-12 w-12"
            onClick={() => toast({
              title: "Chat",
              description: "In-call chat coming soon.",
            })}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ParticipantViewProps {
  participantId: string;
}

const ParticipantView: React.FC<ParticipantViewProps> = ({ participantId }) => {
  const { webcamStream, micOn, webcamOn, displayName, isLocal } = useParticipant(participantId);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [namePart, rolePart] = (displayName || '').split(' - ');

  useEffect(() => {
    if (webcamStream && videoRef.current) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(console.error);
    }
  }, [webcamStream]);

  return (
    <Card className="relative overflow-hidden bg-gray-800 min-h-64">
      <CardContent className="p-0 h-full">
        {webcamOn && webcamStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-semibold">
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <p className="text-sm">{displayName || 'Unknown'}</p>
            </div>
          </div>
        )}

        {/* Participant Info */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-sm flex items-center space-x-2">
          <span>{namePart || displayName || 'Unknown'}</span>
          {rolePart && (
            <Badge variant="secondary" className="text-[10px] h-5 px-2 py-0 bg-white/20 text-white border-white/30">
              {rolePart}
            </Badge>
          )}
          {isLocal && <span className="text-xs">(You)</span>}
          {!micOn && <MicOff className="h-3 w-3" />}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCallPage;