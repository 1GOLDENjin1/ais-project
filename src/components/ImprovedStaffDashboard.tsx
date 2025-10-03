import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  MessageSquare, 
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Receipt,
  RefreshCcw,
  Bell,
  Save,
  Trash2,
  Settings,
  UserCheck,
  Stethoscope,
  Wrench,
  ClipboardList,
  TrendingUp,
  Heart,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import StaffManagementService, { 
  type StaffAppointment, 
  type StaffMedicalRecord
} from '@/services/staffDatabaseService';
import StaffManagementInterface from '@/components/StaffManagementInterface';

interface StaffDashboardData {
  appointments: StaffAppointment[];
  records: StaffMedicalRecord[];
  stats: {
    totalAppointments: number;
    confirmedAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    totalPatients: number;
    totalDoctors: number;
    activePractitioners: number;
  };
}

const ImprovedStaffDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'records' | 'management'>('overview');
  const [dashboardData, setDashboardData] = useState<StaffDashboardData>({
    appointments: [],
    records: [],
    stats: {
      totalAppointments: 0,
      confirmedAppointments: 0,
      pendingAppointments: 0,
      completedAppointments: 0,
      totalPatients: 0,
      totalDoctors: 0,
      activePractitioners: 0,
    }
  });
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [appointmentsData, recordsData, statsData] = await Promise.all([
          StaffManagementService.getAllAppointments(),
          StaffManagementService.getAllMedicalRecords(),
          StaffManagementService.getDashboardStats()
        ]);

        setDashboardData({
          appointments: appointmentsData,
          records: recordsData,
          stats: {
            totalAppointments: statsData?.totalAppointments || appointmentsData.length,
            confirmedAppointments: statsData?.confirmedAppointments || appointmentsData.filter(apt => apt.status === 'confirmed').length,
            pendingAppointments: statsData?.pendingAppointments || appointmentsData.filter(apt => apt.status === 'pending').length,
            completedAppointments: statsData?.completedAppointments || appointmentsData.filter(apt => apt.status === 'completed').length,
            totalPatients: statsData?.totalPatients || 0,
            totalDoctors: statsData?.totalDoctors || 0,
            activePractitioners: (statsData as any)?.activeStaff || 0,
          }
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Data Loading Failed",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700">Loading Practitioner Dashboard</h2>
          <p className="text-gray-500">Please wait while we load your data...</p>
        </div>
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
              Practitioner Dashboard
            </h1>
            <p className="text-gray-600">Manage appointments and medical records</p>
          </div>
          
          {/* Header Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
              className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-green-200 text-green-700 hover:bg-green-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>

          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger value="overview" className="flex items-center space-x-2 rounded-lg">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center space-x-2 rounded-lg">
              <Calendar className="h-4 w-4" />
              <span>Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center space-x-2 rounded-lg">
              <FileText className="h-4 w-4" />
              <span>Records</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center space-x-2 rounded-lg">
              <Settings className="h-4 w-4" />
              <span>Management</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Main Dashboard */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Header Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Appointments Card */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Appointments</p>
                      <p className="text-3xl font-bold text-white">{dashboardData.stats.totalAppointments}</p>
                      <div className="flex items-center mt-2 text-blue-100 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>+12% from last month</span>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Patients Card */}
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Active Patients</p>
                      <p className="text-3xl font-bold text-white">{dashboardData.stats.totalPatients}</p>
                      <div className="flex items-center mt-2 text-green-100 text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        <span>Healthy community</span>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>



              {/* Active Practitioners Card */}
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Active Practitioners</p>
                      <p className="text-3xl font-bold text-white">{dashboardData.stats.activePractitioners}</p>
                      <div className="flex items-center mt-2 text-orange-100 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        <span>All systems ready</span>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <UserCheck className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Appointments */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Calendar className="h-5 w-5" />
                    <span>Recent Appointments</span>
                  </CardTitle>
                  <p className="text-blue-100 text-sm">Your latest appointments and consultations</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.appointments.slice(0, 2).map((appointment) => (
                    <div key={appointment.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3 hover:bg-white/20 transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                          {appointment.patient?.users?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white">{appointment.patient?.users?.name || 'Unknown Patient'}</h3>
                            <Badge 
                              variant="secondary"
                              className={`${
                                appointment.status === 'pending' 
                                  ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30' 
                                  : 'bg-green-500/20 text-green-200 border-green-400/30'
                              }`}
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-blue-100 text-sm">{appointment.service_type} • {appointment.doctor?.users?.name || 'Dr. Unknown'}</p>
                          <p className="text-white/80 text-xs mt-1">{appointment.notes}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-blue-100">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{appointment.appointment_time}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>₱{appointment.fee || 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 justify-between mt-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/patient-dashboard?patient_id=${appointment.patient_id}`)}
                            className="bg-white/15 hover:bg-white/25 text-white border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
                          >
                            <Eye className="h-3 w-3 mr-1.5" />
                            Patient
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/doctor-dashboard?doctor_id=${appointment.doctor_id}`)}
                            className="bg-white/15 hover:bg-white/25 text-white border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
                          >
                            <Stethoscope className="h-3 w-3 mr-1.5" />
                            Doctor
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate('/manage-appointment', { state: { appointment } })}
                          className="bg-white hover:bg-white/90 text-blue-600 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 mr-1.5" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-white/20">
                    <Button 
                      onClick={() => setActiveTab('appointments')}
                      className="w-full bg-white hover:bg-white/90 text-blue-600 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View All Appointments
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Records */}
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <FileText className="h-5 w-5" />
                    <span>Recent Records</span>
                  </CardTitle>
                  <p className="text-green-100 text-sm">Latest medical records and test results</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.records.slice(0, 3).map((record) => (
                    <div key={record.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg mb-1">{record.diagnosis || 'Medical Record'}</h3>
                          <p className="text-green-100 text-sm mb-1">{record.doctor?.users?.name || 'Dr. Unknown'} • {new Date(record.created_at).toLocaleDateString()}</p>
                          <p className="text-white/80 text-sm leading-relaxed">{record.notes}</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/patient-dashboard?patient_id=${record.patient_id}`)}
                            className="bg-white/15 hover:bg-white/25 text-white border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
                          >
                            <Users className="h-3 w-3 mr-1.5" />
                            Patient
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/doctor-dashboard?doctor_id=${record.doctor_id}`)}
                            className="bg-white/15 hover:bg-white/25 text-white border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
                          >
                            <Stethoscope className="h-3 w-3 mr-1.5" />
                            Doctor
                          </Button>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => navigate('/update-record', { state: { record } })}
                          className="bg-white hover:bg-white/90 text-green-600 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Eye className="h-3 w-3 mr-1.5" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-white/20">
                    <Button 
                      onClick={() => setActiveTab('records')}
                      className="w-full bg-white hover:bg-white/90 text-green-600 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View All Records
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Cross-Role Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Patient Management */}
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-indigo-700">
                    <Users className="h-5 w-5" />
                    <span>Patient Access</span>
                  </CardTitle>
                  <p className="text-indigo-600 text-sm">Manage patient information and records</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <div className="font-semibold text-indigo-800">Total Patients</div>
                      <div className="text-2xl font-bold text-indigo-600">{dashboardData.stats.totalPatients}</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <div className="font-semibold text-green-800">Active Today</div>
                      <div className="text-2xl font-bold text-green-600">{dashboardData.appointments.length}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => {
                        // Navigate to management tab in local state
                        setActiveTab('management');
                        // Set a flag to navigate to patients tab
                        setTimeout(() => {
                          const patientsTab = document.querySelector('[value="patients"]') as HTMLElement;
                          if (patientsTab) {
                            patientsTab.click();
                          }
                        }, 100);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Patient Portal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Management */}
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-emerald-700">
                    <Stethoscope className="h-5 w-5" />
                    <span>Doctor Access</span>
                  </CardTitle>
                  <p className="text-emerald-600 text-sm">Manage doctor schedules and assignments</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-emerald-100 p-3 rounded-lg">
                      <div className="font-semibold text-emerald-800">Total Doctors</div>
                      <div className="text-2xl font-bold text-emerald-600">{dashboardData.stats.totalDoctors}</div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="font-semibold text-blue-800">Available Now</div>
                      <div className="text-2xl font-bold text-blue-600">{Math.floor(dashboardData.stats.totalDoctors * 0.7)}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        // Navigate to management tab in local state
                        setActiveTab('management');
                        // Set a flag to navigate to doctors tab
                        setTimeout(() => {
                          const doctorsTab = document.querySelector('[value="doctors"]') as HTMLElement;
                          if (doctorsTab) {
                            doctorsTab.click();
                          }
                        }, 100);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Doctor Portal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Practitioner-to-Practitioner Communication */}
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white border-purple-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-purple-700">
                    <MessageSquare className="h-5 w-5" />
                    <span>Inter-Role Communication</span>
                  </CardTitle>
                  <p className="text-purple-600 text-sm">Connect patients, doctors, and practitioners</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <div className="font-semibold text-purple-800">Messages Today</div>
                      <div className="text-2xl font-bold text-purple-600">24</div>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <div className="font-semibold text-orange-800">Notifications</div>
                      <div className="text-2xl font-bold text-orange-600">8</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        toast({
                          title: "Messaging System",
                          description: "Cross-role messaging interface will open here.",
                        });
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Messages
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        toast({
                          title: "Notifications",
                          description: "Notification center will open here.",
                        });
                      }}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      View Notifications
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6 mt-6">
            <Card className="shadow-xl bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>All Appointments</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>

                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {dashboardData.appointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {appointment.patient?.users?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{appointment.patient?.users?.name || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-600">
                              {appointment.service_type} • {appointment.appointment_time} • {new Date(appointment.appointment_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-blue-600">
                              Dr. {appointment.doctor?.users?.name || 'Unknown'} • {appointment.doctor?.specialty || 'General'}
                            </p>
                            {appointment.fee && (
                              <p className="text-xs text-green-600 font-medium">₱{appointment.fee}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={`flex items-center space-x-1 ${
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            appointment.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          <span className="capitalize">{appointment.status}</span>
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/patient-dashboard?patient_id=${appointment.patient_id}`)}
                            className="hover:bg-blue-50 hover:border-blue-300 border-blue-200 text-blue-600 font-medium"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Patient
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/doctor-dashboard?doctor_id=${appointment.doctor_id}`)}
                            className="hover:bg-green-50 hover:border-green-300 border-green-200 text-green-600 font-medium"
                          >
                            <Stethoscope className="h-4 w-4 mr-1" />
                            Doctor
                          </Button>

                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate('/manage-appointment', { state: { appointment } })}
                            className="hover:bg-purple-50 hover:border-purple-300 border-purple-200 text-purple-600 font-medium"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-6 mt-6">
            <Card className="shadow-xl bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span>Medical Records</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {dashboardData.records.map((record) => (
                    <div 
                      key={record.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{record.patient?.users?.name || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-600">
                              {record.diagnosis || 'Medical Record'} • {record.doctor?.users?.name || 'Dr. Unknown'}
                            </p>
                            <p className="text-xs text-blue-600">{record.doctor?.specialty || 'General'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(record.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/patient-dashboard?patient_id=${record.patient_id}`)}
                          className="hover:bg-blue-50 hover:border-blue-200 text-blue-600"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Patient
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/doctor-dashboard?doctor_id=${record.doctor_id}`)}
                          className="hover:bg-green-50 hover:border-green-200 text-green-600"
                        >
                          <Stethoscope className="h-4 w-4 mr-1" />
                          Doctor
                        </Button>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate('/update-record', { state: { record } })}
                          className="hover:bg-purple-50 hover:border-purple-200 text-purple-600"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Management Tab - Full Staff Management Interface */}
          <TabsContent value="management" className="space-y-6 mt-6">
            <StaffManagementInterface />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default ImprovedStaffDashboard;