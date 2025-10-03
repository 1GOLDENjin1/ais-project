import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  TestTube, 
  User, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface LabTest {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  test_type: string;
  test_category: 'blood' | 'urine' | 'imaging' | 'biopsy' | 'genetic' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  ordered_date: string;
  collected_date?: string;
  completed_date?: string;
  result?: string;
  reference_range?: string;
  notes?: string;
  priority: 'routine' | 'urgent' | 'stat';
  specimen_id?: string;
}

interface LabTestResult {
  parameter: string;
  value: string;
  reference_range: string;
  unit: string;
  status: 'normal' | 'abnormal' | 'critical';
}

const LabTestManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get initial data from navigation state
  const initialTest = location.state?.labTest;
  const testType = location.state?.testType || 'CBC';
  
  // States
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(initialTest || null);
  const [testResults, setTestResults] = useState<LabTestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sample data
  const sampleLabTests: LabTest[] = [
    {
      id: 'LAB001',
      patient_id: 'PAT001',
      patient_name: 'John Doe',
      doctor_id: 'DOC001',
      doctor_name: 'Dr. Sarah Wilson',
      test_type: 'Complete Blood Count (CBC)',
      test_category: 'blood',
      status: 'in_progress',
      ordered_date: '2025-09-28',
      collected_date: '2025-09-29',
      priority: 'routine',
      specimen_id: 'SPEC001',
      notes: 'Patient fasting for 12 hours'
    },
    {
      id: 'LAB002',
      patient_id: 'PAT002',
      patient_name: 'Jane Smith',
      doctor_id: 'DOC002',
      doctor_name: 'Dr. Michael Chen',
      test_type: 'Lipid Profile',
      test_category: 'blood',
      status: 'completed',
      ordered_date: '2025-09-27',
      collected_date: '2025-09-28',
      completed_date: '2025-09-30',
      priority: 'routine',
      specimen_id: 'SPEC002',
      result: 'Results available - see detailed report'
    },
    {
      id: 'LAB003',
      patient_id: 'PAT003',
      patient_name: 'Mike Johnson',
      doctor_id: 'DOC003',
      doctor_name: 'Dr. Lisa Rodriguez',
      test_type: 'X-Ray Chest',
      test_category: 'imaging',
      status: 'pending',
      ordered_date: '2025-09-30',
      priority: 'urgent',
      notes: 'Suspected pneumonia'
    }
  ];

  const testTemplates = {
    'Complete Blood Count (CBC)': [
      { parameter: 'WBC', value: '', reference_range: '4.0-11.0', unit: 'K/μL', status: 'normal' as const },
      { parameter: 'RBC', value: '', reference_range: '4.2-5.8', unit: 'M/μL', status: 'normal' as const },
      { parameter: 'Hemoglobin', value: '', reference_range: '12.0-16.0', unit: 'g/dL', status: 'normal' as const },
      { parameter: 'Hematocrit', value: '', reference_range: '36-46', unit: '%', status: 'normal' as const },
      { parameter: 'Platelets', value: '', reference_range: '150-450', unit: 'K/μL', status: 'normal' as const }
    ],
    'Lipid Profile': [
      { parameter: 'Total Cholesterol', value: '', reference_range: '<200', unit: 'mg/dL', status: 'normal' as const },
      { parameter: 'LDL', value: '', reference_range: '<100', unit: 'mg/dL', status: 'normal' as const },
      { parameter: 'HDL', value: '', reference_range: '>40', unit: 'mg/dL', status: 'normal' as const },
      { parameter: 'Triglycerides', value: '', reference_range: '<150', unit: 'mg/dL', status: 'normal' as const }
    ]
  };

  useEffect(() => {
    setLabTests(sampleLabTests);
    
    // If specific test type passed, create template
    if (testType && testTemplates[testType as keyof typeof testTemplates]) {
      setTestResults([...testTemplates[testType as keyof typeof testTemplates]]);
    }
  }, [testType]);

  const handleStatusUpdate = async (testId: string, newStatus: LabTest['status']) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedTests = labTests.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: newStatus,
              completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
            }
          : test
      );
      setLabTests(updatedTests);
      
      // Update selected test if it's the one being modified
      if (selectedTest?.id === testId) {
        const updatedTest = updatedTests.find(t => t.id === testId);
        if (updatedTest) setSelectedTest(updatedTest);
      }
      
      toast({
        title: "Status Updated",
        description: `Lab test status updated to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update test status.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResultUpdate = (index: number, field: keyof LabTestResult, value: string) => {
    const updatedResults = [...testResults];
    updatedResults[index] = { ...updatedResults[index], [field]: value };
    
    // Auto-determine status based on value and reference range
    if (field === 'value' && value.trim()) {
      const result = updatedResults[index];
      const numValue = parseFloat(value);
      const refRange = result.reference_range;
      
      if (refRange.includes('-')) {
        const [min, max] = refRange.split('-').map(n => parseFloat(n));
        if (numValue < min || numValue > max) {
          updatedResults[index].status = 'abnormal';
        } else {
          updatedResults[index].status = 'normal';
        }
      } else if (refRange.startsWith('<')) {
        const max = parseFloat(refRange.substring(1));
        updatedResults[index].status = numValue <= max ? 'normal' : 'abnormal';
      } else if (refRange.startsWith('>')) {
        const min = parseFloat(refRange.substring(1));
        updatedResults[index].status = numValue >= min ? 'normal' : 'abnormal';
      }
    }
    
    setTestResults(updatedResults);
  };

  const addTestResult = () => {
    setTestResults([
      ...testResults,
      { parameter: '', value: '', reference_range: '', unit: '', status: 'normal' }
    ]);
  };

  const removeTestResult = (index: number) => {
    setTestResults(testResults.filter((_, i) => i !== index));
  };

  const handleSaveResults = async () => {
    if (!selectedTest) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Compile results into a summary
      const resultSummary = testResults
        .filter(r => r.parameter && r.value)
        .map(r => `${r.parameter}: ${r.value} ${r.unit} (${r.status.toUpperCase()})`)
        .join(', ');
      
      // Update the test with results
      const updatedTests = labTests.map(test => 
        test.id === selectedTest.id 
          ? { 
              ...test, 
              status: 'completed' as const,
              result: resultSummary,
              completed_date: new Date().toISOString().split('T')[0]
            }
          : test
      );
      setLabTests(updatedTests);
      
      toast({
        title: "Results Saved",
        description: `Lab test results saved for ${selectedTest.patient_name}.`,
      });
      
      // Clear selection
      setSelectedTest(null);
      setTestResults([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save test results.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/staff-dashboard');
  };

  const getStatusColor = (status: LabTest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'abnormal':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'routine':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTests = labTests.filter(test => {
    const matchesSearch = test.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.specimen_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
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
                Lab Test Manager
              </h1>
              <p className="text-gray-600">
                Manage lab tests, enter results, and track completion
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Close
            </Button>
            {selectedTest && (
              <Button 
                onClick={handleSaveResults}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Results
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lab Tests List */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="h-5 w-5 text-primary" />
                  <span>Lab Tests</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search tests..."
                      className="pl-10"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTests.map(test => (
                  <div 
                    key={test.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTest?.id === test.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{test.patient_name}</h4>
                      <Badge className={getPriorityColor(test.priority)}>
                        {test.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{test.test_type}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(test.status)}>
                        {test.status.replace('_', ' ')}
                      </Badge>
                      <p className="text-xs text-gray-500">{test.ordered_date}</p>
                    </div>
                    {test.specimen_id && (
                      <p className="text-xs text-gray-400 mt-1">ID: {test.specimen_id}</p>
                    )}
                  </div>
                ))}
                
                {filteredTests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No lab tests found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Details and Results Entry */}
          <div className="lg:col-span-2">
            {selectedTest ? (
              <div className="space-y-6">
                {/* Test Information */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>Test Information</span>
                      </CardTitle>
                      <div className="flex space-x-2">
                        {selectedTest.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(selectedTest.id, 'in_progress')}
                            disabled={loading}
                            className="bg-blue-600 text-white"
                          >
                            Start Processing
                          </Button>
                        )}
                        {selectedTest.status === 'in_progress' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(selectedTest.id, 'completed')}
                            disabled={loading}
                            className="bg-green-600 text-white"
                          >
                            Mark Complete
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(selectedTest.id, 'cancelled')}
                          disabled={loading}
                          className="text-red-600"
                        >
                          Cancel Test
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Patient</Label>
                        <p className="font-semibold">{selectedTest.patient_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Test Type</Label>
                        <p>{selectedTest.test_type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Ordering Doctor</Label>
                        <p>{selectedTest.doctor_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Priority</Label>
                        <Badge className={getPriorityColor(selectedTest.priority)}>
                          {selectedTest.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Ordered Date</Label>
                        <p>{selectedTest.ordered_date}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <Badge className={getStatusColor(selectedTest.status)}>
                          {selectedTest.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {selectedTest.specimen_id && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Specimen ID</Label>
                          <p className="font-mono text-sm">{selectedTest.specimen_id}</p>
                        </div>
                      )}
                      {selectedTest.completed_date && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Completed Date</Label>
                          <p>{selectedTest.completed_date}</p>
                        </div>
                      )}
                    </div>
                    {selectedTest.notes && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-700">Notes</Label>
                        <p className="text-sm text-gray-600">{selectedTest.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Results Entry */}
                {selectedTest.status === 'in_progress' && (
                  <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span>Enter Results</span>
                        </CardTitle>
                        <Button 
                          size="sm"
                          onClick={addTestResult}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Parameter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {testResults.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No parameters added yet.</p>
                          <p className="text-sm">Click "Add Parameter" to start entering results.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {testResults.map((result, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <Label className="font-medium">Parameter {index + 1}</Label>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeTestResult(index)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                  <Label className="text-sm">Parameter</Label>
                                  <Input
                                    value={result.parameter}
                                    onChange={(e) => handleResultUpdate(index, 'parameter', e.target.value)}
                                    placeholder="e.g., WBC"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-sm">Value</Label>
                                  <Input
                                    value={result.value}
                                    onChange={(e) => handleResultUpdate(index, 'value', e.target.value)}
                                    placeholder="e.g., 7.2"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-sm">Reference Range</Label>
                                  <Input
                                    value={result.reference_range}
                                    onChange={(e) => handleResultUpdate(index, 'reference_range', e.target.value)}
                                    placeholder="e.g., 4.0-11.0"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-sm">Unit</Label>
                                  <Input
                                    value={result.unit}
                                    onChange={(e) => handleResultUpdate(index, 'unit', e.target.value)}
                                    placeholder="e.g., K/μL"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-sm">Status</Label>
                                  <select 
                                    value={result.status}
                                    onChange={(e) => handleResultUpdate(index, 'status', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="abnormal">Abnormal</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                </div>
                              </div>
                              
                              {result.parameter && result.value && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <Badge className={getResultStatusColor(result.status)}>
                                    {result.status.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {result.parameter}: {result.value} {result.unit}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Existing Results (Read-only) */}
                {selectedTest.status === 'completed' && selectedTest.result && (
                  <Card className="shadow-lg hover:shadow-xl transition-shadow bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Test Results</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-gray-800">{selectedTest.result}</p>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t">
                          <p className="text-sm text-gray-500">
                            Completed: {selectedTest.completed_date}
                          </p>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline">
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white h-96">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <TestTube className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Select a Lab Test</h3>
                    <p>Choose a test from the list to view details and enter results.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabTestManager;