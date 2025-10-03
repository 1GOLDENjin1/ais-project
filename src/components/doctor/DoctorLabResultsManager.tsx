import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TestTube, 
  Plus, 
  Save, 
  User, 
  Calendar, 
  Search,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

// Simple toast replacement
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  service_type: string;
  patient: Patient;
}

interface LabTest {
  id: string;
  test_type: string;
  result: string;
  created_at: string;
  appointment: Appointment;
  patient: Patient;
}

const DoctorLabResultsManager: React.FC = () => {
  const { user } = useAuth();
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [newTest, setNewTest] = useState({
    appointment_id: '',
    test_type: '',
    result: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get doctor ID first
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (doctorError) throw doctorError;

      // Fetch existing lab tests
      const { data: testsData, error: testsError } = await supabase
        .from('lab_tests')
        .select(`
          id,
          test_type,
          result,
          created_at,
          appointment:appointments!inner(
            id,
            appointment_date,
            service_type,
            patient:patients!inner(
              id,
              user:users!inner(name, email)
            )
          )
        `)
        .eq('doctor_id', doctorData.id)
        .order('created_at', { ascending: false });

      if (testsError) throw testsError;

      const formattedTests = testsData.map((test: any) => ({
        ...test,
        appointment: {
          ...test.appointment,
          patient: {
            id: test.appointment.patient.id,
            name: test.appointment.patient.user.name,
            email: test.appointment.patient.user.email
          }
        },
        patient: {
          id: test.appointment.patient.id,
          name: test.appointment.patient.user.name,
          email: test.appointment.patient.user.email
        }
      }));

      setLabTests(formattedTests);

      // Fetch completed appointments for adding new tests
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          service_type,
          patient:patients!inner(
            id,
            user:users!inner(name, email)
          )
        `)
        .eq('doctor_id', doctorData.id)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      const formattedAppointments = appointmentsData.map((apt: any) => ({
        ...apt,
        patient: {
          id: apt.patient.id,
          name: apt.patient.user.name,
          email: apt.patient.user.email
        }
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addLabTest = async () => {
    if (!newTest.appointment_id || !newTest.test_type.trim() || !newTest.result.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      // Get doctor and patient IDs
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (doctorError) throw doctorError;

      const selectedAppointment = appointments.find(apt => apt.id === newTest.appointment_id);
      if (!selectedAppointment) {
        toast.error('Invalid appointment selected');
        return;
      }

      const { error } = await supabase
        .from('lab_tests')
        .insert({
          patient_id: selectedAppointment.patient.id,
          doctor_id: doctorData.id,
          appointment_id: newTest.appointment_id,
          test_type: newTest.test_type,
          result: newTest.result
        });

      if (error) throw error;

      toast.success('Lab test result added successfully!');
      setNewTest({ appointment_id: '', test_type: '', result: '' });
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error adding lab test:', error);
      toast.error('Failed to add lab test result');
    } finally {
      setSaving(false);
    }
  };

  const updateLabTest = async (testId: string, updatedResult: string) => {
    try {
      const { error } = await supabase
        .from('lab_tests')
        .update({ result: updatedResult })
        .eq('id', testId);

      if (error) throw error;

      toast.success('Lab test result updated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error updating lab test:', error);
      toast.error('Failed to update lab test result');
    }
  };

  const filteredTests = labTests.filter(test =>
    test.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.appointment.service_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const LabTestCard: React.FC<{ test: LabTest }> = ({ test }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editResult, setEditResult] = useState(test.result);

    const handleUpdate = async () => {
      await updateLabTest(test.id, editResult);
      setIsEditing(false);
    };

    return (
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
                    <User className="w-4 h-4 mr-1" />
                    {test.patient.name}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(parseISO(test.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Results Available
              </Badge>
              <div className="text-sm text-gray-500 mt-1">
                {test.appointment.service_type}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Patient Information</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm">
                  <div><strong>Name:</strong> {test.patient.name}</div>
                  <div><strong>Email:</strong> {test.patient.email}</div>
                  <div><strong>Test Date:</strong> {format(parseISO(test.appointment.appointment_date), 'MMMM dd, yyyy')}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Results
                </h4>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Results
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editResult}
                    onChange={(e) => setEditResult(e.target.value)}
                    rows={4}
                    placeholder="Enter detailed test results..."
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleUpdate}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditResult(test.result);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{test.result}</pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Lab Results Management</h1>
        <p className="opacity-90">Add and manage laboratory test results for your patients</p>
      </div>

      {/* Add New Lab Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add New Lab Test Result</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointment">Select Appointment *</Label>
              <Select
                value={newTest.appointment_id}
                onValueChange={(value) => setNewTest(prev => ({ ...prev, appointment_id: value }))}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Choose an appointment..." />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map(apt => (
                    <SelectItem key={apt.id} value={apt.id}>
                      {apt.patient.name} - {apt.service_type} ({format(parseISO(apt.appointment_date), 'MMM dd, yyyy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test_type">Test Type *</Label>
              <Input
                id="test_type"
                value={newTest.test_type}
                onChange={(e) => setNewTest(prev => ({ ...prev, test_type: e.target.value }))}
                placeholder="e.g., Complete Blood Count, Lipid Profile"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="result">Test Results *</Label>
            <Textarea
              id="result"
              value={newTest.result}
              onChange={(e) => setNewTest(prev => ({ ...prev, result: e.target.value }))}
              placeholder="Enter detailed test results, values, interpretations..."
              rows={4}
              className="mt-1"
            />
          </div>

          <Button 
            onClick={addLabTest}
            disabled={saving || !newTest.appointment_id || !newTest.test_type.trim() || !newTest.result.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Lab Test Result
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by test type, patient name, or service..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lab Tests List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Lab Test Results ({filteredTests.length})</h2>
        
        {filteredTests.length > 0 ? (
          filteredTests.map(test => (
            <LabTestCard key={test.id} test={test} />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              {searchTerm ? (
                <>
                  <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No lab tests found matching "{searchTerm}"</p>
                </>
              ) : (
                <>
                  <TestTube className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No lab test results yet</p>
                  <p className="text-sm text-gray-400 mt-2">Lab test results will appear here once added</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorLabResultsManager;