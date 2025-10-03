import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  FileText, 
  Users, 
  Calendar,
  Database,
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  Trash2,
  Eye,
  Printer,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  FilePlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DataReport {
  id: string;
  name: string;
  description: string;
  type: 'patients' | 'appointments' | 'payments' | 'treatments' | 'custom';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  date_range: {
    start: string;
    end: string;
  };
  record_count?: number;
  created_at: string;
  size?: string;
  status: 'generating' | 'ready' | 'error';
}

interface ExportForm {
  data_type: 'patients' | 'appointments' | 'payments' | 'treatments' | 'custom';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  date_range_type: 'all' | 'last_month' | 'last_quarter' | 'last_year' | 'custom';
  start_date?: string;
  end_date?: string;
  include_fields: string[];
  filters: {
    status?: string;
    department?: string;
    doctor_id?: string;
  };
}

interface ImportJob {
  id: string;
  filename: string;
  type: 'patients' | 'appointments' | 'treatments';
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  total_records?: number;
  processed_records?: number;
  errors?: string[];
  created_at: string;
}

const DataManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get initial data from navigation state
  const initialData = location.state;
  
  // States
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reports' | 'analytics'>('export');
  const [exportForm, setExportForm] = useState<ExportForm>({
    data_type: 'patients',
    format: 'csv',
    date_range_type: 'last_month',
    include_fields: [],
    filters: {}
  });
  
  const [reports, setReports] = useState<DataReport[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Available fields for different data types
  const dataTypeFields: { [key: string]: string[] } = {
    patients: [
      'name', 'email', 'phone', 'address', 'date_of_birth', 
      'gender', 'emergency_contact', 'medical_history', 'allergies',
      'insurance_info', 'created_at', 'updated_at'
    ],
    appointments: [
      'patient_name', 'doctor_name', 'appointment_date', 'appointment_time',
      'status', 'type', 'duration', 'notes', 'payment_status',
      'created_at', 'updated_at'
    ],
    payments: [
      'patient_name', 'amount', 'payment_date', 'payment_method',
      'status', 'invoice_number', 'description', 'created_at'
    ],
    treatments: [
      'patient_name', 'doctor_name', 'treatment_type', 'treatment_date',
      'diagnosis', 'prescription', 'notes', 'follow_up_date'
    ]
  };

  // Sample data
  const sampleReports: DataReport[] = [
    {
      id: 'rep1',
      name: 'Patient Database Export',
      description: 'Complete patient information including contact details and medical history',
      type: 'patients',
      format: 'excel',
      date_range: {
        start: '2025-01-01',
        end: '2025-09-30'
      },
      record_count: 1247,
      created_at: '2025-09-30T10:30:00',
      size: '2.3 MB',
      status: 'ready'
    },
    {
      id: 'rep2',
      name: 'September Appointments',
      description: 'All appointments scheduled in September 2025',
      type: 'appointments',
      format: 'csv',
      date_range: {
        start: '2025-09-01',
        end: '2025-09-30'
      },
      record_count: 856,
      created_at: '2025-09-30T09:15:00',
      size: '1.1 MB',
      status: 'ready'
    },
    {
      id: 'rep3',
      name: 'Payment Summary Q3',
      description: 'Payment transactions for third quarter 2025',
      type: 'payments',
      format: 'pdf',
      date_range: {
        start: '2025-07-01',
        end: '2025-09-30'
      },
      record_count: 2341,
      created_at: '2025-09-30T08:45:00',
      size: '5.7 MB',
      status: 'generating'
    }
  ];

  const sampleImportJobs: ImportJob[] = [
    {
      id: 'imp1',
      filename: 'new_patients_batch_2025.csv',
      type: 'patients',
      status: 'completed',
      progress: 100,
      total_records: 150,
      processed_records: 150,
      created_at: '2025-09-29T14:20:00'
    },
    {
      id: 'imp2',
      filename: 'appointment_updates.xlsx',
      type: 'appointments',
      status: 'processing',
      progress: 65,
      total_records: 200,
      processed_records: 130,
      created_at: '2025-09-30T11:10:00'
    },
    {
      id: 'imp3',
      filename: 'treatment_records.csv',
      type: 'treatments',
      status: 'error',
      progress: 25,
      total_records: 75,
      processed_records: 19,
      errors: ['Invalid date format in row 20', 'Missing doctor ID in row 35'],
      created_at: '2025-09-30T10:05:00'
    }
  ];

  useEffect(() => {
    setReports(sampleReports);
    setImportJobs(sampleImportJobs);
    
    // Pre-populate form if data provided
    if (initialData?.type) {
      setExportForm(prev => ({
        ...prev,
        data_type: initialData.type
      }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof ExportForm, value: any) => {
    setExportForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleField = (field: string) => {
    const currentFields = exportForm.include_fields;
    if (currentFields.includes(field)) {
      handleInputChange('include_fields', currentFields.filter(f => f !== field));
    } else {
      handleInputChange('include_fields', [...currentFields, field]);
    }
  };

  const validateExportForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (exportForm.include_fields.length === 0) {
      newErrors.include_fields = 'At least one field must be selected';
    }

    if (exportForm.date_range_type === 'custom') {
      if (!exportForm.start_date) {
        newErrors.start_date = 'Start date is required';
      }
      if (!exportForm.end_date) {
        newErrors.end_date = 'End date is required';
      }
      if (exportForm.start_date && exportForm.end_date && exportForm.start_date > exportForm.end_date) {
        newErrors.date_range = 'Start date must be before end date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExportData = async () => {
    if (!validateExportForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before exporting.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const reportName = `${exportForm.data_type}_export_${new Date().toISOString().split('T')[0]}`;
      
      toast({
        title: "Export Started",
        description: `Data export "${reportName}" has been queued for processing.`,
      });

      // Add new report to list
      const newReport: DataReport = {
        id: `rep_${Date.now()}`,
        name: reportName,
        description: `${exportForm.data_type} data export with ${exportForm.include_fields.length} fields`,
        type: exportForm.data_type,
        format: exportForm.format,
        date_range: {
          start: exportForm.start_date || '2025-01-01',
          end: exportForm.end_date || new Date().toISOString().split('T')[0]
        },
        created_at: new Date().toISOString(),
        status: 'generating'
      };

      setReports(prev => [newReport, ...prev]);

      // Reset form
      setExportForm({
        data_type: 'patients',
        format: 'csv',
        date_range_type: 'last_month',
        include_fields: [],
        filters: {}
      });
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to start data export. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate file upload and processing
      const newJob: ImportJob = {
        id: `imp_${Date.now()}`,
        filename: selectedFile.name,
        type: 'patients', // This would be determined by file analysis
        status: 'uploading',
        progress: 0,
        created_at: new Date().toISOString()
      };

      setImportJobs(prev => [newJob, ...prev]);

      // Simulate progress updates
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setImportJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, progress: i, status: i === 100 ? 'completed' : 'processing' }
            : job
        ));
      }

      toast({
        title: "Import Completed",
        description: `File "${selectedFile.name}" has been imported successfully.`,
      });

      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to import file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report && report.status === 'ready') {
      toast({
        title: "Download Started",
        description: `Downloading ${report.name}.${report.format}`,
      });
      // In real implementation, this would trigger file download
    }
  };

  const handleDeleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast({
      title: "Report Deleted",
      description: "The report has been deleted successfully.",
    });
  };

  const handleCancel = () => {
    navigate('/staff-dashboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
      case 'processing':
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'patients':
        return 'bg-purple-100 text-purple-800';
      case 'appointments':
        return 'bg-blue-100 text-blue-800';
      case 'payments':
        return 'bg-green-100 text-green-800';
      case 'treatments':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'json':
        return <Database className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                Data Manager
              </h1>
              <p className="text-gray-600">
                Export, import, and manage healthcare data efficiently
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
          <Button
            variant={activeTab === 'export' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('export')}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant={activeTab === 'import' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('import')}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('reports')}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Reports ({reports.length})
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analytics')}
            className="flex-1"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Export Data Tab */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-5 w-5 text-primary" />
                    <span>Export Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Data Type and Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data_type">Data Type</Label>
                      <select 
                        id="data_type"
                        value={exportForm.data_type}
                        onChange={(e) => {
                          handleInputChange('data_type', e.target.value);
                          handleInputChange('include_fields', []); // Reset fields when type changes
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="patients">👤 Patients</option>
                        <option value="appointments">📅 Appointments</option>
                        <option value="payments">💰 Payments</option>
                        <option value="treatments">🏥 Treatments</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="format">Export Format</Label>
                      <select 
                        id="format"
                        value={exportForm.format}
                        onChange={(e) => handleInputChange('format', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="csv">📄 CSV (Comma Separated)</option>
                        <option value="excel">📊 Excel Spreadsheet</option>
                        <option value="pdf">📋 PDF Report</option>
                        <option value="json">🗃️ JSON Data</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {[
                        { value: 'all', label: 'All Time' },
                        { value: 'last_month', label: 'Last Month' },
                        { value: 'last_quarter', label: 'Last Quarter' },
                        { value: 'custom', label: 'Custom Range' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={exportForm.date_range_type === option.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleInputChange('date_range_type', option.value)}
                          className="w-full"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>

                    {exportForm.date_range_type === 'custom' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="start_date">Start Date</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={exportForm.start_date || ''}
                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                            className={errors.start_date ? 'border-red-500' : ''}
                          />
                          {errors.start_date && (
                            <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="end_date">End Date</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={exportForm.end_date || ''}
                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                            className={errors.end_date ? 'border-red-500' : ''}
                          />
                          {errors.end_date && (
                            <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {errors.date_range && (
                      <p className="text-red-500 text-sm mt-1">{errors.date_range}</p>
                    )}
                  </div>

                  {/* Field Selection */}
                  <div>
                    <Label>Select Fields to Export *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                      {dataTypeFields[exportForm.data_type]?.map(field => (
                        <div key={field} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={field}
                            checked={exportForm.include_fields.includes(field)}
                            onChange={() => toggleField(field)}
                            className="rounded"
                          />
                          <Label htmlFor={field} className="text-sm cursor-pointer">
                            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.include_fields && (
                      <p className="text-red-500 text-sm mt-1">{errors.include_fields}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {exportForm.include_fields.length} field(s)
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleExportData}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Summary */}
            <div>
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>Export Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Data Type</h4>
                      <p className="text-blue-700 capitalize">{exportForm.data_type}</p>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900">Format</h4>
                      <p className="text-purple-700 uppercase">{exportForm.format}</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Fields</h4>
                      <p className="text-green-700">{exportForm.include_fields.length} selected</p>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900">Date Range</h4>
                      <p className="text-orange-700 capitalize">
                        {exportForm.date_range_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Import Data Tab */}
        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <span>Import Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file_upload">Select File</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <input
                          id="file_upload"
                          type="file"
                          accept=".csv,.xlsx,.xls,.json"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <Label
                          htmlFor="file_upload"
                          className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Choose File
                        </Label>
                        <p className="mt-2 text-sm text-gray-500">
                          CSV, Excel, or JSON files up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">{selectedFile.name}</p>
                          <p className="text-sm text-blue-700">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFile(null)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedFile(null)}>
                    Clear
                  </Button>
                  <Button 
                    onClick={handleFileUpload}
                    disabled={!selectedFile || loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span>Import Jobs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {importJobs.map(job => (
                    <div key={job.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{job.filename}</h4>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span className="capitalize">{job.type}</span>
                        <span>{new Date(job.created_at).toLocaleString()}</span>
                      </div>

                      {job.status === 'processing' || job.status === 'uploading' ? (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      ) : null}

                      {job.processed_records && job.total_records && (
                        <p className="text-xs text-gray-500 mt-1">
                          {job.processed_records} of {job.total_records} records processed
                        </p>
                      )}

                      {job.errors && job.errors.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                          <p className="font-medium text-red-800">Errors:</p>
                          {job.errors.slice(0, 2).map((error, idx) => (
                            <p key={idx} className="text-red-700">• {error}</p>
                          ))}
                          {job.errors.length > 2 && (
                            <p className="text-red-700">+ {job.errors.length - 2} more errors</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {importJobs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No import jobs yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            {/* Search and Filters */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map(report => (
                <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getFormatIcon(report.format)}
                          <h3 className="font-semibold">{report.name}</h3>
                          <Badge className={getTypeColor(report.type)}>
                            {report.type}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{report.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>📅 {report.date_range.start} to {report.date_range.end}</span>
                          {report.record_count && (
                            <span>📊 {report.record_count.toLocaleString()} records</span>
                          )}
                          {report.size && <span>📁 {report.size}</span>}
                          <span>🕒 {new Date(report.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {report.status === 'ready' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReport(report.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </>
                        )}
                        
                        {report.status === 'generating' && (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-600">Generating...</span>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredReports.length === 0 && (
                <Card className="shadow-lg bg-white">
                  <CardContent className="p-12">
                    <div className="text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No reports found</p>
                      <p className="text-sm">Try adjusting your search terms</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Exports</p>
                    <p className="text-3xl font-bold">247</p>
                  </div>
                  <Download className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Data Volume</p>
                    <p className="text-3xl font-bold">1.2TB</p>
                  </div>
                  <Database className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Active Reports</p>
                    <p className="text-3xl font-bold">15</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Import Jobs</p>
                    <p className="text-3xl font-bold">89</p>
                  </div>
                  <Upload className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Data Management Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Analytics Dashboard</p>
                  <p>Detailed analytics and charts would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManager;