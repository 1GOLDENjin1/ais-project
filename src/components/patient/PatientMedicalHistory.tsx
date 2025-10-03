import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Pill, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope,
  Heart,
  TestTube,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  created_at: string;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  notes: string;
  created_at: string;
  doctor: Doctor;
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    service_type: string;
    reason: string;
  };
  prescriptions: Prescription[];
}

interface LabTest {
  id: string;
  test_type: string;
  result: string;
  created_at: string;
  doctor: Doctor;
  appointment: {
    id: string;
    appointment_date: string;
    service_type: string;
  };
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  reason: string;
  status: string;
  consultation_type: string;
  fee: number;
  doctor: Doctor;
}

const PatientMedicalHistory: React.FC = () => {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('records');

  useEffect(() => {
    if (user) {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Get patient ID first
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (patientError) throw patientError;

      // Fetch medical records with prescriptions
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select(`
          id,
          diagnosis,
          notes,
          created_at,
          appointment:appointments(
            id,
            appointment_date,
            appointment_time,
            service_type,
            reason
          ),
          doctor:doctors!inner(
            id,
            specialty,
            user:users!inner(name)
          ),
          prescriptions(
            id,
            medication_name,
            dosage,
            instructions,
            created_at
          )
        `)
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;

      const formattedRecords = recordsData.map((record: any) => ({
        ...record,
        doctor: {
          id: record.doctor?.id || '',
          name: record.doctor?.user?.name || 'Unknown Doctor',
          specialty: record.doctor?.specialty || 'General Practice'
        }
      }));

      setMedicalRecords(formattedRecords);

      // Fetch lab tests
      const { data: labData, error: labError } = await supabase
        .from('lab_tests')
        .select(`
          id,
          test_type,
          result,
          created_at,
          appointment:appointments(
            id,
            appointment_date,
            service_type
          ),
          doctor:doctors!inner(
            id,
            specialty,
            user:users!inner(name)
          )
        `)
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });

      if (labError) throw labError;

      const formattedLabTests = labData.map((test: any) => ({
        ...test,
        doctor: {
          id: test.doctor?.id || '',
          name: test.doctor?.user?.name || 'Unknown Doctor',
          specialty: test.doctor?.specialty || 'General Practice'
        }
      }));

      setLabTests(formattedLabTests);

      // Fetch all appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          service_type,
          reason,
          status,
          consultation_type,
          fee,
          doctor:doctors!inner(
            id,
            specialty,
            user:users!inner(name)
          )
        `)
        .eq('patient_id', patientData.id)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      const formattedAppointments = appointmentsData.map((apt: any) => ({
        ...apt,
        doctor: {
          id: apt.doctor?.id || '',
          name: apt.doctor?.user?.name || 'Unknown Doctor',
          specialty: apt.doctor?.specialty || 'General Practice'
        }
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const MedicalRecordCard: React.FC<{ record: MedicalRecord }> = ({ record }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{record.diagnosis}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(parseISO(record.created_at), 'MMM dd, yyyy')}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Dr. {record.doctor.name}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-blue-600">
            {record.doctor.specialty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Appointment Details</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Service:</strong> {record.appointment.service_type}</div>
                <div><strong>Date:</strong> {format(parseISO(record.appointment.appointment_date), 'MMM dd, yyyy')}</div>
                <div><strong>Time:</strong> {format(parseISO(`2000-01-01T${record.appointment.appointment_time}`), 'h:mm a')}</div>
                {record.appointment.reason && (
                  <div className="md:col-span-2"><strong>Reason:</strong> {record.appointment.reason}</div>
                )}
              </div>
            </div>
          </div>

          {record.notes && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Clinical Notes</h4>
              <p className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                {record.notes}
              </p>
            </div>
          )}

          {record.prescriptions && record.prescriptions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <Pill className="w-4 h-4 mr-2" />
                Prescribed Medications ({record.prescriptions.length})
              </h4>
              <div className="space-y-2">
                {record.prescriptions.map(prescription => (
                  <div key={prescription.id} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-green-800">{prescription.medication_name}</h5>
                        <p className="text-sm text-green-700"><strong>Dosage:</strong> {prescription.dosage}</p>
                        {prescription.instructions && (
                          <p className="text-sm text-green-600 mt-1">{prescription.instructions}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <Pill className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const LabTestCard: React.FC<{ test: LabTest }> = ({ test }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{test.test_type}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(parseISO(test.created_at), 'MMM dd, yyyy')}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Dr. {test.doctor.name}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-purple-600">
              {test.doctor.specialty}
            </Badge>
            {test.result && (
              <div className="mt-1">
                <Badge className="bg-green-100 text-green-800">
                  Results Available
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Test Information</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm">
                <div><strong>Service:</strong> {test.appointment.service_type}</div>
                <div><strong>Test Date:</strong> {format(parseISO(test.appointment.appointment_date), 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </div>

          {test.result ? (
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <TestTube className="w-4 h-4 mr-2" />
                Test Results
              </h4>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <pre className="text-sm font-mono whitespace-pre-wrap">{test.result}</pre>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">Test results are not yet available. Please check back later or contact your doctor.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{appointment.service_type}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(parseISO(appointment.appointment_date), 'MMM dd, yyyy')}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(parseISO(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(appointment.status)}
            <div className="text-sm text-gray-500 mt-1">
              Dr. {appointment.doctor.name}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Doctor Information</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Name:</strong> Dr. {appointment.doctor.name}</div>
              <div><strong>Specialty:</strong> {appointment.doctor.specialty}</div>
              <div><strong>Type:</strong> {appointment.consultation_type}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Appointment Details</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Fee:</strong> ₱{appointment.fee?.toLocaleString()}</div>
              <div><strong>Status:</strong> {appointment.status}</div>
            </div>
          </div>
        </div>

        {appointment.reason && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Reason for Visit</h4>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{appointment.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">My Medical History</h1>
        <p className="opacity-90">View your medical records, prescriptions, and test results</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records">Medical Records ({medicalRecords.length})</TabsTrigger>
          <TabsTrigger value="lab-tests">Lab Tests ({labTests.length})</TabsTrigger>
          <TabsTrigger value="appointments">All Appointments ({appointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {medicalRecords.length > 0 ? (
            medicalRecords.map(record => (
              <MedicalRecordCard key={record.id} record={record} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No medical records found</p>
                <p className="text-sm text-gray-400 mt-2">Your medical records will appear here after completed consultations</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lab-tests" className="space-y-4">
          {labTests.length > 0 ? (
            labTests.map(test => (
              <LabTestCard key={test.id} test={test} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <TestTube className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No lab tests found</p>
                <p className="text-sm text-gray-400 mt-2">Your lab test results will appear here when available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No appointments found</p>
                <p className="text-sm text-gray-400 mt-2">Your appointment history will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientMedicalHistory;