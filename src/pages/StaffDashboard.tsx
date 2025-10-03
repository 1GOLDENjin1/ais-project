/**
 * Practitioner/Admin Dashboard
 * Comprehensive system management for practitioner and admin users
 */

import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth-service';
import { healthcareService, type AccessContext } from '@/services/healthcare-service';
import { StaffRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  X,
  User,
  Heart,
  Wrench,
  Shield,
  TrendingUp,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface PractitionerDashboardData {
  appointments: any[];
  patients: any[];
  doctors: any[];
  staff: any[];
  equipment: any[];
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'staff';
  password: string;
  profileData: any;
}

interface ServiceForm {
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  preparation: string;
  requirements: string;
  is_available: boolean;
  home_service_available: boolean;
  equipment_required: string;
  doctor_specialty: string;
}

export const PractitionerDashboard: React.FC = () => {
  const [context, setContext] = useState<AccessContext | null>(null);
  const [dashboardData, setDashboardData] = useState<PractitionerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    email: '',
    phone: '',
    role: 'patient',
    password: '',
    profileData: {}
  });

  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    name: '',
    category: '',
    description: '',
    duration: '',
    price: 0,
    preparation: '',
    requirements: '',
    is_available: true,
    home_service_available: false,
    equipment_required: '',
    doctor_specialty: ''
  });

  const [taskForm, setTaskForm] = useState({
    assigned_to: '',
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'general',
    due_date: ''
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const currentContext = authService.getCurrentContext();
        if (!currentContext) {
          throw new Error('No authentication context');
        }

        setContext(currentContext);

        const data = await healthcareService.getStaffDashboard(currentContext);
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  const handleCreateUser = async () => {
    if (!context) return;

    try {
      await healthcareService.createUser(context, userForm, userForm.profileData);
      
      // Reset form and close modal
      setUserForm({
        name: '',
        email: '',
        phone: '',
        role: 'patient',
        password: '',
        profileData: {}
      });
      setShowUserModal(false);
      
      // Refresh dashboard data
      const updatedData = await healthcareService.getStaffDashboard(context);
      setDashboardData(updatedData);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    }
  };

  const handleCreateService = async () => {
    if (!context) return;

    try {
      await healthcareService.createService(context, serviceForm);
      
      // Reset form and close modal
      setServiceForm({
        name: '',
        category: '',
        description: '',
        duration: '',
        price: 0,
        preparation: '',
        requirements: '',
        is_available: true,
        home_service_available: false,
        equipment_required: '',
        doctor_specialty: ''
      });
      setShowServiceModal(false);
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Failed to create service');
    }
  };

  const handleAssignTask = async () => {
    if (!context) return;

    try {
      await healthcareService.assignTask(context, taskForm);
      
      // Reset form and close modal
      setTaskForm({
        assigned_to: '',
        title: '',
        description: '',
        priority: 'medium',
        task_type: 'general',
        due_date: ''
      });
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Failed to assign task');
    }
  };

  if (isLoading) {
    return (
      <StaffRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </StaffRoute>
    );
  }

  if (error) {
    return (
      <StaffRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </StaffRoute>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'paid':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'failed':
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <StaffRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {context?.user.role === 'admin' ? 'Admin' : 'Practitioner'} Dashboard
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {context?.user.name}
                </div>
                
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full capitalize">
                  {context?.user.role}
                </span>
                
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: Activity },
                { id: 'appointments', name: 'All Appointments', icon: Calendar },
                { id: 'users', name: 'User Management', icon: Users },
                { id: 'services', name: 'Services', icon: Settings },
                { id: 'equipment', name: 'Equipment', icon: Wrench },
                { id: 'reports', name: 'Reports', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-2xl font-semibold text-gray-900">
                          {dashboardData?.appointments.length || 0}
                        </p>
                        <p className="text-gray-600">Total Appointments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-2xl font-semibold text-gray-900">
                          {(dashboardData?.patients.length || 0) + (dashboardData?.doctors.length || 0) + (dashboardData?.staff.length || 0)}
                        </p>
                        <p className="text-gray-600">Total Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Wrench className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-2xl font-semibold text-gray-900">
                          {dashboardData?.equipment.length || 0}
                        </p>
                        <p className="text-gray-600">Equipment Items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patients?.users?.name || 'Unknown'} → Dr. {appointment.doctors?.users?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.service_type}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">All Appointments</h2>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData?.appointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.patients?.users?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Dr. {appointment.doctors?.users?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.service_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <Button onClick={() => setShowUserModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Patients ({dashboardData?.patients.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData?.patients.slice(0, 3).map((patient) => (
                        <div key={patient.id} className="text-sm">
                          {patient.users?.name || 'Unknown'}
                        </div>
                      ))}
                      {(dashboardData?.patients.length || 0) > 3 && (
                        <div className="text-sm text-gray-500">
                          +{(dashboardData?.patients.length || 0) - 3} more
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Doctors ({dashboardData?.doctors.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData?.doctors.slice(0, 3).map((doctor) => (
                        <div key={doctor.id} className="text-sm">
                          Dr. {doctor.users?.name || 'Unknown'}
                        </div>
                      ))}
                      {(dashboardData?.doctors.length || 0) > 3 && (
                        <div className="text-sm text-gray-500">
                          +{(dashboardData?.doctors.length || 0) - 3} more
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Practitioners ({dashboardData?.staff.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData?.staff.slice(0, 3).map((practitioner) => (
                        <div key={practitioner.id} className="text-sm">
                          {practitioner.users?.name || 'Unknown'}
                        </div>
                      ))}
                      {(dashboardData?.staff.length || 0) > 3 && (
                        <div className="text-sm text-gray-500">
                          +{(dashboardData?.staff.length || 0) - 3} more
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
                <Button onClick={() => setShowServiceModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    Service management interface coming soon
                  </div>
                </CardContent>
              </Card>
            </div>
          )}



          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Equipment Management</h2>

              <Card>
                <CardContent className="p-6">
                  {dashboardData?.equipment.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No equipment records found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dashboardData?.equipment.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.type}</p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">{item.location}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">System Reports</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Appointments:</span>
                        <span className="font-medium">{dashboardData?.appointments.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-medium text-green-600">
                          {dashboardData?.appointments.filter(a => a.status === 'completed').length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <span className="font-medium text-yellow-600">
                          {dashboardData?.appointments.filter(a => a.status === 'pending').length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cancelled:</span>
                        <span className="font-medium text-red-600">
                          {dashboardData?.appointments.filter(a => a.status === 'cancelled').length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>


              </div>
            </div>
          )}
        </main>

        {/* Create User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName">Name</Label>
                  <Input
                    id="userName"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="userPhone">Phone</Label>
                  <Input
                    id="userPhone"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="userRole">Role</Label>
                  <select
                    id="userRole"
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="staff">Practitioner</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="userPassword">Password</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateUser}>
                  Create User
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffRoute>
  );
};



export default PractitionerDashboard;