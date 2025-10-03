/**
 * Complete Doctor Flow Dashboard
 * Implements the full doctor workflow from authentication to consultation management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

import { 
  Calendar,
  Clock,
  User,
  FileText,
  Bell,
  Settings,
  Heart,
  Activity,
  TestTube,
  Plus,
  Eye,
  Video,
  Phone,
  MessageSquare,
  DollarSign,
  Users,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Edit,
  Save
} from "lucide-react";

// Interfaces for doctor data
interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  video_consultation_fee?: number;
  license_number: string;
  rating: number;
  years_of_experience?: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start?: string;
  break_end?: string;
  max_patients_per_day: number;
}

interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  consultation_type: 'in-person' | 'video' | 'phone';
  notes?: string;
  meeting_link?: string;
  meeting_code?: string;
  fee: number;
  patients?: {
    id: string;
    date_of_birth: string;
    gender: string;
    address: string;
    users: {
      name: string;
      email: string;
      phone: string;
    };
  };
  payments?: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    amount: number;
    payment_date?: string;
  }[];
}

interface PatientRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  visit_date: string;
  created_at: string;
}

interface ConsultationData {
  appointment: AppointmentRequest;
  patientHistory: PatientRecord[];
  labTests: any[];
  healthMetrics: any[];
  prescriptions: any[];
}

const DoctorFlowDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [schedule, setSchedule] = useState<DoctorSchedule[]>([]);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentRequest[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationData | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      navigate('/login');
      return;
    }

    loadDoctorData();
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions
    };
  }, [user, navigate]);

  const loadDoctorData = async () => {
    try {
      setIsLoading(true);

      // Load doctor profile
      const { data: profile, error: profileError } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id (
            name,
            email,
            phone
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading doctor profile:', profileError);
        toast({
          title: "Profile Error",
          description: "Failed to load doctor profile. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      setDoctorProfile(profile);

      // Load doctor schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', profile.id)
        .order('day_of_week');

      if (scheduleError) {
        console.error('Error loading schedule:', scheduleError);
      } else {
        setSchedule(scheduleData || []);
      }

      // Load appointment requests (pending and today's appointments)
      const today = new Date().toISOString().split('T')[0];
      
      const { data: requests, error: requestsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            *,
            users:user_id (
              name,
              email,
              phone
            )
          ),
          payments (
            status,
            amount,
            payment_date
          )
        `)
        .eq('doctor_id', profile.id)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true });

      if (requestsError) {
        console.error('Error loading appointments:', requestsError);
      } else {
        setAppointmentRequests(requests || []);
        
        // Filter today's appointments
        const todayAppts = (requests || []).filter(apt => 
          apt.appointment_date === today && apt.status === 'confirmed'
        );
        setTodayAppointments(todayAppts);
      }

    } catch (error) {
      console.error('Error loading doctor data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!doctorProfile) return;

    // Subscribe to new appointment requests
    const appointmentsChannel = supabase
      .channel('doctor_appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorProfile.id}`,
        },
        (payload) => {
          console.log('New appointment request:', payload);
          toast({
            title: "New Appointment Request",
            description: "You have a new appointment request!",
          });
          loadDoctorData(); // Reload data to get the new appointment
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          console.log('Payment updated:', payload);
          if (payload.new.status === 'paid') {
            toast({
              title: "Payment Confirmed",
              description: "A patient has completed their payment!",
            });
            loadDoctorData();
          }
        }
      )
      .subscribe();

    return () => {
      appointmentsChannel.unsubscribe();
    };
  };

  const updateAvailabilityStatus = async (isAvailable: boolean) => {
    if (!doctorProfile) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_available: isAvailable })
        .eq('id', doctorProfile.id);

      if (error) throw error;

      setDoctorProfile(prev => prev ? { ...prev, is_available: isAvailable } : null);
      
      toast({
        title: "Status Updated",
        description: `You are now ${isAvailable ? 'available' : 'unavailable'} for appointments.`,
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Update Error",
        description: "Failed to update availability status.",
        variant: "destructive",
      });
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'accept' | 'reject', notes?: string) => {
    try {
      const status = action === 'accept' ? 'confirmed' : 'cancelled';
      
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      
      // Generate meeting link for video consultations if accepting
      if (action === 'accept') {
        const appointment = appointmentRequests.find(a => a.id === appointmentId);
        if (appointment?.consultation_type === 'video') {
          const meetingCode = `MDC-${Date.now()}`;
          const meetingLink = `${window.location.origin}/video-call?appointmentId=${appointmentId}&code=${meetingCode}`;
          
          updateData.meeting_code = meetingCode;
          updateData.meeting_link = meetingLink;
        }
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: `Appointment ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        description: `The appointment has been ${status}.`,
      });

      loadDoctorData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Action Error",
        description: `Failed to ${action} appointment.`,
        variant: "destructive",
      });
    }
  };

  const startConsultation = async (appointmentId: string) => {
    try {
      const appointment = todayAppointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      // Load patient history and data
      const { data: history, error: historyError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', appointment.patient_id)
        .order('visit_date', { ascending: false });

      const { data: labTests, error: labError } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('patient_id', appointment.patient_id)
        .order('test_date', { ascending: false });

      const { data: metrics, error: metricsError } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', appointment.patient_id)
        .order('recorded_at', { ascending: false });

      const { data: prescriptions, error: prescError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', appointment.patient_id)
        .order('prescribed_date', { ascending: false });

      setActiveConsultation({
        appointment,
        patientHistory: history || [],
        labTests: labTests || [],
        healthMetrics: metrics || [],
        prescriptions: prescriptions || []
      });

      setActiveTab("consultation");
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Consultation Error",
        description: "Failed to load patient data for consultation.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Doctor profile not found. Please contact support to set up your profile.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Doctor Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Dr. {doctorProfile.users?.name}
              </h1>
              <p className="text-muted-foreground">{doctorProfile.specialty}</p>
              <div className="mt-2 flex items-center gap-4">
                <Badge variant={doctorProfile.is_available ? "default" : "secondary"}>
                  {doctorProfile.is_available ? "Available" : "Unavailable"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  License: {doctorProfile.license_number}
                </span>
                <span className="text-sm text-muted-foreground">
                  Rating: {doctorProfile.rating}/5.0 ⭐
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={doctorProfile.is_available}
                  onCheckedChange={updateAvailabilityStatus}
                />
                <Label>Available for Appointments</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{appointmentRequests.filter(a => a.status === 'pending').length}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
                <Bell className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{todayAppointments.length}</p>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{appointmentRequests.filter(a => a.status === 'confirmed').length}</p>
                  <p className="text-sm text-muted-foreground">Confirmed Appointments</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">₱{doctorProfile.consultation_fee}</p>
                  <p className="text-sm text-muted-foreground">Consultation Fee</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="requests">Requests ({appointmentRequests.filter(a => a.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="appointments">Today's Appointments</TabsTrigger>
            <TabsTrigger value="consultation">Consultation</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointmentRequests.filter(a => a.status === 'pending').slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{request.patients?.users.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.appointment_date).toLocaleDateString()} at {request.appointment_time}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {request.consultation_type}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAppointmentAction(request.id, 'accept')}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAppointmentAction(request.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    {appointmentRequests.filter(a => a.status === 'pending').length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No pending requests</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{appointment.patients?.users.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.appointment_time}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {appointment.consultation_type}
                            </Badge>
                            {appointment.payments?.some(p => p.status === 'paid') && (
                              <Badge variant="default">Paid</Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => startConsultation(appointment.id)}
                        >
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </div>
                    ))}
                    {todayAppointments.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No appointments today</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Tab - Will be implemented in DoctorScheduleManager */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Manage Your Schedule</CardTitle>
                <CardDescription>Set your availability and working hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Schedule management component will be implemented next.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Requests</CardTitle>
                <CardDescription>Review and manage incoming appointment requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointmentRequests.filter(a => a.status === 'pending').map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{request.patients?.users.name}</h4>
                          <p className="text-sm text-muted-foreground">{request.patients?.users.email}</p>
                          <p className="text-sm text-muted-foreground">{request.patients?.users.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₱{request.fee}</p>
                          <Badge variant={request.payments?.some(p => p.status === 'paid') ? "default" : "secondary"}>
                            {request.payments?.some(p => p.status === 'paid') ? "Paid" : "Unpaid"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Date:</strong> {new Date(request.appointment_date).toLocaleDateString()}</p>
                          <p><strong>Time:</strong> {request.appointment_time}</p>
                        </div>
                        <div>
                          <p><strong>Type:</strong> {request.consultation_type}</p>
                          <p><strong>Patient Age:</strong> {request.patients?.date_of_birth ? 
                            new Date().getFullYear() - new Date(request.patients.date_of_birth).getFullYear() : 'N/A'} years
                          </p>
                        </div>
                      </div>

                      {request.notes && (
                        <div>
                          <p className="text-sm"><strong>Notes:</strong> {request.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleAppointmentAction(request.id, 'accept')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Appointment
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleAppointmentAction(request.id, 'reject')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {appointmentRequests.filter(a => a.status === 'pending').length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Pending Requests</h3>
                      <p className="text-muted-foreground">New appointment requests will appear here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>Manage your appointments for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{appointment.patients?.users.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.appointment_time} • {appointment.consultation_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.consultation_type === 'video' && appointment.meeting_link && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(appointment.meeting_link, '_blank')}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Video Call
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => startConsultation(appointment.id)}
                          >
                            <Stethoscope className="h-4 w-4 mr-2" />
                            Start Consultation
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {todayAppointments.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Appointments Today</h3>
                      <p className="text-muted-foreground">Enjoy your day off!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultation Tab */}
          <TabsContent value="consultation">
            {activeConsultation ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Active Consultation - {activeConsultation.appointment.patients?.users.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Consultation interface will be implemented in the ConsultationInterface component.
                      This will include patient history, examination notes, prescriptions, and lab test orders.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Consultation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Start a consultation from today's appointments to access patient records and examination tools.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Doctor Profile
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                  >
                    {isEditingProfile ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    {isEditingProfile ? 'Save' : 'Edit'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={doctorProfile.users?.name} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={doctorProfile.users?.email} disabled />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={doctorProfile.users?.phone} disabled />
                  </div>
                  <div>
                    <Label>Specialty</Label>
                    <Input 
                      value={doctorProfile.specialty} 
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div>
                    <Label>License Number</Label>
                    <Input 
                      value={doctorProfile.license_number} 
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div>
                    <Label>Consultation Fee (₱)</Label>
                    <Input 
                      type="number"
                      value={doctorProfile.consultation_fee} 
                      disabled={!isEditingProfile}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorFlowDashboard;