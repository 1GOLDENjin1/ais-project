import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  FileText,
  Pill,
  TestTube,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  MessageSquare,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DoctorManagementService from '@/services/doctorDatabaseService';

interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  users?: {
    name: string;
    email: string;
    phone?: string;
  };
  recent_appointments?: Array<{
    id: string;
    appointment_date: string;
    status: string;
    reason?: string;
  }>;
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  diagnosis: string;
  treatment_plan?: string;
  prescription?: string;
  notes?: string;
  created_at: string;
  follow_up_date?: string;
}

const DoctorPatientManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);

  // New medical record form state
  const [newRecord, setNewRecord] = useState({
    diagnosis: '',
    treatment_plan: '',
    prescription: '',
    notes: '',
    follow_up_date: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await DoctorManagementService.getMyPatients(user.id);
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientRecords = async (patientId: string) => {
    if (!user?.id) return;
    
    try {
      setRecordsLoading(true);
      const records = await DoctorManagementService.getPatientMedicalRecords(patientId, user.id);
      setPatientRecords(records || []);
    } catch (error) {
      console.error('Error loading patient records:', error);
      toast({
        title: "Error",
        description: "Failed to load patient records.",
        variant: "destructive"
      });
    } finally {
      setRecordsLoading(false);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPatientDetailsOpen(true);
    await loadPatientRecords(patient.id);
  };

  const handleCreateMedicalRecord = async () => {
    if (!selectedPatient || !user?.id) return;

    try {
      // Create a temporary appointment ID for the medical record
      const appointmentId = 'temp-appointment-' + Date.now();
      
      await DoctorManagementService.createMedicalRecord(
        selectedPatient.id,
        user.id,
        appointmentId,
        newRecord.diagnosis,
        `Treatment: ${newRecord.treatment_plan || 'N/A'}\nPrescription: ${newRecord.prescription || 'N/A'}\nNotes: ${newRecord.notes || 'N/A'}`
      );
      
      toast({
        title: "Medical Record Created",
        description: "New medical record has been saved successfully.",
      });

      // Reload records
      await loadPatientRecords(selectedPatient.id);
      
      // Reset form
      setNewRecord({
        diagnosis: '',
        treatment_plan: '',
        prescription: '',
        notes: '',
        follow_up_date: ''
      });
      setIsNewRecordOpen(false);
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast({
        title: "Error",
        description: "Failed to create medical record.",
        variant: "destructive"
      });
    }
  };

  const getBloodTypeColor = (bloodType?: string) => {
    if (!bloodType) return 'bg-gray-100 text-gray-800';
    
    switch (bloodType.toUpperCase()) {
      case 'O+': case 'O-': return 'bg-red-100 text-red-800';
      case 'A+': case 'A-': return 'bg-blue-100 text-blue-800';
      case 'B+': case 'B-': return 'bg-green-100 text-green-800';
      case 'AB+': case 'AB-': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'Unknown';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.users?.name.toLowerCase().includes(searchLower) ||
      patient.users?.email.toLowerCase().includes(searchLower) ||
      patient.allergies?.toLowerCase().includes(searchLower) ||
      patient.medical_history?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.recent_appointments?.some(apt => apt.status === 'completed')).length}
                </p>
                <p className="text-sm text-gray-600">Active Patients</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {patients.filter(p => p.allergies && p.allergies !== '').length}
                </p>
                <p className="text-sm text-gray-600">Patients with Allergies</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Management */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, allergies, or medical history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Patient List */}
          <div className="space-y-4">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No patients found matching your criteria.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {patient.users?.name.split(' ').map(n => n[0]).join('') || 'P'}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{patient.users?.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {patient.users?.email}
                          </span>
                          {patient.users?.phone && (
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {patient.users?.phone}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Age: {calculateAge(patient.date_of_birth)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {patient.blood_type && (
                        <Badge className={getBloodTypeColor(patient.blood_type)}>
                          {patient.blood_type}
                        </Badge>
                      )}
                      
                      {patient.allergies && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Allergies
                        </Badge>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {patient.allergies && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                      <p className="text-red-800">
                        <strong>Allergies:</strong> {patient.allergies}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={isPatientDetailsOpen} onOpenChange={setIsPatientDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              Complete patient information and medical history
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="records">Medical Records</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-lg">{selectedPatient.users?.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Age</Label>
                        <p>{calculateAge(selectedPatient.date_of_birth)} years</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Gender</Label>
                        <p>{selectedPatient.gender || 'Not specified'}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Blood Type</Label>
                      {selectedPatient.blood_type ? (
                        <Badge className={getBloodTypeColor(selectedPatient.blood_type)}>
                          {selectedPatient.blood_type}
                        </Badge>
                      ) : (
                        <p>Not specified</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Contact Information</Label>
                      <div className="space-y-1 text-sm">
                        <p>Email: {selectedPatient.users?.email}</p>
                        {selectedPatient.users?.phone && <p>Phone: {selectedPatient.users?.phone}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Medical Information</h3>
                    
                    {selectedPatient.allergies && (
                      <div>
                        <Label className="text-sm font-medium">Allergies</Label>
                        <div className="p-3 bg-red-50 rounded border border-red-200">
                          <p className="text-red-800">{selectedPatient.allergies}</p>
                        </div>
                      </div>
                    )}

                    {selectedPatient.medical_history && (
                      <div>
                        <Label className="text-sm font-medium">Medical History</Label>
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-blue-800">{selectedPatient.medical_history}</p>
                        </div>
                      </div>
                    )}

                    {selectedPatient.emergency_contact_name && (
                      <div>
                        <Label className="text-sm font-medium">Emergency Contact</Label>
                        <div className="space-y-1 text-sm">
                          <p>Name: {selectedPatient.emergency_contact_name}</p>
                          {selectedPatient.emergency_contact_phone && (
                            <p>Phone: {selectedPatient.emergency_contact_phone}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="records" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Medical Records</h3>
                  <Button onClick={() => setIsNewRecordOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    New Record
                  </Button>
                </div>

                {recordsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading records...</p>
                  </div>
                ) : patientRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No medical records found for this patient.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{record.diagnosis}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(record.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {record.treatment_plan && (
                          <div className="mb-2">
                            <Label className="text-sm font-medium">Treatment Plan:</Label>
                            <p className="text-sm text-gray-700">{record.treatment_plan}</p>
                          </div>
                        )}
                        
                        {record.prescription && (
                          <div className="mb-2">
                            <Label className="text-sm font-medium">Prescription:</Label>
                            <p className="text-sm text-gray-700">{record.prescription}</p>
                          </div>
                        )}
                        
                        {record.notes && (
                          <div className="mb-2">
                            <Label className="text-sm font-medium">Notes:</Label>
                            <p className="text-sm text-gray-700">{record.notes}</p>
                          </div>
                        )}
                        
                        {record.follow_up_date && (
                          <div>
                            <Label className="text-sm font-medium">Follow-up Date:</Label>
                            <p className="text-sm text-blue-600">
                              {new Date(record.follow_up_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">Appointment History</h3>
                
                {selectedPatient.recent_appointments && selectedPatient.recent_appointments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPatient.recent_appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{appointment.reason || 'General Consultation'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {appointment.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No appointment history available.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* New Medical Record Dialog */}
      <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Medical Record</DialogTitle>
            <DialogDescription>
              Add a new medical record for {selectedPatient?.users?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Input
                id="diagnosis"
                value={newRecord.diagnosis}
                onChange={(e) => setNewRecord({...newRecord, diagnosis: e.target.value})}
                placeholder="Enter diagnosis"
                required
              />
            </div>

            <div>
              <Label htmlFor="treatment_plan">Treatment Plan</Label>
              <Textarea
                id="treatment_plan"
                value={newRecord.treatment_plan}
                onChange={(e) => setNewRecord({...newRecord, treatment_plan: e.target.value})}
                placeholder="Describe the treatment plan"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="prescription">Prescription</Label>
              <Textarea
                id="prescription"
                value={newRecord.prescription}
                onChange={(e) => setNewRecord({...newRecord, prescription: e.target.value})}
                placeholder="List medications and dosages"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={newRecord.notes}
                onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                placeholder="Any additional observations or notes"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="follow_up_date">Follow-up Date (Optional)</Label>
              <Input
                id="follow_up_date"
                type="date"
                value={newRecord.follow_up_date}
                onChange={(e) => setNewRecord({...newRecord, follow_up_date: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewRecordOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateMedicalRecord}
                disabled={!newRecord.diagnosis.trim()}
              >
                Create Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPatientManagement;