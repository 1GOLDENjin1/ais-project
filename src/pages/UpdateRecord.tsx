import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  User, 
  Calendar, 
  Stethoscope,
  Pill,
  TestTube,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MedicalRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  appointment_id: string;
  diagnosis: string;
  notes: string;
  created_at: string;
  prescriptions?: string[];
  lab_tests?: string[];
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface LabTest {
  id: string;
  test_name: string;
  status: 'pending' | 'completed' | 'cancelled';
  ordered_date: string;
  result?: string;
  notes?: string;
}

const UpdateRecord: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get record data from navigation state
  const recordData = location.state?.record as MedicalRecord | undefined;
  
  // Form states
  const [diagnosis, setDiagnosis] = useState(recordData?.diagnosis || '');
  const [notes, setNotes] = useState(recordData?.notes || '');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!recordData) {
      toast({
        title: "No Record Selected",
        description: "Please select a record to update.",
        variant: "destructive"
      });
      navigate('/staff-dashboard');
      return;
    }

    // Initialize prescriptions from record data
    if (recordData.prescriptions && recordData.prescriptions.length > 0) {
      const initialPrescriptions: Prescription[] = recordData.prescriptions.map((prescription, index) => ({
        id: `pres_${index}`,
        medication: prescription.split(' ')[0] || '',
        dosage: prescription.split(' ')[1] || '',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: prescription
      }));
      setPrescriptions(initialPrescriptions);
    }

    // Initialize lab tests from record data
    if (recordData.lab_tests && recordData.lab_tests.length > 0) {
      const initialLabTests: LabTest[] = recordData.lab_tests.map((test, index) => ({
        id: `lab_${index}`,
        test_name: test,
        status: 'pending',
        ordered_date: new Date().toISOString().split('T')[0],
        notes: ''
      }));
      setLabTests(initialLabTests);
    }
  }, [recordData, navigate, toast]);

  const addPrescription = () => {
    const newPrescription: Prescription = {
      id: `pres_${Date.now()}`,
      medication: '',
      dosage: '',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: ''
    };
    setPrescriptions([...prescriptions, newPrescription]);
  };

  const removePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const updatePrescription = (id: string, field: keyof Prescription, value: string) => {
    setPrescriptions(prescriptions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addLabTest = () => {
    const newLabTest: LabTest = {
      id: `lab_${Date.now()}`,
      test_name: '',
      status: 'pending',
      ordered_date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    setLabTests([...labTests, newLabTest]);
  };

  const removeLabTest = (id: string) => {
    setLabTests(labTests.filter(t => t.id !== id));
  };

  const updateLabTest = (id: string, field: keyof LabTest, value: string) => {
    setLabTests(labTests.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }

    if (!notes.trim()) {
      newErrors.notes = 'Clinical notes are required';
    }

    // Validate prescriptions
    prescriptions.forEach((prescription, index) => {
      if (!prescription.medication.trim()) {
        newErrors[`prescription_${index}_medication`] = 'Medication name is required';
      }
      if (!prescription.dosage.trim()) {
        newErrors[`prescription_${index}_dosage`] = 'Dosage is required';
      }
    });

    // Validate lab tests
    labTests.forEach((test, index) => {
      if (!test.test_name.trim()) {
        newErrors[`labtest_${index}_name`] = 'Test name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call to update medical record
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Here you would typically make API calls to:
      // 1. Update the medical record
      // 2. Update/create prescriptions
      // 3. Update/create lab test orders

      toast({
        title: "Record Updated",
        description: `Medical record for ${recordData?.patient_name} has been successfully updated.`,
      });

      navigate('/staff-dashboard', { 
        state: { 
          tab: 'records',
          message: 'Record updated successfully' 
        }
      });
    } catch (error) {
      toast({
        title: "Error Updating Record",
        description: "Failed to update the medical record. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/staff-dashboard', { state: { tab: 'records' } });
  };

  if (!recordData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Record Selected</h2>
            <p className="text-gray-600 mb-4">Please select a record to update from the dashboard.</p>
            <Button onClick={() => navigate('/staff-dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Update Medical Record
              </h1>
              <p className="text-gray-600">Update record for {recordData.patient_name}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Patient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Patient Name</Label>
                  <p className="text-lg font-semibold">{recordData.patient_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Record ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{recordData.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Appointment ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{recordData.appointment_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Attending Doctor</Label>
                  <p className="text-sm">{recordData.doctor_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Record Date</Label>
                  <p className="text-sm">{new Date(recordData.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diagnosis and Notes */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <span>Clinical Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="diagnosis">Primary Diagnosis *</Label>
                  <Input
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Enter primary diagnosis"
                    className={errors.diagnosis ? 'border-red-500' : ''}
                  />
                  {errors.diagnosis && (
                    <p className="text-red-500 text-sm mt-1">{errors.diagnosis}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="notes">Clinical Notes *</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter detailed clinical notes, observations, and treatment plan"
                    rows={4}
                    className={errors.notes ? 'border-red-500' : ''}
                  />
                  {errors.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Pill className="h-5 w-5 text-primary" />
                    <span>Prescriptions</span>
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={addPrescription}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prescription
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {prescriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No prescriptions added yet.</p>
                    <p className="text-sm">Click "Add Prescription" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription, index) => (
                      <div key={prescription.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary">Prescription {index + 1}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removePrescription(prescription.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Medication *</Label>
                            <Input
                              value={prescription.medication}
                              onChange={(e) => updatePrescription(prescription.id, 'medication', e.target.value)}
                              placeholder="e.g., Lisinopril"
                              className={errors[`prescription_${index}_medication`] ? 'border-red-500' : ''}
                            />
                            {errors[`prescription_${index}_medication`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`prescription_${index}_medication`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-sm">Dosage *</Label>
                            <Input
                              value={prescription.dosage}
                              onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                              placeholder="e.g., 10mg"
                              className={errors[`prescription_${index}_dosage`] ? 'border-red-500' : ''}
                            />
                            {errors[`prescription_${index}_dosage`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`prescription_${index}_dosage`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-sm">Frequency</Label>
                            <select 
                              value={prescription.frequency}
                              onChange={(e) => updatePrescription(prescription.id, 'frequency', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="Once daily">Once daily</option>
                              <option value="Twice daily">Twice daily</option>
                              <option value="Three times daily">Three times daily</option>
                              <option value="Four times daily">Four times daily</option>
                              <option value="As needed">As needed</option>
                              <option value="Every other day">Every other day</option>
                            </select>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Duration</Label>
                            <Input
                              value={prescription.duration}
                              onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                              placeholder="e.g., 30 days"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label className="text-sm">Special Instructions</Label>
                          <Textarea
                            value={prescription.instructions}
                            onChange={(e) => updatePrescription(prescription.id, 'instructions', e.target.value)}
                            placeholder="Additional instructions for the patient"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lab Tests */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <TestTube className="h-5 w-5 text-primary" />
                    <span>Lab Tests</span>
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={addLabTest}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lab Test
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {labTests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No lab tests ordered yet.</p>
                    <p className="text-sm">Click "Add Lab Test" to order tests.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {labTests.map((test, index) => (
                      <div key={test.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary">Lab Test {index + 1}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeLabTest(test.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Test Name *</Label>
                            <Input
                              value={test.test_name}
                              onChange={(e) => updateLabTest(test.id, 'test_name', e.target.value)}
                              placeholder="e.g., Complete Blood Count"
                              className={errors[`labtest_${index}_name`] ? 'border-red-500' : ''}
                            />
                            {errors[`labtest_${index}_name`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`labtest_${index}_name`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-sm">Status</Label>
                            <select 
                              value={test.status}
                              onChange={(e) => updateLabTest(test.id, 'status', e.target.value as 'pending' | 'completed' | 'cancelled')}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Ordered Date</Label>
                            <Input
                              type="date"
                              value={test.ordered_date}
                              onChange={(e) => updateLabTest(test.id, 'ordered_date', e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Result</Label>
                            <Input
                              value={test.result || ''}
                              onChange={(e) => updateLabTest(test.id, 'result', e.target.value)}
                              placeholder="Test result (if available)"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label className="text-sm">Notes</Label>
                          <Textarea
                            value={test.notes || ''}
                            onChange={(e) => updateLabTest(test.id, 'notes', e.target.value)}
                            placeholder="Additional notes about this test"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateRecord;