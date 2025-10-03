/**
 * Doctor Dashboard
 * Comprehensive dashboard for doctor users using new healthcare service
 */

import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth-service';
import { healthcareService, type AccessContext } from '@/services/healthcare-service';
import { DoctorRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import { 
  Calendar, 
  Clock, 
  FileText, 
  TestTube, 
  Heart, 
  Bell, 
  User, 
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Users,
  Stethoscope,
  Pill,
  Edit,
  Save,
  X,
  Video,
  Monitor,
  PhoneCall
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rlsDataService } from "@/lib/rls-data-service";
import { useAppointmentRealtime, useDoctorScheduleRealtime, useTaskRealtime } from "@/hooks/useRealtimeData";
import type { DoctorAppointmentView, DoctorDashboardSummary, CreateMedicalRecordInput, CreateLabTestInput, CreatePrescriptionInput } from "@/types/rls-types";
import { VideoCallRoom } from '@/components/VideoCallRoom';
import { videoSDK } from '@/services/videoSDK';
import { useNavigate } from 'react-router-dom';

interface VideoCall {
  id: string;
  appointment_id: string;
  meeting_id: string;
  token: string;
  status: 'pending' | 'active' | 'ended';
  created_at: string;
}

const DoctorDashboardWithPrescriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<DoctorAppointmentView[]>([]);
  const [weeklyAppointments, setWeeklyAppointments] = useState<number>(0);
  const [pendingTasks, setPendingTasks] = useState<number>(0);
  const [recentLabTests, setRecentLabTests] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<{[key: string]: string}>({});
  
  // Video call state
  const [activeVideoCall, setActiveVideoCall] = useState<VideoCall | null>(null);
  const [doctorVideoCalls, setDoctorVideoCalls] = useState<VideoCall[]>([]);
  
  // Medical Record form state
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [newRecord, setNewRecord] = useState({
    patient_id: '',
    record_type: 'consultation',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    follow_up_instructions: '',
    record_date: new Date().toISOString().split('T')[0],
    is_confidential: false
  });

  // Prescription form state
  const [isCreatingPrescription, setIsCreatingPrescription] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    quantity: '',
    refills_allowed: '0',
    prescribed_date: new Date().toISOString().split('T')[0],
    expiry_date: ''
  });

  useEffect(() => {
    if (user && user.role === 'doctor') {
      loadDoctorData();
      loadPatients();
      loadDoctorVideoCalls();
    }
  }, [user]);

  // Real-time subscriptions for doctor dashboard
  useAppointmentRealtime(
    (payload) => {
      console.log('Doctor appointments realtime update:', payload);
      loadDoctorData(); // Reload appointments when there's a change
    },
    !!user && user.role === 'doctor' // only enable for doctors
  );

  useDoctorScheduleRealtime(
    (payload) => {
      console.log('Doctor schedule realtime update:', payload);
      loadDoctorData(); // Reload data when schedule changes
    },
    !!user && user.role === 'doctor'
  );

  useTaskRealtime(
    (payload) => {
      console.log('Tasks realtime update:', payload);
      loadDoctorData(); // Reload tasks count
    },
    !!user && user.role === 'doctor'
  );

  const loadDoctorData = async () => {
    try {
      // Load appointments using RLS service (automatically filtered for this doctor)
      const appointments = await rlsDataService.getDoctorAppointments();
      
      // Filter for today's appointments
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayAppointments = appointments.filter(app => 
        app.appointment_date === todayStr
      );
      setTodayAppointments(todayAppointments);

      // Patient names are already included in DoctorAppointmentView
      const patientNamesMap: {[key: string]: string} = {};
      todayAppointments.forEach(app => {
        patientNamesMap[app.patient_id] = app.patient_name;
      });
      setPatientNames(patientNamesMap);

      // Calculate weekly appointments
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyCount = appointments.filter(app => 
        new Date(app.appointment_date) >= oneWeekAgo
      ).length;
      setWeeklyAppointments(weeklyCount);

      // Load recent lab tests using RLS service
      try {
        const labTests = await rlsDataService.getDoctorLabTests();
        setRecentLabTests(labTests.slice(0, 5)); // Take only recent 5
      } catch (error) {
        console.error('Lab tests not fully implemented yet:', error);
        setRecentLabTests([]);
      }

      // Mock pending tasks count
      setPendingTasks(6);
    } catch (error) {
      console.error('Error loading doctor data:', error);
    }
  };

  const loadPatients = async () => {
    try {
      // Load patients using RLS service (automatically filtered for this doctor's patients)
      const doctorPatients = await rlsDataService.getDoctorPatients();
      setPatients(doctorPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
    }
  };

  const loadDoctorVideoCalls = async () => {
    try {
      const context = authService.getCurrentContext();
      if (!context) return;
      
      const calls = await healthcareService.getDoctorVideoCalls(context);
      setDoctorVideoCalls(calls);
    } catch (error) {
      console.error('Error loading doctor video calls:', error);
      setDoctorVideoCalls([]);
    }
  };

  const handleJoinVideoCall = async (appointmentId: string) => {
    try {
      // Navigate to video call page with appointment ID
      navigate(`/video-call?appointmentId=${appointmentId}`);
    } catch (error) {
      console.error('Error joining video call:', error);
      toast({
        title: "Video Call Error", 
        description: "Unable to join video call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndVideoCall = async () => {
    try {
      const context = authService.getCurrentContext();
      if (!context || !activeVideoCall) return;

      await healthcareService.endVideoCall(context, activeVideoCall.id);
      setActiveVideoCall(null);
      loadDoctorVideoCalls();
      toast({
        title: "Success",
        description: "Video consultation ended",
      });
    } catch (error) {
      console.error('Error ending video call:', error);
      toast({
        title: "Error",
        description: "Failed to end video consultation", 
        variant: "destructive",
      });
    }
  };

  const loadPatientNames = async (appointments: DoctorAppointmentView[]) => {
    // Patient names are already included in DoctorAppointmentView
    const names: {[key: string]: string} = {};
    appointments.forEach(appointment => {
      names[appointment.patient_id] = appointment.patient_name;
    });
    setPatientNames(names);
  };

  const handleCreateMedicalRecord = async () => {
    try {
      if (!newRecord.patient_id || !newRecord.title) {
        toast({
          title: "Error",
          description: "Please select a patient and enter a title",
          variant: "destructive",
        });
        return;
      }

      // TODO: Implement with RLS service
      toast({
        title: "Feature Coming Soon",
        description: "Medical record creation will be available soon.",
        variant: "default",
      });
      return;

      // const doctor = await doctorService.getByUserId(user!.id);
      // if (!doctor) {
      //   toast({
      //     title: "Error",
      //     description: "Doctor record not found",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // const recordData = {
      //   ...newRecord,
      //   doctor_id: doctor.id,
      //   status: 'draft' as const
      // };

      // await medicalRecordService.create(recordData);

      toast({
        title: "Success",
        description: "Medical record created successfully",
      });

      // Reset form
      setNewRecord({
        patient_id: '',
        record_type: 'consultation',
        title: '',
        description: '',
        diagnosis: '',
        treatment: '',
        medications: '',
        follow_up_instructions: '',
        record_date: new Date().toISOString().split('T')[0],
        is_confidential: false
      });
      setIsCreatingRecord(false);
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast({
        title: "Error",
        description: "Failed to create medical record",
        variant: "destructive",
      });
    }
  };

  const handleCreatePrescription = async () => {
    try {
      if (!newPrescription.patient_id || !newPrescription.medication_name || !newPrescription.dosage || !newPrescription.frequency || !newPrescription.duration) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // TODO: Implement with RLS service
      toast({
        title: "Feature Coming Soon",
        description: "Prescription creation will be available soon.",
        variant: "default",
      });
      return;

      // const prescriptionData = {
      //   ...newPrescription,
      //   doctor_id: doctor.id,
      //   quantity: newPrescription.quantity ? parseInt(newPrescription.quantity) : null,
      //   refills_allowed: parseInt(newPrescription.refills_allowed),
      //   expiry_date: newPrescription.expiry_date || null
      // };

      // await prescriptionService.create(prescriptionData);

      toast({
        title: "Success",
        description: "Prescription created successfully",
      });

      // Reset form
      setNewPrescription({
        patient_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: '',
        refills_allowed: '0',
        prescribed_date: new Date().toISOString().split('T')[0],
        expiry_date: ''
      });
      setIsCreatingPrescription(false);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive",
      });
    }
  };

  const getPatientName = (patientId: string) => {
    return patientNames[patientId] || 'Loading...';
  };

  const getPatientInitials = (patientId: string) => {
    const name = getPatientName(patientId);
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'default';
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Normal': return 'default';
      case 'Reviewed': return 'default';
      case 'Pending': return 'secondary';
      case 'Abnormal': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchPatient.toLowerCase()) ||
    patient.id?.toLowerCase().includes(searchPatient.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. {user?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="medical-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <p className="text-3xl font-bold text-primary">{todayAppointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Appointments</p>
                  <p className="text-3xl font-bold text-primary">{weeklyAppointments}</p>
                </div>
                <Clock className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                  <p className="text-3xl font-bold text-primary">{pendingTasks}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lab Results</p>
                  <p className="text-3xl font-bold text-primary">{recentLabTests.length}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Today's Appointments</span>
              </CardTitle>
              <CardDescription>Your scheduled appointments for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {(appointment as any).consultation_type === 'video' ? (
                        <Video className="h-5 w-5 text-primary" />
                      ) : (
                        <span className="text-sm font-medium text-primary">
                          {getPatientInitials(appointment.patient_id)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">
                          {getPatientName(appointment.patient_id)}
                        </p>
                        <div className="flex items-center gap-2">
                          {(appointment as any).consultation_type === 'video' && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Video className="h-3 w-3" />
                              <span>Video</span>
                            </div>
                          )}
                          <Badge variant={getStatusColor(appointment.status) as any}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <span>{appointment.appointment_time}</span>
                        <span>{appointment.appointment_type}</span>
                      </div>
                      {appointment.reason && (
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      )}
                    </div>
                    
                    {/* Video Call Actions */}
                    {(appointment as any).consultation_type === 'video' && appointment.status === 'confirmed' && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleJoinVideoCall(appointment.id)}
                          className="flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Join Call
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Lab Test Results */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Recent Lab Results</span>
              </CardTitle>
              <CardDescription>Latest test results requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLabTests.length > 0 ? (
                recentLabTests.map((test, index) => (
                  <div key={`lab-test-${test.id || index}`} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Patient: {patientNames[test.patient_id] || 'Loading...'}</p>
                      <p className="text-sm text-muted-foreground">{test.test_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(test.test_date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={getResultColor(test.status) as any}>
                      {test.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent lab results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="medical-card mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and tools for medical professionals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Medical Record Dialog */}
              <Dialog open={isCreatingRecord} onOpenChange={setIsCreatingRecord}>
                <DialogTrigger asChild>
                  <Button variant="medical" className="h-16 flex-col space-y-2">
                    <Plus className="h-6 w-6" />
                    <span>New Record</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Medical Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="patient_search">Select Patient</Label>
                      <div className="space-y-2">
                        <Input
                          id="patient_search"
                          placeholder="Search patient by name..."
                          value={searchPatient}
                          onChange={(e) => setSearchPatient(e.target.value)}
                        />
                        <Select value={newRecord.patient_id} onValueChange={(value) => 
                          setNewRecord(prev => ({ ...prev, patient_id: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredPatients.slice(0, 10).map((patient) => (
                              <SelectItem key={`medical-record-${patient.id}`} value={patient.id}>
                                {patient.name} ({patient.id.slice(0, 8)}...)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="record_type">Record Type</Label>
                        <Select value={newRecord.record_type} onValueChange={(value: string) => 
                          setNewRecord(prev => ({ ...prev, record_type: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consultation">Consultation</SelectItem>
                            <SelectItem value="lab-results">Lab Results</SelectItem>
                            <SelectItem value="imaging">Imaging</SelectItem>
                            <SelectItem value="prescription">Prescription</SelectItem>
                            <SelectItem value="diagnosis">Diagnosis</SelectItem>
                            <SelectItem value="treatment-plan">Treatment Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="record_date">Date</Label>
                        <Input
                          id="record_date"
                          type="date"
                          value={newRecord.record_date}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, record_date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newRecord.title}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Record title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newRecord.description}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnosis</Label>
                      <Textarea
                        id="diagnosis"
                        value={newRecord.diagnosis}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosis: e.target.value }))}
                        placeholder="Medical diagnosis"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="treatment">Treatment</Label>
                      <Textarea
                        id="treatment"
                        value={newRecord.treatment}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, treatment: e.target.value }))}
                        placeholder="Treatment plan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medications">Medications</Label>
                      <Textarea
                        id="medications"
                        value={newRecord.medications}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, medications: e.target.value }))}
                        placeholder="Prescribed medications"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCreateMedicalRecord} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Save Record
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingRecord(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Prescription Dialog */}
              <Dialog open={isCreatingPrescription} onOpenChange={setIsCreatingPrescription}>
                <DialogTrigger asChild>
                  <Button variant="medical" className="h-16 flex-col space-y-2">
                    <Pill className="h-6 w-6" />
                    <span>New Prescription</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Prescription</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="prescription_patient_search">Select Patient</Label>
                      <div className="space-y-2">
                        <Input
                          id="prescription_patient_search"
                          placeholder="Search patient by name..."
                          value={searchPatient}
                          onChange={(e) => setSearchPatient(e.target.value)}
                        />
                        <Select value={newPrescription.patient_id} onValueChange={(value) => 
                          setNewPrescription(prev => ({ ...prev, patient_id: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredPatients.slice(0, 10).map((patient) => (
                              <SelectItem key={`prescription-${patient.id}`} value={patient.id}>
                                {patient.name} ({patient.id.slice(0, 8)}...)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medication_name">Medication Name *</Label>
                      <Input
                        id="medication_name"
                        value={newPrescription.medication_name}
                        onChange={(e) => setNewPrescription(prev => ({ ...prev, medication_name: e.target.value }))}
                        placeholder="e.g., Amoxicillin"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage *</Label>
                        <Input
                          id="dosage"
                          value={newPrescription.dosage}
                          onChange={(e) => setNewPrescription(prev => ({ ...prev, dosage: e.target.value }))}
                          placeholder="e.g., 500mg"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency *</Label>
                        <Input
                          id="frequency"
                          value={newPrescription.frequency}
                          onChange={(e) => setNewPrescription(prev => ({ ...prev, frequency: e.target.value }))}
                          placeholder="e.g., 3 times daily"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Input
                          id="duration"
                          value={newPrescription.duration}
                          onChange={(e) => setNewPrescription(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g., 7 days"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={newPrescription.quantity}
                          onChange={(e) => setNewPrescription(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="e.g., 30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="refills_allowed">Refills Allowed</Label>
                        <Input
                          id="refills_allowed"
                          type="number"
                          min="0"
                          value={newPrescription.refills_allowed}
                          onChange={(e) => setNewPrescription(prev => ({ ...prev, refills_allowed: e.target.value }))}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiry_date">Expiry Date</Label>
                        <Input
                          id="expiry_date"
                          type="date"
                          value={newPrescription.expiry_date}
                          onChange={(e) => setNewPrescription(prev => ({ ...prev, expiry_date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={newPrescription.instructions}
                        onChange={(e) => setNewPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Special instructions for the patient"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCreatePrescription} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Create Prescription
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingPrescription(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="medical" className="h-16 flex-col space-y-2">
                <User className="h-6 w-6" />
                <span>Patient Records</span>
              </Button>
              <Button variant="medical" className="h-16 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span>Lab Results</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Video Call Overlay */}
      {activeVideoCall && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute inset-4 bg-white rounded-lg overflow-hidden">
            <VideoCallRoom
              callId={activeVideoCall.id}
              isDoctor={true}
              patientName={patientNames[activeVideoCall.patient_id] || 'Unknown Patient'}
              onEndCall={handleEndVideoCall}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboardWithPrescriptions;