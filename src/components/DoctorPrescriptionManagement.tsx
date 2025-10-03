import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle
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

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  status: 'active' | 'completed' | 'discontinued';
  prescribed_date: string;
  start_date?: string;
  end_date?: string;
  refills_remaining?: number;
  total_refills?: number;
  patient?: {
    users?: {
      name: string;
      email: string;
    };
    allergies?: string;
  };
}

const DoctorPrescriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewPrescriptionOpen, setIsNewPrescriptionOpen] = useState(false);
  const [isPrescriptionDetailsOpen, setIsPrescriptionDetailsOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // New prescription form state
  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    refills_total: 0,
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadPrescriptions();
    loadPatients();
  }, []);

  const loadPrescriptions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // For demo purposes, create sample prescriptions
      const samplePrescriptions: Prescription[] = [
        {
          id: 'presc-1',
          patient_id: 'patient-1',
          doctor_id: user.id,
          medication_name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '7 days',
          instructions: 'Take with food to reduce stomach upset',
          status: 'active',
          prescribed_date: new Date().toISOString(),
          refills_remaining: 2,
          total_refills: 2,
          patient: {
            users: { name: 'John Doe', email: 'john@example.com' },
            allergies: 'Penicillin'
          }
        },
        {
          id: 'presc-2',
          patient_id: 'patient-2',
          doctor_id: user.id,
          medication_name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take in the morning with water',
          status: 'active',
          prescribed_date: new Date(Date.now() - 86400000).toISOString(),
          refills_remaining: 5,
          total_refills: 6,
          patient: {
            users: { name: 'Jane Smith', email: 'jane@example.com' }
          }
        },
        {
          id: 'presc-3',
          patient_id: 'patient-3',
          doctor_id: user.id,
          medication_name: 'Metformin',
          dosage: '850mg',
          frequency: 'Twice daily',
          duration: '90 days',
          instructions: 'Take with breakfast and dinner',
          status: 'completed',
          prescribed_date: new Date(Date.now() - 172800000).toISOString(),
          refills_remaining: 0,
          total_refills: 3,
          patient: {
            users: { name: 'Mike Johnson', email: 'mike@example.com' }
          }
        }
      ];
      
      setPrescriptions(samplePrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    if (!user?.id) return;

    try {
      // For demo purposes, create sample patients
      const samplePatients = [
        { id: 'patient-1', users: { name: 'John Doe' } },
        { id: 'patient-2', users: { name: 'Jane Smith' } },
        { id: 'patient-3', users: { name: 'Mike Johnson' } },
        { id: 'patient-4', users: { name: 'Sarah Wilson' } }
      ];
      setPatients(samplePatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleCreatePrescription = async () => {
    if (!user?.id || !newPrescription.patient_id || !newPrescription.medication_name) return;

    try {
      // For demo purposes, create prescription in local state
      const newPrescriptionData: Prescription = {
        id: 'presc-' + Date.now(),
        patient_id: newPrescription.patient_id,
        doctor_id: user.id,
        medication_name: newPrescription.medication_name,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        duration: newPrescription.duration,
        instructions: newPrescription.instructions,
        status: 'active',
        prescribed_date: new Date().toISOString(),
        start_date: newPrescription.start_date,
        refills_remaining: newPrescription.refills_total,
        total_refills: newPrescription.refills_total,
        patient: {
          users: {
            name: patients.find(p => p.id === newPrescription.patient_id)?.users?.name || 'Unknown',
            email: 'patient@example.com'
          }
        }
      };

      setPrescriptions(prev => [newPrescriptionData, ...prev]);

      toast({
        title: "Prescription Created",
        description: "New prescription has been added successfully.",
      });
      setIsNewPrescriptionOpen(false);
      
      // Reset form
      setNewPrescription({
        patient_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        refills_total: 0,
        start_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription.",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePrescriptionStatus = async (prescriptionId: string, newStatus: string) => {
    try {
      // For demo purposes, just update the local state
      setPrescriptions(prev => 
        prev.map(prescription => 
          prescription.id === prescriptionId 
            ? { ...prescription, status: newStatus as any }
            : prescription
        )
      );

      toast({
        title: "Status Updated",
        description: `Prescription marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating prescription status:', error);
      toast({
        title: "Error",
        description: "Failed to update prescription status.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Pill className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'discontinued': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.patient?.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.dosage?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const completedPrescriptions = prescriptions.filter(p => p.status === 'completed');
  const discontinuedPrescriptions = prescriptions.filter(p => p.status === 'discontinued');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{activePrescriptions.length}</p>
                <p className="text-sm text-gray-600">Active Prescriptions</p>
              </div>
              <Pill className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{completedPrescriptions.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{discontinuedPrescriptions.length}</p>
                <p className="text-sm text-gray-600">Discontinued</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{prescriptions.length}</p>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescription Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Prescription Management</CardTitle>
          <Button onClick={() => setIsNewPrescriptionOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prescription
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by medication, patient name, or dosage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prescriptions List */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="patient">By Patient</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4 mt-6">
              {filteredPrescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No prescriptions found matching your criteria.</p>
                </div>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white">
                          <Pill className="h-6 w-6" />
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">{prescription.medication_name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {prescription.patient?.users?.name || 'Unknown Patient'}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(prescription.prescribed_date).toLocaleDateString()}
                            </span>
                            {prescription.dosage && (
                              <span>
                                <strong>Dosage:</strong> {prescription.dosage}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(prescription.status)}>
                          {getStatusIcon(prescription.status)}
                          <span className="ml-1">{prescription.status.toUpperCase()}</span>
                        </Badge>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPrescription(prescription);
                              setIsPrescriptionDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {prescription.status === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePrescriptionStatus(prescription.id, 'completed')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Complete
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePrescriptionStatus(prescription.id, 'discontinued')}
                                className="text-red-600 hover:text-red-700"
                              >
                                Discontinue
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {prescription.frequency && (
                        <div>
                          <span className="font-medium">Frequency:</span> {prescription.frequency}
                        </div>
                      )}
                      {prescription.duration && (
                        <div>
                          <span className="font-medium">Duration:</span> {prescription.duration}
                        </div>
                      )}
                      {prescription.refills_remaining !== undefined && (
                        <div>
                          <span className="font-medium">Refills:</span> {prescription.refills_remaining}/{prescription.total_refills || 0}
                        </div>
                      )}
                      {prescription.end_date && (
                        <div>
                          <span className="font-medium">End Date:</span> {new Date(prescription.end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {prescription.instructions && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <p className="text-blue-800">
                          <strong>Instructions:</strong> {prescription.instructions}
                        </p>
                      </div>
                    )}

                    {prescription.patient?.allergies && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                        <p className="text-red-800">
                          <strong>Patient Allergies:</strong> {prescription.patient.allergies}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="patient" className="mt-6">
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Patient grouping view coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Prescription Dialog */}
      <Dialog open={isNewPrescriptionOpen} onOpenChange={setIsNewPrescriptionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Prescription</DialogTitle>
            <DialogDescription>
              Add a new prescription for a patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="patient">Select Patient *</Label>
              <Select 
                value={newPrescription.patient_id} 
                onValueChange={(value) => setNewPrescription({...newPrescription, patient_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.users?.name || `Patient ${patient.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="medication_name">Medication Name *</Label>
              <Input
                id="medication_name"
                value={newPrescription.medication_name}
                onChange={(e) => setNewPrescription({...newPrescription, medication_name: e.target.value})}
                placeholder="Enter medication name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={newPrescription.dosage}
                  onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                  placeholder="e.g., 500mg"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                  placeholder="e.g., Twice daily"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={newPrescription.duration}
                  onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                  placeholder="e.g., 7 days"
                />
              </div>
              <div>
                <Label htmlFor="refills">Total Refills</Label>
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  value={newPrescription.refills_total}
                  onChange={(e) => setNewPrescription({...newPrescription, refills_total: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={newPrescription.start_date}
                onChange={(e) => setNewPrescription({...newPrescription, start_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={newPrescription.instructions}
                onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                placeholder="Enter any special instructions for the patient"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewPrescriptionOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePrescription}
                disabled={!newPrescription.patient_id || !newPrescription.medication_name.trim()}
              >
                Create Prescription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Details Dialog */}
      <Dialog open={isPrescriptionDetailsOpen} onOpenChange={setIsPrescriptionDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              Complete prescription information
            </DialogDescription>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <p className="text-lg">{selectedPrescription.patient?.users?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedPrescription.status)}>
                    {getStatusIcon(selectedPrescription.status)}
                    <span className="ml-1">{selectedPrescription.status.toUpperCase()}</span>
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Medication</Label>
                <p className="text-xl font-semibold">{selectedPrescription.medication_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Dosage</Label>
                  <p>{selectedPrescription.dosage || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Frequency</Label>
                  <p>{selectedPrescription.frequency || 'Not specified'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p>{selectedPrescription.duration || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Refills</Label>
                  <p>{selectedPrescription.refills_remaining || 0} / {selectedPrescription.total_refills || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Prescribed Date</Label>
                  <p>{new Date(selectedPrescription.prescribed_date).toLocaleDateString()}</p>
                </div>
                {selectedPrescription.end_date && (
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p>{new Date(selectedPrescription.end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {selectedPrescription.instructions && (
                <div>
                  <Label className="text-sm font-medium">Instructions</Label>
                  <p className="p-3 bg-blue-50 rounded border border-blue-200 text-blue-800">
                    {selectedPrescription.instructions}
                  </p>
                </div>
              )}

              {selectedPrescription.patient?.allergies && (
                <div>
                  <Label className="text-sm font-medium">Patient Allergies</Label>
                  <p className="p-3 bg-red-50 rounded border border-red-200 text-red-800">
                    {selectedPrescription.patient.allergies}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPrescriptionManagement;