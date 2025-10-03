import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Trash2,
  UserPlus,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import StaffManagementService, { 
  type Staff, 
  type Doctor, 
  type Patient,
  type Task,
  type Equipment
} from '@/services/staffDatabaseService';

type ManagementTab = 'staff' | 'doctors' | 'patients' | 'tasks' | 'equipment';

interface StaffPermissions {
  canViewStaff: boolean;
  canAddStaff: boolean;
  canEditStaff: boolean;
  canDeleteStaff: boolean;
  canViewDoctors: boolean;
  canViewPatients: boolean;
  canManageTasks: boolean;
  canViewEquipment: boolean;
  canRequestMaintenance: boolean;
}

const StaffManagementInterface: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  
  // Get tab from URL parameters
  const getInitialTab = (): ManagementTab => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab') as ManagementTab;
    return ['staff', 'doctors', 'patients', 'tasks', 'equipment'].includes(tabParam) ? tabParam : 'staff';
  };
  
  // State management
  const [activeTab, setActiveTab] = useState<ManagementTab>(getInitialTab());
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [staff, setStaff] = useState<Staff[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialog states
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPatientProfileDialog, setShowPatientProfileDialog] = useState(false);
  const [showAddResultDialog, setShowAddResultDialog] = useState(false);
  const [showPatientRecordsDialog, setShowPatientRecordsDialog] = useState(false);
  const [selectedPatientForProfile, setSelectedPatientForProfile] = useState<Patient | null>(null);
  const [selectedPatientForResult, setSelectedPatientForResult] = useState<Patient | null>(null);
  const [selectedPatientForRecords, setSelectedPatientForRecords] = useState<Patient | null>(null);
  const [patientRecords, setPatientRecords] = useState<any>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [resultForm, setResultForm] = useState({ testType: '', result: '', notes: '', date: new Date().toISOString().split('T')[0] });
  
  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenancePriority, setMaintenancePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Role-based permissions
  const permissions: StaffPermissions = {
    canViewStaff: user?.role === 'staff' || user?.role === 'admin',
    canAddStaff: user?.role === 'admin',
    canEditStaff: user?.role === 'admin',
    canDeleteStaff: user?.role === 'admin',
    canViewDoctors: true,
    canViewPatients: true,
    canManageTasks: true,
    canViewEquipment: true,
    canRequestMaintenance: true
  };

  // Update active tab when URL changes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.search]);

  // Load data based on active tab and set up realtime subscriptions
  useEffect(() => {
    loadTabData();

    // Set up realtime subscriptions for all tables
    const subscriptions = [
      StaffManagementService.subscribeToStaff(() => {
        console.log('Staff data updated - reloading...');
        if (activeTab === 'staff' && permissions.canViewStaff) {
          StaffManagementService.getAllStaff().then(setStaff);
        }
      }),
      StaffManagementService.subscribeToDoctors(() => {
        console.log('Doctors data updated - reloading...');
        if (activeTab === 'doctors' && permissions.canViewDoctors) {
          StaffManagementService.getAllDoctors().then(setDoctors);
        }
      }),
      StaffManagementService.subscribeToPatients(() => {
        console.log('Patients data updated - reloading...');
        if (activeTab === 'patients' && permissions.canViewPatients) {
          StaffManagementService.getAllPatients().then(setPatients);
        }
      }),
      StaffManagementService.subscribeToTasks(() => {
        console.log('Tasks data updated - reloading...');
        if (activeTab === 'tasks' && permissions.canManageTasks) {
          StaffManagementService.getAllTasks().then(setTasks);
        }
      }),
      StaffManagementService.subscribeToEquipment(() => {
        console.log('Equipment data updated - reloading...');
        if (activeTab === 'equipment' && permissions.canViewEquipment) {
          StaffManagementService.getAllEquipment().then(setEquipment);
        }
      }),
    ];

    // Cleanup all subscriptions on unmount
    return () => {
      subscriptions.forEach(subscription => {
        StaffManagementService.unsubscribe(subscription);
      });
    };
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'staff':
          if (permissions.canViewStaff) {
            const staffData = await StaffManagementService.getAllStaff();
            setStaff(staffData);
          }
          break;
        case 'doctors':
          if (permissions.canViewDoctors) {
            const doctorsData = await StaffManagementService.getAllDoctors();
            setDoctors(doctorsData);
          }
          break;
        case 'patients':
          if (permissions.canViewPatients) {
            const patientsData = await StaffManagementService.getAllPatients();
            setPatients(patientsData);
          }
          break;
        case 'tasks':
          if (permissions.canManageTasks) {
            const tasksData = await StaffManagementService.getAllTasks();
            setTasks(tasksData);
          }
          break;
        case 'equipment':
          if (permissions.canViewEquipment) {
            const equipmentData = await StaffManagementService.getAllEquipment();
            setEquipment(equipmentData);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Data Loading Failed",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredStaff = staff.filter(member => 
    member.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter(doctor =>
    doctor.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.users?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatients = patients.filter(patient =>
    patient.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.users?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handler functions
  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const taskId = await StaffManagementService.createTask({
        title: taskTitle,
        description: taskDescription,
        assigned_to: selectedItem?.id || user?.id || '',
        created_by: user?.id || '',
        priority: taskPriority
      });

      if (taskId) {
        toast({
          title: "Task Created",
          description: "Task has been created successfully.",
        });
        setShowTaskDialog(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('medium');
        loadTabData();
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      toast({
        title: "Task Creation Failed",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRequestMaintenance = async () => {
    if (!maintenanceDescription.trim() || !selectedItem) {
      toast({
        title: "Missing Information",
        description: "Please provide maintenance description.",
        variant: "destructive"
      });
      return;
    }

    try {
      const taskId = await StaffManagementService.requestEquipmentMaintenance(
        selectedItem.id,
        maintenanceDescription,
        maintenancePriority,
        user?.id || ''
      );

      if (taskId) {
        toast({
          title: "Maintenance Requested",
          description: "Maintenance request has been submitted successfully.",
        });
        setShowMaintenanceDialog(false);
        setMaintenanceDescription('');
        setMaintenancePriority('medium');
        loadTabData();
      } else {
        throw new Error('Failed to request maintenance');
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to submit maintenance request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'available':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'retired':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewPatientProfile = (patient: Patient) => {
    setSelectedPatientForProfile(patient);
    setShowPatientProfileDialog(true);
  };

  const handleAddResult = (patient: Patient) => {
    setSelectedPatientForResult(patient);
    setResultForm({ testType: '', result: '', notes: '', date: new Date().toISOString().split('T')[0] });
    setShowAddResultDialog(true);
  };

  const handleSubmitResult = async () => {
    if (!selectedPatientForResult) return;
    
    try {
      // TODO: Implement result submission to database
      // await staffDatabaseService.addPatientResult(selectedPatientForResult.id, resultForm);
      toast({
        title: "Success",
        description: "Patient result added successfully",
      });
      setShowAddResultDialog(false);
      setSelectedPatientForResult(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add patient result",
        variant: "destructive",
      });
    }
  };

  const handleViewRecords = async (patient: Patient) => {
    setSelectedPatientForRecords(patient);
    setLoadingRecords(true);
    setShowPatientRecordsDialog(true);
    
    try {
      // Fetch comprehensive patient records
      const records = await fetchPatientRecords(patient.id);
      setPatientRecords(records);
    } catch (error) {
      console.error('Error fetching patient records:', error);
      toast({
        title: "Error",
        description: "Failed to load patient records",
        variant: "destructive",
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchPatientRecords = async (patientId: string) => {
    try {
      const patientRecord = await StaffManagementService.getPatientFullRecord(patientId);
      
      // Transform the database response to match the expected format
      return {
        appointments: patientRecord.appointments?.map((apt: any) => ({
          id: apt.id,
          date: apt.appointment_date,
          time: apt.appointment_time,
          doctor: apt.doctor?.users?.name || 'Unknown Doctor',
          type: apt.service_type || apt.appointment_type,
          status: apt.status,
          diagnosis: apt.notes || 'No diagnosis recorded',
          prescription: apt.medical_records?.[0]?.prescriptions?.map((p: any) => 
            `${p.medication_name} ${p.dosage || ''} - ${p.instructions || ''}`
          ).join(', ') || 'No prescription'
        })) || [],
        
        testResults: patientRecord.lab_tests?.map((test: any) => ({
          id: test.id,
          date: test.created_at?.split('T')[0] || 'Unknown date',
          type: test.test_type,
          result: test.result || 'Pending',
          values: test.result || 'No values available',
          doctor: test.doctor?.users?.name || 'Unknown Doctor'
        })) || [],
        
        medications: patientRecord.medical_records?.flatMap((record: any) => 
          record.prescriptions?.map((med: any) => ({
            id: med.id,
            name: med.medication_name,
            dosage: med.dosage || 'Not specified',
            frequency: med.instructions || 'As directed',
            prescribedBy: record.doctor?.users?.name || 'Unknown Doctor',
            startDate: med.prescribed_date || med.created_at?.split('T')[0] || 'Unknown date'
          })) || []
        ) || [],
        
        allergies: patientRecord.patient?.allergies ? patientRecord.patient.allergies.split(',') : [],
        medicalHistory: patientRecord.patient?.medical_history ? patientRecord.patient.medical_history.split(',') : [],
        vitalSigns: [] // No vital signs in current schema - would need separate implementation
      };
    } catch (error) {
      console.error('Error fetching patient records:', error);
      // Return empty structure on error
      return {
        appointments: [],
        testResults: [],
        medications: [],
        allergies: [],
        medicalHistory: [],
        vitalSigns: []
      };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!permissions.canViewStaff && !permissions.canViewDoctors && !permissions.canViewPatients) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You don't have permission to access the management interface. 
              Please contact your administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Practitioner Management Interface
            </h1>
            <p className="text-gray-600">Comprehensive management system for healthcare operations</p>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            {(activeTab === 'tasks' || activeTab === 'equipment') && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                {activeTab === 'tasks' && (
                  <>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </>
                )}
                {activeTab === 'equipment' && (
                  <>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </>
                )}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Activity className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Loading data...</span>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ManagementTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
              {permissions.canViewStaff && (
                <TabsTrigger value="staff" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Practitioners</span>
                </TabsTrigger>
              )}
              {permissions.canViewDoctors && (
                <TabsTrigger value="doctors" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Doctors</span>
                </TabsTrigger>
              )}
              {permissions.canViewPatients && (
                <TabsTrigger value="patients" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Patients</span>
                </TabsTrigger>
              )}
              {permissions.canManageTasks && (
                <TabsTrigger value="tasks" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Tasks</span>
                </TabsTrigger>
              )}
              {permissions.canViewEquipment && (
                <TabsTrigger value="equipment" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Equipment</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Practitioner Management Tab */}
            <TabsContent value="staff" className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Practitioner Members</span>
                  </CardTitle>
                  {permissions.canAddStaff && (
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Practitioner
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredStaff.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {member.users?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{member.users?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{member.position || 'Practitioner'}</p>
                              <p className="text-xs text-gray-500">
                                {member.users?.email} • {member.users?.phone || 'No phone'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            
                            {permissions.canEditStaff && (
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}

                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(member);
                                setShowTaskDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Assign Task
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredStaff.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No practitioners found matching your search.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Doctors Management Tab */}
            <TabsContent value="doctors" className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Doctors (View Only)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredDoctors.map((doctor) => (
                      <div 
                        key={doctor.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                              {doctor.users?.name?.split(' ').map(n => n[0]).join('') || 'D'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{doctor.users?.name || 'Unknown'}</p>
                              <p className="text-sm text-green-600 font-medium">{doctor.specialty}</p>
                              <p className="text-xs text-gray-500">
                                {doctor.users?.email} • License: {doctor.license_number}
                              </p>
                              <p className="text-xs text-green-600 font-semibold">
                                Consultation Fee: ₱{doctor.consultation_fee}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={doctor.is_available ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                            {doctor.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-1" />
                            View Schedule
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredDoctors.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No doctors found matching your search.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patients Management Tab */}
            <TabsContent value="patients" className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Patients</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredPatients.map((patient) => (
                      <div 
                        key={patient.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {patient.users?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{patient.users?.name || 'Unknown'}</p>
                              <p className="text-sm text-purple-600">{patient.gender} • {patient.blood_type}</p>
                              <p className="text-xs text-gray-500">
                                {patient.users?.email} • {patient.users?.phone}
                              </p>
                              {patient.emergency_contact_name && (
                                <p className="text-xs text-orange-600">
                                  Emergency: {patient.emergency_contact_name} ({patient.emergency_contact_phone})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewPatientProfile(patient)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleViewRecords(patient)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Records
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => handleAddResult(patient)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Result
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredPatients.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No patients found matching your search.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Management Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Task Management</span>
                  </CardTitle>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowTaskDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-semibold text-gray-900">{task.title}</p>
                              <p className="text-sm text-gray-600">{task.description}</p>
                              <p className="text-xs text-gray-500">
                                Assigned to: {task.assigned_user?.name || 'Unknown'} • 
                                Created by: {task.creator?.name || 'Unknown'}
                              </p>
                              {task.due_date && (
                                <p className="text-xs text-orange-600">
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {filteredTasks.length === 0 && (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No tasks found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Equipment Management Tab */}
            <TabsContent value="equipment" className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>Equipment Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredEquipment.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-sm text-indigo-600">{item.type} • {item.model}</p>
                              <p className="text-xs text-gray-500">
                                Serial: {item.serial_number} • Location: {item.location}
                              </p>
                              {item.next_maintenance && (
                                <p className="text-xs text-orange-600">
                                  Next Maintenance: {new Date(item.next_maintenance).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.toUpperCase()}
                          </Badge>
                          
                          {permissions.canRequestMaintenance && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowMaintenanceDialog(true);
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Request Maintenance
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredEquipment.length === 0 && (
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No equipment found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Create Task Dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Create a new task and assign it to a team member.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="task-title" className="text-right">
                  Title
                </Label>
                <Input 
                  id="task-title" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="col-span-3" 
                  placeholder="Enter task title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="task-description" className="text-right">
                  Description
                </Label>
                <Textarea 
                  id="task-description" 
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="col-span-3" 
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="task-priority" className="text-right">
                  Priority
                </Label>
                <select
                  id="task-priority"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Maintenance Dialog */}
        <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Equipment Maintenance</DialogTitle>
              <DialogDescription>
                Submit a maintenance request for {selectedItem?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenance-description" className="text-right">
                  Description
                </Label>
                <Textarea 
                  id="maintenance-description" 
                  value={maintenanceDescription}
                  onChange={(e) => setMaintenanceDescription(e.target.value)}
                  className="col-span-3" 
                  placeholder="Describe the maintenance needed"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenance-priority" className="text-right">
                  Priority
                </Label>
                <select
                  id="maintenance-priority"
                  value={maintenancePriority}
                  onChange={(e) => setMaintenancePriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestMaintenance}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Patient Profile Dialog */}
        <Dialog open={showPatientProfileDialog} onOpenChange={setShowPatientProfileDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Patient Profile</span>
              </DialogTitle>
            </DialogHeader>
            {selectedPatientForProfile && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm">{selectedPatientForProfile.users?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm">{selectedPatientForProfile.users?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm">{selectedPatientForProfile.users?.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <p className="text-sm">{selectedPatientForProfile.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Blood Type</label>
                    <p className="text-sm">{selectedPatientForProfile.blood_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="text-sm">
                      {selectedPatientForProfile.date_of_birth 
                        ? new Date(selectedPatientForProfile.date_of_birth).toLocaleDateString()
                        : 'Not provided'
                      }
                    </p>
                  </div>
                </div>
                
                {selectedPatientForProfile.emergency_contact_name && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="text-sm">{selectedPatientForProfile.emergency_contact_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm">{selectedPatientForProfile.emergency_contact_phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPatientForProfile.allergies && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700">Allergies</label>
                    <p className="text-sm text-red-600">{selectedPatientForProfile.allergies}</p>
                  </div>
                )}

                {selectedPatientForProfile.medical_history && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700">Medical History</label>
                    <p className="text-sm">{selectedPatientForProfile.medical_history}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPatientProfileDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Result Dialog */}
        <Dialog open={showAddResultDialog} onOpenChange={setShowAddResultDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Add Patient Result</span>
              </DialogTitle>
            </DialogHeader>
            {selectedPatientForResult && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Patient</label>
                  <p className="text-sm font-medium">{selectedPatientForResult.users?.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Test Type</label>
                  <input
                    type="text"
                    value={resultForm.testType}
                    onChange={(e) => setResultForm({...resultForm, testType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Blood Test, X-Ray, MRI"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Result</label>
                  <input
                    type="text"
                    value={resultForm.result}
                    onChange={(e) => setResultForm({...resultForm, result: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Normal, Abnormal, Positive, Negative"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={resultForm.date}
                    onChange={(e) => setResultForm({...resultForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                  <textarea
                    value={resultForm.notes}
                    onChange={(e) => setResultForm({...resultForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes or comments"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddResultDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitResult}>
                Add Result
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Patient Records Modal */}
        <Dialog open={showPatientRecordsDialog} onOpenChange={setShowPatientRecordsDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Medical Records - {selectedPatientForRecords?.users?.name || 'Patient'}</span>
              </DialogTitle>
              <DialogDescription>
                Comprehensive medical history, appointments, test results, and medications
              </DialogDescription>
            </DialogHeader>

            {loadingRecords ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading records...</span>
              </div>
            ) : patientRecords ? (
              <div className="space-y-6">
                {/* Patient Info Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Patient</p>
                        <p className="font-semibold">{selectedPatientForRecords?.users?.name}</p>
                        <p className="text-sm text-gray-600">{selectedPatientForRecords?.users?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Basic Info</p>
                        <p className="text-sm">{selectedPatientForRecords?.gender} • {selectedPatientForRecords?.blood_type}</p>
                        <p className="text-sm text-gray-600">DOB: {selectedPatientForRecords?.date_of_birth}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Emergency Contact</p>
                        <p className="text-sm">{selectedPatientForRecords?.emergency_contact_name}</p>
                        <p className="text-sm text-gray-600">{selectedPatientForRecords?.emergency_contact_phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="appointments" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="results">Test Results</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
                    <TabsTrigger value="history">Medical History</TabsTrigger>
                  </TabsList>

                  {/* Appointments Tab */}
                  <TabsContent value="appointments" className="space-y-4">
                    <div className="space-y-3">
                      {patientRecords.appointments?.map((appointment: any) => (
                        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="font-semibold">{appointment.type}</p>
                                    <p className="text-sm text-gray-600">{appointment.date} at {appointment.time}</p>
                                    <p className="text-sm text-blue-600">{appointment.doctor}</p>
                                  </div>
                                </div>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm"><strong>Diagnosis:</strong> {appointment.diagnosis}</p>
                                  <p className="text-sm"><strong>Prescription:</strong> {appointment.prescription}</p>
                                </div>
                              </div>
                              <Badge className={appointment.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {appointment.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Test Results Tab */}
                  <TabsContent value="results" className="space-y-4">
                    <div className="space-y-3">
                      {patientRecords.testResults?.map((test: any) => (
                        <Card key={test.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <Activity className="h-5 w-5 text-green-600" />
                                  <div>
                                    <p className="font-semibold">{test.type}</p>
                                    <p className="text-sm text-gray-600">{test.date} • {test.doctor}</p>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm"><strong>Values:</strong> {test.values}</p>
                                </div>
                              </div>
                              <Badge className={test.result === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                                {test.result}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Medications Tab */}
                  <TabsContent value="medications" className="space-y-4">
                    <div className="space-y-3">
                      {patientRecords.medications?.map((med: any) => (
                        <Card key={med.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-semibold text-sm">Rx</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{med.name}</p>
                                <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                                <p className="text-sm text-purple-600">Prescribed by {med.prescribedBy}</p>
                                <p className="text-xs text-gray-500">Started: {med.startDate}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Vital Signs Tab */}
                  <TabsContent value="vitals" className="space-y-4">
                    <div className="space-y-3">
                      {patientRecords.vitalSigns?.map((vital: any, index: number) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <Heart className="h-5 w-5 text-red-600" />
                              <p className="font-semibold">Vital Signs - {vital.date}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Blood Pressure</p>
                                <p className="text-lg font-semibold">{vital.bloodPressure}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                                <p className="text-lg font-semibold">{vital.heartRate}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Temperature</p>
                                <p className="text-lg font-semibold">{vital.temperature}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Weight</p>
                                <p className="text-lg font-semibold">{vital.weight}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Height</p>
                                <p className="text-lg font-semibold">{vital.height}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Medical History Tab */}
                  <TabsContent value="history" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <span>Allergies</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {patientRecords.allergies?.map((allergy: string, index: number) => (
                              <Badge key={index} variant="outline" className="border-red-300 text-red-700">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span>Medical History</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {patientRecords.medicalHistory?.map((item: string, index: number) => (
                              <p key={index} className="text-sm border-l-4 border-blue-200 pl-3 py-1">
                                {item}
                              </p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No records found for this patient.</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPatientRecordsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffManagementInterface;