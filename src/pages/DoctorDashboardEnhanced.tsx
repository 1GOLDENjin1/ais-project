import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, User, Stethoscope, FileText, Plus, Save, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rlsDataService } from "@/lib/rls-data-service";
import type { DoctorAppointmentView, DoctorDashboardSummary } from "@/types/rls-types";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayAppointments, setTodayAppointments] = useState<DoctorAppointmentView[]>([]);
  const [weeklyAppointments, setWeeklyAppointments] = useState<number>(0);
  const [pendingTasks, setPendingTasks] = useState<number>(0);
  const [recentLabTests, setRecentLabTests] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<{[key: string]: string}>({});
  
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

  useEffect(() => {
    if (user && user.role === 'doctor') {
      loadDoctorData();
      loadPatients();
    }
  }, [user]);

  const loadDoctorData = async () => {
    try {
      // Load appointments using RLS service
      const appointments = await rlsDataService.getDoctorAppointments();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayAppointments = appointments.filter(app => 
        app.appointment_date === todayStr
      );
      setTodayAppointments(todayAppointments);

      // Calculate weekly appointments
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyCount = appointments.filter(app => 
        new Date(app.appointment_date) >= oneWeekAgo
      ).length;
      setWeeklyAppointments(weeklyCount);

      // Load lab tests using RLS service
      const labTests = await rlsDataService.getDoctorLabTests();
      setRecentLabTests(labTests.slice(0, 5));

      // Mock pending tasks count
      setPendingTasks(6);
    } catch (error) {
      console.error('Error loading doctor data:', error);
    }
  };

  const loadPatients = async () => {
    try {
      // Load patients using RLS service
      const doctorPatients = await rlsDataService.getDoctorPatients();
      setPatients(doctorPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
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
      
      // Commented out unreachable code:
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

      // await db.createMedicalRecord(recordData);

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
                      <span className="text-sm font-medium text-primary">
                        {getPatientInitials(appointment.patient_id)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">
                          {getPatientName(appointment.patient_id)}
                        </p>
                        <Badge variant={getStatusColor(appointment.status) as any}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <span>{appointment.appointment_time}</span>
                        <span>{appointment.appointment_type}</span>
                      </div>
                      {appointment.reason && (
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      )}
                    </div>
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
                recentLabTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
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
                              <SelectItem key={patient.id} value={patient.id}>
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
                        placeholder="Detailed description of the consultation or findings"
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
                        placeholder="Treatment plan and procedures"
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

                    <div className="space-y-2">
                      <Label htmlFor="follow_up_instructions">Follow-up Instructions</Label>
                      <Textarea
                        id="follow_up_instructions"
                        value={newRecord.follow_up_instructions}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, follow_up_instructions: e.target.value }))}
                        placeholder="Next steps and follow-up requirements"
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

              <Button variant="medical" className="h-16 flex-col space-y-2">
                <User className="h-6 w-6" />
                <span>Patient Records</span>
              </Button>
              <Button variant="medical" className="h-16 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span>Lab Results</span>
              </Button>
              <Button variant="medical" className="h-16 flex-col space-y-2">
                <Stethoscope className="h-6 w-6" />
                <span>Prescriptions</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorDashboard;