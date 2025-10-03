import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  Clock, 
  Heart, 
  AlertTriangle,
  Stethoscope,
  FileText,
  Pill,
  Plus,
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
// Toast notifications - using alert for now, can be replaced with proper toast library
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies: string;
  medical_history: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  reason: string;
  status: string;
  consultation_type: string;
  duration_minutes: number;
  fee: number;
  patient: Patient;
}

interface Prescription {
  medication_name: string;
  dosage: string;
  instructions: string;
}

interface MedicalRecord {
  diagnosis: string;
  notes: string;
  prescriptions: Prescription[];
}

const DoctorConsultationInterface: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord>({
    diagnosis: '',
    notes: '',
    prescriptions: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointmentId && user) {
      fetchAppointmentDetails();
    }
  }, [appointmentId, user]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      
      // Get doctor ID first
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (doctorError) throw doctorError;

      // Fetch appointment with patient data
      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            date_of_birth,
            gender,
            blood_type,
            allergies,
            medical_history,
            user:users(name, email, phone)
          )
        `)
        .eq('id', appointmentId)
        .eq('doctor_id', doctorData.id)
        .single();

      if (error) throw error;

      const formattedAppointment = {
        ...appointmentData,
        patient: {
          id: appointmentData.patient.id,
          name: appointmentData.patient.user.name,
          email: appointmentData.patient.user.email,
          phone: appointmentData.patient.user.phone,
          date_of_birth: appointmentData.patient.date_of_birth,
          gender: appointmentData.patient.gender,
          blood_type: appointmentData.patient.blood_type,
          allergies: appointmentData.patient.allergies,
          medical_history: appointmentData.patient.medical_history
        }
      };

      setAppointment(formattedAppointment);

      // Check if medical record already exists
      const { data: existingRecord } = await supabase
        .from('medical_records')
        .select(`
          *,
          prescriptions(*)
        `)
        .eq('appointment_id', appointmentId)
        .single();

      if (existingRecord) {
        setMedicalRecord({
          diagnosis: existingRecord.diagnosis || '',
          notes: existingRecord.notes || '',
          prescriptions: existingRecord.prescriptions || []
        });
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const addPrescription = () => {
    setMedicalRecord(prev => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        { medication_name: '', dosage: '', instructions: '' }
      ]
    }));
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
    setMedicalRecord(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((prescription, i) =>
        i === index ? { ...prescription, [field]: value } : prescription
      )
    }));
  };

  const removePrescription = (index: number) => {
    setMedicalRecord(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const completeConsultation = async () => {
    if (!appointment || !medicalRecord.diagnosis.trim()) {
      toast.error('Please provide a diagnosis before completing the consultation');
      return;
    }

    try {
      setSaving(true);

      // Get doctor ID
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (doctorError) throw doctorError;

      // Check if medical record already exists
      const { data: existingRecord } = await supabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      let medicalRecordId: string;

      if (existingRecord) {
        // Update existing medical record
        const { error: updateError } = await supabase
          .from('medical_records')
          .update({
            diagnosis: medicalRecord.diagnosis,
            notes: medicalRecord.notes
          })
          .eq('id', existingRecord.id);

        if (updateError) throw updateError;
        medicalRecordId = existingRecord.id;

        // Delete existing prescriptions
        await supabase
          .from('prescriptions')
          .delete()
          .eq('medical_record_id', existingRecord.id);
      } else {
        // Create new medical record
        const { data: newRecord, error: recordError } = await supabase
          .from('medical_records')
          .insert({
            patient_id: appointment.patient.id,
            doctor_id: doctorData.id,
            appointment_id: appointmentId,
            diagnosis: medicalRecord.diagnosis,
            notes: medicalRecord.notes
          })
          .select()
          .single();

        if (recordError) throw recordError;
        medicalRecordId = newRecord.id;
      }

      // Add prescriptions if any
      if (medicalRecord.prescriptions.length > 0) {
        const prescriptionsToAdd = medicalRecord.prescriptions.filter(
          p => p.medication_name.trim() && p.dosage.trim()
        );

        if (prescriptionsToAdd.length > 0) {
          const { error: prescriptionError } = await supabase
            .from('prescriptions')
            .insert(
              prescriptionsToAdd.map(prescription => ({
                medical_record_id: medicalRecordId,
                medication_name: prescription.medication_name,
                dosage: prescription.dosage,
                instructions: prescription.instructions
              }))
            );

          if (prescriptionError) throw prescriptionError;
        }
      }

      // Update appointment status to completed
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      toast.success('Consultation completed successfully!');
      navigate('/doctor/appointments');
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast.error('Failed to complete consultation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Appointment not found</p>
          <Button onClick={() => navigate('/doctor/appointments')} className="mt-4">
            Back to Appointments
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate('/doctor/appointments')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl flex-1">
          <h1 className="text-2xl font-bold mb-2">Patient Consultation</h1>
          <p className="opacity-90">Complete the consultation and medical record</p>
        </div>
      </div>

      {/* Patient Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Patient Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Name</Label>
                <p className="text-lg font-semibold">{appointment.patient.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Contact</Label>
                <p>{appointment.patient.email}</p>
                <p>{appointment.patient.phone}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Gender</Label>
                  <p>{appointment.patient.gender}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Blood Type</Label>
                  <Badge variant="outline" className="ml-2">
                    <Heart className="w-3 h-3 mr-1" />
                    {appointment.patient.blood_type}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Appointment Details</Label>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{format(parseISO(appointment.appointment_date), 'MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{format(parseISO(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    <span>{appointment.service_type}</span>
                  </div>
                </div>
              </div>
              
              {appointment.reason && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Reason for Visit</Label>
                  <p className="bg-gray-50 p-3 rounded-lg">{appointment.reason}</p>
                </div>
              )}
            </div>
          </div>
          
          {appointment.patient.allergies && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Allergies
              </Label>
              <p className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400 mt-2">
                {appointment.patient.allergies}
              </p>
            </div>
          )}
          
          {appointment.patient.medical_history && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-600">Medical History</Label>
              <p className="bg-blue-50 p-3 rounded-lg mt-2">{appointment.patient.medical_history}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Record Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Medical Record</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="diagnosis">Diagnosis *</Label>
            <Input
              id="diagnosis"
              value={medicalRecord.diagnosis}
              onChange={(e) => setMedicalRecord(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Enter diagnosis..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={medicalRecord.notes}
              onChange={(e) => setMedicalRecord(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter detailed consultation notes, examination findings, recommendations..."
              rows={4}
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Prescriptions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold flex items-center">
                <Pill className="w-5 h-5 mr-2" />
                Prescriptions
              </Label>
              <Button onClick={addPrescription} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </div>

            {medicalRecord.prescriptions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Pill className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No prescriptions added yet</p>
                <Button onClick={addPrescription} variant="outline" size="sm" className="mt-2">
                  Add First Medication
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {medicalRecord.prescriptions.map((prescription, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`medication-${index}`}>Medication Name *</Label>
                          <Input
                            id={`medication-${index}`}
                            value={prescription.medication_name}
                            onChange={(e) => updatePrescription(index, 'medication_name', e.target.value)}
                            placeholder="e.g., Paracetamol"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`dosage-${index}`}>Dosage *</Label>
                          <Input
                            id={`dosage-${index}`}
                            value={prescription.dosage}
                            onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => removePrescription(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label htmlFor={`instructions-${index}`}>Instructions</Label>
                        <Textarea
                          id={`instructions-${index}`}
                          value={prescription.instructions}
                          onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                          placeholder="e.g., Take 1 tablet every 8 hours as needed for pain"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline"
              onClick={() => navigate('/doctor/appointments')}
            >
              Cancel
            </Button>
            <Button
              onClick={completeConsultation}
              disabled={saving || !medicalRecord.diagnosis.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Complete Consultation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorConsultationInterface;