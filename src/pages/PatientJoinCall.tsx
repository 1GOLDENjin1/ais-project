import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { VideoSDKService } from '@/services/videoSDKService';
import { useNavigate } from 'react-router-dom';

const PatientJoinCall: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!meetingId.trim()) {
      toast({ title: 'Meeting ID required', variant: 'destructive' });
      return;
    }
    try {
      setIsJoining(true);
      const svc = VideoSDKService.getInstance();
      const token = await svc.joinMeeting(meetingId.trim(), 'patient');
      navigate(`/video-call/${meetingId.trim()}?token=${encodeURIComponent(token)}`);
    } catch (e: any) {
      toast({ title: 'Join failed', description: e?.message || 'Please check the Meeting ID', variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>Join Video Consultation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Meeting ID</label>
              <Input value={meetingId} onChange={(e) => setMeetingId(e.target.value)} placeholder="Enter Meeting ID" />
            </div>
            <Button onClick={handleJoin} disabled={isJoining}>{isJoining ? 'Joining…' : 'Join Call'}</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PatientJoinCall;
