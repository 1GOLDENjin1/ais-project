import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { VideoSDKService } from '@/services/videoSDKService';
import { useNavigate } from 'react-router-dom';

const DoctorStartCall: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user.role !== 'doctor') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-3xl mx-auto p-6">
          <Card>
            <CardHeader><CardTitle>Access denied</CardTitle></CardHeader>
            <CardContent>Only doctors can start a video consultation.</CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleStart = async () => {
    try {
      setIsLoading(true);
      const svc = VideoSDKService.getInstance();
      const session = await svc.startVideoCallSession({
        appointmentId: appointmentId || `${Date.now()}`,
        doctorId: user.id,
        patientId: patientId || 'unknown',
        enableRecording: false,
      });

      toast({ title: 'Video room created', description: `Meeting ID: ${session.meetingId}` });
      // Navigate to in-app call page that expects meetingId param and token via query
      navigate(`/video-call/${session.meetingId}?token=${encodeURIComponent(session.token)}`);
    } catch (e: any) {
      toast({ title: 'Failed to start call', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Start Video Consultation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Patient ID (optional)</label>
              <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="patient uuid" />
            </div>
            <div>
              <label className="text-sm block mb-1">Appointment ID (optional)</label>
              <Input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} placeholder="appointment uuid" />
            </div>
            <Button onClick={handleStart} disabled={isLoading}>{isLoading ? 'Creating…' : 'Create & Join'}</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorStartCall;
