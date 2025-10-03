import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { VideoSDKService, CreateMeetingRequest } from '@/services/videoSDKService';
import { Video, Phone, PhoneOff, Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [activeCall, setActiveCall] = useState<any>(null);
  
  const videoSDKService = VideoSDKService.getInstance();

  const handleStartVideoCall = async () => {
    if (!user || !doctorId || !appointmentId) {
      toast({
        title: "Missing Information",
        description: "Please provide doctor ID and appointment ID to start the call.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const request: CreateMeetingRequest = {
        appointmentId,
        doctorId,
        patientId: user.id,
        duration: 30,
        enableRecording: false
      };

      const session = await videoSDKService.startVideoCallSession(request);
      
      toast({
        title: "Video Call Started",
        description: `Meeting ID: ${session.meetingId}. You can share this with the doctor.`,
      });

      // Open video call in new tab/window
      window.open(
        `/video-call/${session.meetingId}?token=${session.token}`,
        '_blank',
        'width=1200,height=800'
      );

      setActiveCall(session);
      onClose();
    } catch (error) {
      console.error('Error starting video call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinVideoCall = async () => {
    if (!meetingId.trim()) {
      toast({
        title: "Missing Meeting ID",
        description: "Please enter a meeting ID to join the call.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Open video call in new tab/window
      window.open(
        `/video-call/${meetingId}?token=${videoSDKService.generateParticipantToken(meetingId, user?.id || 'guest')}`,
        '_blank',
        'width=1200,height=800'
      );

      toast({
        title: "Joining Video Call",
        description: "Opening video call in new window...",
      });

      onClose();
    } catch (error) {
      console.error('Error joining video call:', error);
      toast({
        title: "Error",
        description: "Failed to join video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Call
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Start New Call */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Start New Video Call</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="appointmentId">Appointment ID</Label>
                <Input
                  id="appointmentId"
                  placeholder="Enter appointment ID"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="doctorId">Doctor ID</Label>
                <Input
                  id="doctorId"
                  placeholder="Enter doctor ID"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleStartVideoCall} 
                disabled={isLoading || !appointmentId || !doctorId}
                className="w-full"
              >
                <Video className="h-4 w-4 mr-2" />
                {isLoading ? 'Starting Call...' : 'Start Video Call'}
              </Button>
            </div>
          </div>

          {/* Join Existing Call */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm">Join Existing Call</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="meetingId">Meeting ID</Label>
                <Input
                  id="meetingId"
                  placeholder="Enter meeting ID to join"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleJoinVideoCall} 
                disabled={isLoading || !meetingId.trim()}
                variant="outline"
                className="w-full"
              >
                <Phone className="h-4 w-4 mr-2" />
                {isLoading ? 'Joining Call...' : 'Join Video Call'}
              </Button>
            </div>
          </div>

          {/* Quick Actions for Patients */}
          {user?.role === 'patient' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast({
                    title: "Feature Coming Soon",
                    description: "Schedule video call feature will be available soon.",
                  })}
                >
                  Schedule Call
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast({
                    title: "Feature Coming Soon",
                    description: "Call history feature will be available soon.",
                  })}
                >
                  Call History
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">How to use:</p>
            <ul className="space-y-1 text-xs">
              <li>• To start a new call, enter your appointment ID and doctor ID</li>
              <li>• To join an existing call, enter the meeting ID shared by your doctor</li>
              <li>• The video call will open in a new window</li>
              <li>• Make sure your camera and microphone are enabled</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};