// ===================================================
// VIDEO CALL MANAGEMENT DASHBOARD
// Admin/Staff interface to monitor and manage video consultations
// ===================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoSDKService } from '@/services/videoSDKService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Users, 
  Clock, 
  Calendar, 
  Search, 
  RefreshCw,
  PhoneOff,
  Play,
  Pause,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Activity,
  Filter
} from 'lucide-react';

interface VideoCallStats {
  total: number;
  ongoing: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

interface VideoCallRecord {
  id: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  appointmentId: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  meetingId: string;
  isRecording: boolean;
  participantCount?: number;
}

export default function VideoCallManagementDashboard() {
  const [videoCalls, setVideoCalls] = useState<VideoCallRecord[]>([]);
  const [stats, setStats] = useState<VideoCallStats>({
    total: 0,
    ongoing: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ongoing' | 'scheduled' | 'completed'>('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadVideoCallData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadVideoCallData();
    }, 30000);
    
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const loadVideoCallData = async () => {
    try {
      setIsLoading(true);
      
      // Load video calls with related appointment and user data
      const { data: videoCallsData, error } = await supabase
        .from('video_calls')
        .select(`
          id,
          status,
          started_at,
          ended_at,
          duration_minutes,
          videosdk_meeting_id,
          is_recording,
          appointments!inner(
            id,
            appointment_date,
            appointment_time,
            patients!inner(
              users!inner(name)
            ),
            doctors!inner(
              users!inner(name)
            )
          ),
          video_call_participants(
            user_id,
            joined_at,
            left_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Process the data
      const processedCalls: VideoCallRecord[] = videoCallsData?.map(call => {
        const appointment = Array.isArray(call.appointments) ? call.appointments[0] : call.appointments;
        const doctor = Array.isArray(appointment.doctors) ? appointment.doctors[0] : appointment.doctors;
        const patient = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients;
        const doctorUser = Array.isArray(doctor?.users) ? doctor.users[0] : doctor?.users;
        const patientUser = Array.isArray(patient?.users) ? patient.users[0] : patient?.users;
        
        const activeParticipants = call.video_call_participants?.filter(p => 
          p.joined_at && !p.left_at
        ).length || 0;

        return {
          id: call.id,
          status: call.status,
          appointmentId: appointment.id,
          doctorName: doctorUser?.name || 'Unknown Doctor',
          patientName: patientUser?.name || 'Unknown Patient',
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          startedAt: call.started_at,
          endedAt: call.ended_at,
          durationMinutes: call.duration_minutes,
          meetingId: call.videosdk_meeting_id,
          isRecording: call.is_recording,
          participantCount: activeParticipants
        };
      }) || [];

      setVideoCalls(processedCalls);

      // Calculate stats
      const newStats = processedCalls.reduce((acc, call) => {
        acc.total++;
        acc[call.status]++;
        return acc;
      }, {
        total: 0,
        ongoing: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0
      });

      setStats(newStats);

    } catch (error) {
      console.error('Error loading video call data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndVideoCall = async (videoCallId: string) => {
    try {
      const videoSDKService = VideoSDKService.getInstance();
      await videoSDKService.endVideoCall(videoCallId);
      
      // Refresh data
      loadVideoCallData();
    } catch (error) {
      console.error('Error ending video call:', error);
    }
  };

  const handleToggleRecording = async (videoCallId: string, currentStatus: boolean) => {
    try {
      const videoSDKService = VideoSDKService.getInstance();
      await videoSDKService.updateRecordingStatus(videoCallId, !currentStatus);
      
      // Refresh data
      loadVideoCallData();
    } catch (error) {
      console.error('Error toggling recording:', error);
    }
  };

  const filteredCalls = videoCalls.filter(call => {
    const matchesFilter = selectedFilter === 'all' || call.status === selectedFilter;
    const matchesSearch = searchTerm === '' || 
      call.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.appointmentId.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing': return <Activity className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Video Call Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage ongoing video consultations
              </p>
            </div>
            <Button 
              onClick={loadVideoCallData}
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Video className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Ongoing</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ongoing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by doctor, patient, or appointment ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === 'ongoing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('ongoing')}
                >
                  Ongoing
                </Button>
                <Button
                  variant={selectedFilter === 'scheduled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('scheduled')}
                >
                  Scheduled
                </Button>
                <Button
                  variant={selectedFilter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Calls List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Video Calls ({filteredCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading video calls...</p>
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No video calls found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCalls.map((call) => (
                  <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getStatusColor(call.status)}>
                            {getStatusIcon(call.status)}
                            <span className="ml-1 capitalize">{call.status}</span>
                          </Badge>
                          {call.isRecording && (
                            <Badge variant="destructive" className="text-xs">
                              <Monitor className="h-3 w-3 mr-1" />
                              Recording
                            </Badge>
                          )}
                          {call.participantCount && call.participantCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {call.participantCount} participants
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Doctor:</span>
                            <p className="text-gray-600">Dr. {call.doctorName}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Patient:</span>
                            <p className="text-gray-600">{call.patientName}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Scheduled:</span>
                            <p className="text-gray-600">
                              {new Date(call.appointmentDate).toLocaleDateString()} at {call.appointmentTime}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Duration:</span>
                            <p className="text-gray-600">
                              {call.status === 'ongoing' && call.startedAt 
                                ? `${Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 60000)}m (ongoing)`
                                : formatDuration(call.durationMinutes)
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Meeting ID: {call.meetingId} • Appointment: {call.appointmentId}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {call.status === 'ongoing' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleRecording(call.id, call.isRecording)}
                            >
                              {call.isRecording ? (
                                <>
                                  <Pause className="h-4 w-4 mr-1" />
                                  Stop Recording
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  Start Recording
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleEndVideoCall(call.id)}
                            >
                              <PhoneOff className="h-4 w-4 mr-1" />
                              End Call
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}