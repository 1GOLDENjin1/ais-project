import React, { useEffect, useMemo, useState } from 'react';
import DoctorManagementService, { DoctorAppointment, DoctorProfile, DoctorVideoCall } from '@/services/doctorDatabaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Users, Copy, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { VideoSDKService } from '@/services/videoSDKService';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DoctorVideoConsultationProps {
  doctorProfile: DoctorProfile;
}

const DoctorVideoConsultation: React.FC<DoctorVideoConsultationProps> = ({ doctorProfile }) => {
  const [calls, setCalls] = useState<DoctorVideoCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [myAppointments, setMyAppointments] = useState<DoctorAppointment[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await DoctorManagementService.getMyVideoCalls(doctorProfile.id);
      setCalls(data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load calls', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
    // load today's/upcoming appointments for quick start
    (async () => {
      try {
        const today = await DoctorManagementService.getTodaysAppointments(doctorProfile.id);
        setMyAppointments(today);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [doctorProfile.id]);

  const handleCopy = async (text: string, label = 'Meeting ID') => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied` });
    } catch (e) {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const handleJoinAsDoctor = async (call: any) => {
    try {
      setJoiningId(call.id);
      const meetingId = call.videosdk_meeting_id || call.room_id;
      if (!meetingId) {
        toast({ title: 'Missing meeting ID', variant: 'destructive' });
        return;
      }
      // Prefer stored doctor token if present, otherwise fetch a fresh one
      const token = call.videosdk_token || (await VideoSDKService.getInstance().getParticipantToken('doctor'));
      navigate(`/video-call/${meetingId}?token=${encodeURIComponent(token)}`);
    } catch (e: any) {
      toast({ title: 'Join failed', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setJoiningId(null);
    }
  };

  const handleEndCall = async (call: DoctorVideoCall) => {
    try {
      await DoctorManagementService.endVideoCall(call.id, 'Ended by doctor');
      toast({ title: 'Call ended' });
      loadCalls();
    } catch (e) {
      toast({ title: 'Failed to end call', variant: 'destructive' });
    }
  };

  const handleCreateCall = async () => {
    if (!selectedAppointmentId || !selectedPatientId) {
      toast({ title: 'Missing info', description: 'Pick an appointment/patient', variant: 'destructive' });
      return;
    }
    try {
      setCreating(true);
      const svc = VideoSDKService.getInstance();
      const session = await svc.startVideoCallSession({
        appointmentId: selectedAppointmentId,
        doctorId: doctorProfile.id,
        patientId: selectedPatientId,
        duration: 30,
        enableRecording: false,
      });
      toast({ title: 'Call ready', description: `Meeting: ${session.meetingId}` });
      // refresh list and auto-join as doctor
      await loadCalls();
      navigate(`/video-call/${session.meetingId}?token=${encodeURIComponent(session.token)}`);
    } catch (e: any) {
      console.error('Create call failed', e);
      toast({ title: 'Create failed', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const appointmentOptions = useMemo(() => {
    return myAppointments.map((a) => ({
      id: a.id,
      label: `${new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00')).toLocaleString()} — ${a.service_type}`,
      patientId: a.patient_id,
      patientName: a.patient?.users?.name,
    }));
  }, [myAppointments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-600" /> Video Consultations
        </h3>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div>
              <Label className="text-xs">Appointment</Label>
              <Select
                value={selectedAppointmentId}
                onValueChange={(val) => {
                  setSelectedAppointmentId(val);
                  const opt = appointmentOptions.find(o => o.id === val);
                  if (opt?.patientId) setSelectedPatientId(opt.patientId);
                }}
              >
                <SelectTrigger className="mt-1 w-64">
                  <SelectValue placeholder="Select appointment…" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label} {opt.patientName ? `• ${opt.patientName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Patient ID</Label>
              <Input
                className="mt-1"
                placeholder="Patient ID"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              />
            </div>
            <div>
              <Button onClick={handleCreateCall} disabled={creating || !selectedAppointmentId || !selectedPatientId}>
                {creating ? 'Creating…' : 'Start New Call'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading…</div>
          ) : calls.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No video calls yet.</div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <div key={call.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={call.status === 'ongoing' ? 'default' : call.status === 'scheduled' ? 'secondary' : 'outline'}>
                        {call.status}
                      </Badge>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(call.appointment?.appointment_date || call.started_at || call.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      Patient: {call.patient?.users?.name || 'Unknown'} • {call.appointment?.service_type || 'Consultation'}
                    </div>
                    <div className="text-xs text-gray-500">Meeting ID: {call.videosdk_meeting_id || call.room_id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(call.videosdk_meeting_id || call.room_id) && (
                      <Button variant="outline" size="sm" onClick={() => handleCopy(call.videosdk_meeting_id || call.room_id, 'Meeting ID')}>
                        <Copy className="h-4 w-4 mr-2" /> Copy Code
                      </Button>
                    )}
                    {(call.videosdk_meeting_id || call.room_id) && call.status !== 'completed' && call.status !== 'cancelled' && !call.ended_at && (
                      <Button size="sm" onClick={() => handleJoinAsDoctor(call)} disabled={joiningId === call.id}>
                        <ExternalLink className="h-4 w-4 mr-2" /> {joiningId === call.id ? 'Joining…' : 'Join'}
                      </Button>
                    )}
                    {call.status !== 'completed' && (
                      <Button size="sm" variant="destructive" onClick={() => handleEndCall(call)}>
                        End
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorVideoConsultation;