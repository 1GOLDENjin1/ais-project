// ===================================================
// DOCTOR VIDEO CONSULTATION - Enhanced interface for doctors
// Specialized video call interface with patient info and medical tools
// ===================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoSDKService } from '@/services/videoSDKService';
import VideoConsultation from './VideoConsultation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  FileText, 
  Heart, 
  AlertTriangle, 
  Pill, 
  Activity,
  Save,
  Printer,
  Camera,
  Mic,
  Video,
  Monitor
} from 'lucide-react';

interface DoctorVideoConsultationProps {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
}

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  allergies: string;
  medicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

interface AppointmentDetails {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  reason: string;
  status: string;
  fee: number;
}

export default function DoctorVideoConsultation({ 
  appointmentId, 
  doctorId, 
  doctorName 
}: DoctorVideoConsultationProps) {
  const [meetingId, setMeetingId] = useState<string>('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [videoCallData, setVideoCallData] = useState<any>(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<Array<{
    medication: string;
    dosage: string;
    instructions: string;
    duration: string;
  }>>([]);
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointmentData();
  }, [appointmentId]);

  const loadAppointmentData = async () => {
    try {
      setIsLoading(true);
      
      // Load appointment with patient details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          service_type,
          reason,
          status,
          fee,
          patients!inner(
            id,
            date_of_birth,
            gender,
            blood_type,
            allergies,
            medical_history,
            emergency_contact_name,
            emergency_contact_phone,
            users!inner(
              name,
              email,
              phone
            )
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      // Set appointment details
      setAppointmentDetails({
        id: appointment.id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        serviceType: appointment.service_type,
        reason: appointment.reason || '',
        status: appointment.status,
        fee: appointment.fee || 0
      });

      // Set patient info
      const patient = appointment.patients;
      setPatientInfo({
        id: patient.id,
        name: patient.users.name,
        email: patient.users.email,
        phone: patient.users.phone,
        dateOfBirth: patient.date_of_birth || '',
        gender: patient.gender || '',
        bloodType: patient.blood_type || '',
        allergies: patient.allergies || '',
        medicalHistory: patient.medical_history || '',
        emergencyContactName: patient.emergency_contact_name || '',
        emergencyContactPhone: patient.emergency_contact_phone || ''
      });

      // Check for existing video call
      const videoSDKService = VideoSDKService.getInstance();
      const existingVideoCall = await videoSDKService.getVideoCallByAppointment(appointmentId);
      
      if (existingVideoCall) {
        setVideoCallData(existingVideoCall);
        setMeetingId(existingVideoCall.videosdk_meeting_id);
      }

      // Load existing medical records for this appointment
      const { data: medicalRecord } = await supabase
        .from('medical_records')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (medicalRecord) {
        setDiagnosis(medicalRecord.diagnosis || '');
        setConsultationNotes(medicalRecord.notes || '');
        if (medicalRecord.vitals) {
          setVitals({ ...vitals, ...medicalRecord.vitals });
        }
      }

    } catch (error) {
      console.error('Error loading appointment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVideoConsultation = async () => {
    try {
      if (!videoCallData) {
        // Create new video call
        const videoSDKService = VideoSDKService.getInstance();
        const videoCallSession = await videoSDKService.startVideoCallSession({
          appointmentId,
          doctorId,
          patientId: patientInfo!.id,
          enableRecording: true
        });

        setMeetingId(videoCallSession.meetingId);
        setVideoCallData(videoCallSession);
      } else {
        setMeetingId(videoCallData.videosdk_meeting_id);
      }
      
      setShowVideoCall(true);
    } catch (error) {
      console.error('Error starting video consultation:', error);
    }
  };

  const saveConsultationNotes = async () => {
    try {
      // Save medical record
      const medicalRecordData = {
        appointment_id: appointmentId,
        patient_id: patientInfo!.id,
        doctor_id: doctorId,
        diagnosis,
        notes: consultationNotes,
        vitals: vitals,
        treatment: prescriptions.map(p => `${p.medication} - ${p.dosage} - ${p.instructions}`).join('; ')
      };

      const { error } = await supabase
        .from('medical_records')
        .upsert(medicalRecordData, { 
          onConflict: 'appointment_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      // Save prescriptions
      if (prescriptions.length > 0) {
        const { data: medicalRecord } = await supabase
          .from('medical_records')
          .select('id')
          .eq('appointment_id', appointmentId)
          .single();

        if (medicalRecord) {
          const prescriptionData = prescriptions.map(prescription => ({
            medical_record_id: medicalRecord.id,
            medication_name: prescription.medication,
            dosage: prescription.dosage,
            instructions: prescription.instructions,
            duration_days: parseInt(prescription.duration) || 7,
            prescribed_by: doctorId
          }));

          await supabase
            .from('prescriptions')
            .upsert(prescriptionData, { 
              onConflict: 'medical_record_id,medication_name'
            });
        }
      }

      console.log('✅ Consultation notes saved successfully');
    } catch (error) {
      console.error('❌ Error saving consultation notes:', error);
    }
  };

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medication: '', dosage: '', instructions: '', duration: '7' }
    ]);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation details...</p>
        </div>
      </div>
    );
  }

  if (showVideoCall && meetingId) {
    return (
      <VideoConsultation
        meetingId={meetingId}
        appointmentId={appointmentId}
        userRole="doctor"
        userId={doctorId}
        userName={doctorName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Video Consultation
              </h1>
              <p className="text-sm text-gray-600">
                Dr. {doctorName} • {appointmentDetails?.serviceType}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={appointmentDetails?.status === 'confirmed' ? 'default' : 'secondary'}
                className="px-3 py-1"
              >
                {appointmentDetails?.status?.toUpperCase()}
              </Badge>
              <Button 
                onClick={startVideoConsultation}
                className="bg-green-600 hover:bg-green-700"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Video Call
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info & Appointment Details */}
          <div className="space-y-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patientInfo && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{patientInfo.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {patientInfo.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {patientInfo.phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Born: {new Date(patientInfo.dateOfBirth).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Gender:</span>
                        <p>{patientInfo.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Blood Type:</span>
                        <p>{patientInfo.bloodType || 'Unknown'}</p>
                      </div>
                    </div>

                    {patientInfo.allergies && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center text-red-800 mb-1">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span className="font-medium">Allergies</span>
                        </div>
                        <p className="text-red-700 text-sm">{patientInfo.allergies}</p>
                      </div>
                    )}

                    {patientInfo.medicalHistory && (
                      <div>
                        <span className="font-medium text-sm">Medical History:</span>
                        <p className="text-sm text-gray-600 mt-1">{patientInfo.medicalHistory}</p>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <span className="font-medium text-sm">Emergency Contact:</span>
                      <div className="text-sm text-gray-600">
                        <p>{patientInfo.emergencyContactName}</p>
                        <p>{patientInfo.emergencyContactPhone}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointmentDetails && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Date:</span>
                      <span className="text-sm">
                        {new Date(appointmentDetails.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Time:</span>
                      <span className="text-sm">{appointmentDetails.appointmentTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Service:</span>
                      <span className="text-sm">{appointmentDetails.serviceType}</span>
                    </div>
                    {appointmentDetails.reason && (
                      <div>
                        <span className="text-sm font-medium">Reason:</span>
                        <p className="text-sm text-gray-600 mt-1">{appointmentDetails.reason}</p>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Fee:</span>
                      <span className="text-sm">₱{appointmentDetails.fee.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle & Right Columns - Consultation Notes */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Consultation Notes
                  </div>
                  <Button onClick={saveConsultationNotes} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Notes
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="notes" className="h-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                    <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="notes" className="mt-4">
                    <Textarea
                      placeholder="Enter consultation notes, observations, and recommendations..."
                      value={consultationNotes}
                      onChange={(e) => setConsultationNotes(e.target.value)}
                      className="min-h-[400px] resize-none"
                    />
                  </TabsContent>

                  <TabsContent value="vitals" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Blood Pressure</label>
                        <Input
                          placeholder="120/80"
                          value={vitals.bloodPressure}
                          onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Heart Rate (bpm)</label>
                        <Input
                          placeholder="72"
                          value={vitals.heartRate}
                          onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Temperature (°C)</label>
                        <Input
                          placeholder="36.5"
                          value={vitals.temperature}
                          onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Weight (kg)</label>
                        <Input
                          placeholder="70"
                          value={vitals.weight}
                          onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Height (cm)</label>
                        <Input
                          placeholder="170"
                          value={vitals.height}
                          onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="diagnosis" className="mt-4">
                    <Textarea
                      placeholder="Enter primary and secondary diagnoses, ICD-10 codes if applicable..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                  </TabsContent>

                  <TabsContent value="prescriptions" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Prescriptions</h4>
                        <Button onClick={addPrescription} size="sm" variant="outline">
                          <Pill className="h-4 w-4 mr-2" />
                          Add Prescription
                        </Button>
                      </div>

                      {prescriptions.map((prescription, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">Prescription #{index + 1}</h5>
                            <Button 
                              onClick={() => removePrescription(index)} 
                              size="sm" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">Medication</label>
                              <Input
                                placeholder="Medicine name"
                                value={prescription.medication}
                                onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Dosage</label>
                              <Input
                                placeholder="e.g. 500mg"
                                value={prescription.dosage}
                                onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Instructions</label>
                              <Input
                                placeholder="e.g. Take twice daily after meals"
                                value={prescription.instructions}
                                onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Duration (days)</label>
                              <Input
                                placeholder="7"
                                type="number"
                                value={prescription.duration}
                                onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {prescriptions.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No prescriptions added yet. Click "Add Prescription" to start.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}