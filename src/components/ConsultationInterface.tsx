/**
 * Consultation Interface Component
 * Comprehensive interface for conducting patient consultations (onsite/online)
 * Provides access to patient records, examination tools, and prescription management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

import { 
  Stethoscope,
  User,
  FileText,
  TestTube,
  Pill,
  Heart,
  Activity,
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Save,
  Plus,
  Eye,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  History,
  Camera,
  Mic,
  MicOff,
  VideoOff
} from "lucide-react";

// Interfaces
interface PatientInfo {
  id: string;
  date_of_birth: string;
  gender: string;
  address: string;
  blood_type?: string;
  allergies?: string;
  emergency_contact?: string;
  insurance_provider?: string;
  users: {
    name: string;
    email: string;
    phone: string;
  };
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  visit_date: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
}

interface LabTest {
  id: string;
  patient_id: string;
  test_name: string;
  test_type: string;
  status: 'ordered' | 'in_progress' | 'completed' | 'cancelled';
  results?: string;
  normal_range?: string;
  test_date: string;
  results_date?: string;
  ordered_by?: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribed_date: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface HealthMetric {
  id: string;
  patient_id: string;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  notes?: string;
}

interface ConsultationInterfaceProps {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  consultationType: 'in-person' | 'video' | 'phone';
  onConsultationComplete?: () => void;
  onConsultationCancel?: () => void;
}

const ConsultationInterface: React.FC<ConsultationInterfaceProps> = ({
  appointmentId,
  patientId,
  doctorId,
  consultationType,
  onConsultationComplete,
  onConsultationCancel
}) => {
  const { toast } = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  
  // Current consultation data
  const [currentRecord, setCurrentRecord] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    follow_up_required: false,
    follow_up_date: ''
  });
  
  // New prescription form
  const [newPrescription, setNewPrescription] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  
  // New lab test form
  const [newLabTest, setNewLabTest] = useState({
    test_name: '',
    test_type: '',
    instructions: ''
  });
  
  // Vital signs
  const [vitalSigns, setVitalSigns] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygen_saturation: ''
  });

  // Video call state (for video consultations)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);

      // Load patient information
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          users:user_id (
            name,
            email,
            phone
          )
        `)
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatientInfo(patient);

      // Load medical history
      const { data: history, error: historyError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (historyError) throw historyError;
      setMedicalHistory(history || []);

      // Load lab tests
      const { data: tests, error: testsError } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });

      if (testsError) throw testsError;
      setLabTests(tests || []);

      // Load prescriptions
      const { data: prescriptions, error: prescError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescribed_date', { ascending: false });

      if (prescError) throw prescError;
      setPrescriptions(prescriptions || []);

      // Load health metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(20);

      if (metricsError) throw metricsError;
      setHealthMetrics(metrics || []);

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load patient data for consultation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConsultationRecord = async () => {
    if (!currentRecord.diagnosis || !currentRecord.treatment) {
      toast({
        title: "Missing Information",
        description: "Please provide diagnosis and treatment information.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        diagnosis: currentRecord.diagnosis,
        treatment: currentRecord.treatment,
        notes: currentRecord.notes,
        visit_date: new Date().toISOString().split('T')[0],
        follow_up_required: currentRecord.follow_up_required,
        follow_up_date: currentRecord.follow_up_date || null
      };

      const { error } = await supabase
        .from('medical_records')
        .insert([recordData]);

      if (error) throw error;

      // Save vital signs as health metrics
      await saveVitalSigns();

      toast({
        title: "Record Saved",
        description: "Consultation record has been saved successfully.",
      });

      // Reload data to show the new record
      await loadPatientData();
      
      // Clear the current record form
      setCurrentRecord({
        diagnosis: '',
        treatment: '',
        notes: '',
        follow_up_required: false,
        follow_up_date: ''
      });

    } catch (error) {
      console.error('Error saving consultation record:', error);
      toast({
        title: "Save Error",
        description: "Failed to save consultation record.",
        variant: "destructive",
      });
    }
  };

  const saveVitalSigns = async () => {
    const vitalSignsEntries = [];
    const timestamp = new Date().toISOString();

    if (vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic) {
      vitalSignsEntries.push({
        patient_id: patientId,
        metric_type: 'blood_pressure',
        value: parseFloat(vitalSigns.blood_pressure_systolic),
        unit: 'mmHg',
        recorded_at: timestamp,
        notes: `${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic}`
      });
    }

    if (vitalSigns.heart_rate) {
      vitalSignsEntries.push({
        patient_id: patientId,
        metric_type: 'heart_rate',
        value: parseFloat(vitalSigns.heart_rate),
        unit: 'bpm',
        recorded_at: timestamp
      });
    }

    if (vitalSigns.temperature) {
      vitalSignsEntries.push({
        patient_id: patientId,
        metric_type: 'temperature',
        value: parseFloat(vitalSigns.temperature),
        unit: '°C',
        recorded_at: timestamp
      });
    }

    if (vitalSigns.weight) {
      vitalSignsEntries.push({
        patient_id: patientId,
        metric_type: 'weight',
        value: parseFloat(vitalSigns.weight),
        unit: 'kg',
        recorded_at: timestamp
      });
    }

    if (vitalSigns.oxygen_saturation) {
      vitalSignsEntries.push({
        patient_id: patientId,
        metric_type: 'oxygen_saturation',
        value: parseFloat(vitalSigns.oxygen_saturation),
        unit: '%',
        recorded_at: timestamp
      });
    }

    if (vitalSignsEntries.length > 0) {
      const { error } = await supabase
        .from('health_metrics')
        .insert(vitalSignsEntries);

      if (error) {
        console.error('Error saving vital signs:', error);
      }
    }
  };

  const addPrescription = async () => {
    if (!newPrescription.medication_name || !newPrescription.dosage) {
      toast({
        title: "Missing Information",
        description: "Please provide medication name and dosage.",
        variant: "destructive",
      });
      return;
    }

    try {
      const prescriptionData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        medication_name: newPrescription.medication_name,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        duration: newPrescription.duration,
        instructions: newPrescription.instructions,
        prescribed_date: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      const { error } = await supabase
        .from('prescriptions')
        .insert([prescriptionData]);

      if (error) throw error;

      toast({
        title: "Prescription Added",
        description: "Prescription has been added successfully.",
      });

      // Reset form and reload data
      setNewPrescription({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
      
      await loadPatientData();

    } catch (error) {
      console.error('Error adding prescription:', error);
      toast({
        title: "Prescription Error",
        description: "Failed to add prescription.",
        variant: "destructive",
      });
    }
  };

  const orderLabTest = async () => {
    if (!newLabTest.test_name || !newLabTest.test_type) {
      toast({
        title: "Missing Information",
        description: "Please provide test name and type.",
        variant: "destructive",
      });
      return;
    }

    try {
      const labTestData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        test_name: newLabTest.test_name,
        test_type: newLabTest.test_type,
        status: 'ordered',
        test_date: new Date().toISOString().split('T')[0],
        instructions: newLabTest.instructions,
        ordered_by: doctorId
      };

      const { error } = await supabase
        .from('lab_tests')
        .insert([labTestData]);

      if (error) throw error;

      toast({
        title: "Lab Test Ordered",
        description: "Lab test has been ordered successfully.",
      });

      // Reset form and reload data
      setNewLabTest({
        test_name: '',
        test_type: '',
        instructions: ''
      });
      
      await loadPatientData();

    } catch (error) {
      console.error('Error ordering lab test:', error);
      toast({
        title: "Lab Test Error",
        description: "Failed to order lab test.",
        variant: "destructive",
      });
    }
  };

  const completeConsultation = async () => {
    try {
      // Update appointment status to completed
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          consultation_notes: currentRecord.notes
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Consultation Completed",
        description: "The consultation has been marked as completed.",
      });

      onConsultationComplete?.();

    } catch (error) {
      console.error('Error completing consultation:', error);
      toast({
        title: "Completion Error",
        description: "Failed to complete consultation.",
        variant: "destructive",
      });
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (isLoading || !patientInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consultation Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6" />
                Consultation - {patientInfo.users.name}
              </CardTitle>
              <CardDescription>
                {consultationType.charAt(0).toUpperCase() + consultationType.slice(1)} consultation • {new Date().toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {consultationType === 'video' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isMuted ? "destructive" : "outline"}
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={isVideoOff ? "destructive" : "outline"}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              <Button onClick={completeConsultation}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Consultation
              </Button>
              <Button variant="outline" onClick={onConsultationCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Patient Information Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Age</p>
              <p className="font-medium">{calculateAge(patientInfo.date_of_birth)} years old</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{patientInfo.gender}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Blood Type</p>
              <p className="font-medium">{patientInfo.blood_type || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact</p>
              <p className="font-medium">{patientInfo.users.phone}</p>
            </div>
          </div>
          
          {patientInfo.allergies && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Allergies:</span>
                <span className="text-red-800">{patientInfo.allergies}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Consultation Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="examination">Examination</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="lab-tests">Lab Tests</TabsTrigger>
          <TabsTrigger value="notes">Notes & Records</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {medicalHistory.slice(0, 3).map((record) => (
                    <div key={record.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{record.diagnosis}</p>
                        <Badge variant="outline">
                          {new Date(record.visit_date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{record.treatment}</p>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                      )}
                    </div>
                  ))}
                  {medicalHistory.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No medical history available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Recent Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthMetrics.slice(0, 5).map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center">
                      <span className="capitalize">{metric.metric_type.replace('_', ' ')}</span>
                      <div className="text-right">
                        <p className="font-medium">{metric.value} {metric.unit}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(metric.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {healthMetrics.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No vital signs recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Examination Tab */}
        <TabsContent value="examination" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vital Signs Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Record Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Blood Pressure (Systolic)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={vitalSigns.blood_pressure_systolic}
                      onChange={(e) => setVitalSigns(prev => ({
                        ...prev,
                        blood_pressure_systolic: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Blood Pressure (Diastolic)</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={vitalSigns.blood_pressure_diastolic}
                      onChange={(e) => setVitalSigns(prev => ({
                        ...prev,
                        blood_pressure_diastolic: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      placeholder="72"
                      value={vitalSigns.heart_rate}
                      onChange={(e) => setVitalSigns(prev => ({
                        ...prev,
                        heart_rate: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Temperature (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={vitalSigns.temperature}
                      onChange={(e) => setVitalSigns(prev => ({
                        ...prev,
                        temperature: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={vitalSigns.weight}
                      onChange={(e) => setVitalSigns(prev => ({
                        ...prev,
                        weight: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Oxygen Saturation (%)</Label>
                    <Input
                      type="number"
                      placeholder="98"
                      value={vitalSigns.oxygen_saturation}
                      onChange={(e) => setVitalSigns(prev => ({
                        ...prev,
                        oxygen_saturation: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultation Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Examination Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Diagnosis</Label>
                  <Input
                    placeholder="Primary diagnosis"
                    value={currentRecord.diagnosis}
                    onChange={(e) => setCurrentRecord(prev => ({
                      ...prev,
                      diagnosis: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Treatment Plan</Label>
                  <Textarea
                    placeholder="Treatment recommendations and instructions"
                    value={currentRecord.treatment}
                    onChange={(e) => setCurrentRecord(prev => ({
                      ...prev,
                      treatment: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Clinical Notes</Label>
                  <Textarea
                    placeholder="Detailed examination notes, observations, and patient symptoms"
                    value={currentRecord.notes}
                    onChange={(e) => setCurrentRecord(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="follow_up"
                    checked={currentRecord.follow_up_required}
                    onChange={(e) => setCurrentRecord(prev => ({
                      ...prev,
                      follow_up_required: e.target.checked
                    }))}
                  />
                  <Label htmlFor="follow_up">Follow-up required</Label>
                </div>
                
                {currentRecord.follow_up_required && (
                  <div>
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={currentRecord.follow_up_date}
                      onChange={(e) => setCurrentRecord(prev => ({
                        ...prev,
                        follow_up_date: e.target.value
                      }))}
                    />
                  </div>
                )}
                
                <Button onClick={saveConsultationRecord} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Consultation Record
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicalHistory.map((record) => (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">{record.diagnosis}</h4>
                      <Badge variant="outline">
                        {new Date(record.visit_date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Treatment:</span> {record.treatment}
                      </div>
                      {record.notes && (
                        <div>
                          <span className="font-medium">Notes:</span> {record.notes}
                        </div>
                      )}
                      {record.follow_up_required && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Follow-up:</span>
                          <Badge variant="secondary">Required</Badge>
                          {record.follow_up_date && (
                            <span>{new Date(record.follow_up_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {medicalHistory.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Medical History</h3>
                    <p className="text-muted-foreground">This patient has no recorded medical history.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Prescription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Prescription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Medication Name</Label>
                  <Input
                    placeholder="Enter medication name"
                    value={newPrescription.medication_name}
                    onChange={(e) => setNewPrescription(prev => ({
                      ...prev,
                      medication_name: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input
                    placeholder="e.g., 500mg"
                    value={newPrescription.dosage}
                    onChange={(e) => setNewPrescription(prev => ({
                      ...prev,
                      dosage: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={newPrescription.frequency}
                    onValueChange={(value) => setNewPrescription(prev => ({
                      ...prev,
                      frequency: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once_daily">Once daily</SelectItem>
                      <SelectItem value="twice_daily">Twice daily</SelectItem>
                      <SelectItem value="three_times_daily">Three times daily</SelectItem>
                      <SelectItem value="four_times_daily">Four times daily</SelectItem>
                      <SelectItem value="as_needed">As needed</SelectItem>
                      <SelectItem value="before_meals">Before meals</SelectItem>
                      <SelectItem value="after_meals">After meals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input
                    placeholder="e.g., 7 days, 2 weeks"
                    value={newPrescription.duration}
                    onChange={(e) => setNewPrescription(prev => ({
                      ...prev,
                      duration: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    placeholder="Additional instructions for the patient"
                    value={newPrescription.instructions}
                    onChange={(e) => setNewPrescription(prev => ({
                      ...prev,
                      instructions: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
                <Button onClick={addPrescription} className="w-full">
                  <Pill className="h-4 w-4 mr-2" />
                  Add Prescription
                </Button>
              </CardContent>
            </Card>

            {/* Current Prescriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Current Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prescriptions.filter(p => p.status === 'active').map((prescription) => (
                    <div key={prescription.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{prescription.medication_name}</h5>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Dosage:</strong> {prescription.dosage}</p>
                        <p><strong>Frequency:</strong> {prescription.frequency.replace('_', ' ')}</p>
                        <p><strong>Duration:</strong> {prescription.duration}</p>
                        {prescription.instructions && (
                          <p><strong>Instructions:</strong> {prescription.instructions}</p>
                        )}
                        <p><strong>Prescribed:</strong> {new Date(prescription.prescribed_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {prescriptions.filter(p => p.status === 'active').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No active prescriptions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lab Tests Tab */}
        <TabsContent value="lab-tests" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order New Lab Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Order Lab Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Test Name</Label>
                  <Input
                    placeholder="Enter test name"
                    value={newLabTest.test_name}
                    onChange={(e) => setNewLabTest(prev => ({
                      ...prev,
                      test_name: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Test Type</Label>
                  <Select
                    value={newLabTest.test_type}
                    onValueChange={(value) => setNewLabTest(prev => ({
                      ...prev,
                      test_type: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood_test">Blood Test</SelectItem>
                      <SelectItem value="urine_test">Urine Test</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                      <SelectItem value="biopsy">Biopsy</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="genetic">Genetic Test</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    placeholder="Special instructions for the lab test"
                    value={newLabTest.instructions}
                    onChange={(e) => setNewLabTest(prev => ({
                      ...prev,
                      instructions: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
                <Button onClick={orderLabTest} className="w-full">
                  <TestTube className="h-4 w-4 mr-2" />
                  Order Lab Test
                </Button>
              </CardContent>
            </Card>

            {/* Recent Lab Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Lab Tests History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {labTests.slice(0, 5).map((test) => (
                    <div key={test.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{test.test_name}</h5>
                        <Badge variant={
                          test.status === 'completed' ? 'default' :
                          test.status === 'in_progress' ? 'secondary' :
                          test.status === 'ordered' ? 'outline' : 'destructive'
                        }>
                          {test.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Type:</strong> {test.test_type.replace('_', ' ')}</p>
                        <p><strong>Ordered:</strong> {new Date(test.test_date).toLocaleDateString()}</p>
                        {test.results_date && (
                          <p><strong>Results:</strong> {new Date(test.results_date).toLocaleDateString()}</p>
                        )}
                        {test.results && (
                          <div>
                            <p><strong>Results:</strong></p>
                            <p className="bg-gray-50 p-2 rounded text-xs">{test.results}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {labTests.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No lab tests ordered</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notes & Records Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Consultation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Patient Summary</h4>
                  <div className="text-sm space-y-2">
                    <p><strong>Name:</strong> {patientInfo.users.name}</p>
                    <p><strong>Age:</strong> {calculateAge(patientInfo.date_of_birth)} years</p>
                    <p><strong>Gender:</strong> {patientInfo.gender}</p>
                    <p><strong>Blood Type:</strong> {patientInfo.blood_type || 'Not specified'}</p>
                    {patientInfo.allergies && (
                      <p><strong>Allergies:</strong> {patientInfo.allergies}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Consultation Details</h4>
                  <div className="text-sm space-y-2">
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Type:</strong> {consultationType}</p>
                    <p><strong>Appointment ID:</strong> {appointmentId}</p>
                    <p><strong>Status:</strong> In Progress</p>
                  </div>
                </div>
              </div>
              
              {/* Current Session Summary */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">Current Session</h4>
                <div className="space-y-3">
                  {currentRecord.diagnosis && (
                    <div>
                      <strong>Diagnosis:</strong> {currentRecord.diagnosis}
                    </div>
                  )}
                  {currentRecord.treatment && (
                    <div>
                      <strong>Treatment:</strong> {currentRecord.treatment}
                    </div>
                  )}
                  {currentRecord.notes && (
                    <div>
                      <strong>Notes:</strong> {currentRecord.notes}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button onClick={saveConsultationRecord}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Record
                    </Button>
                    <Button onClick={completeConsultation} variant="default">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Consultation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationInterface;