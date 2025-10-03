/**
 * Doctor Dashboard - New Implementation
 * Uses the new healthcare service for comprehensive doctor functionality
 */

import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth-service';
import { healthcareService, type AccessContext } from '@/services/healthcare-service';
import { DoctorRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  FileText, 
  Users,
  Stethoscope,
  CheckCircle,
  XCircle,
  Edit,
  X,
  User,
  Heart,
  Activity
} from 'lucide-react';

interface DoctorDashboardData {
  todayAppointments: any[];
  assignedPatients: any[];
  tasks: any[];
  payments: any[];
}

export const NewDoctorDashboard: React.FC = () => {
  const [context, setContext] = useState<AccessContext | null>(null);
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const currentContext = authService.getCurrentContext();
        if (!currentContext) {
          throw new Error('No authentication context');
        }

        setContext(currentContext);

        const data = await healthcareService.getDoctorDashboard(currentContext);
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

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    if (!context) return;

    try {
      await healthcareService.updateAppointmentStatus(context, appointmentId, newStatus);
      
      // Refresh dashboard data
      const updatedData = await healthcareService.getDoctorDashboard(context);
      setDashboardData(updatedData);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    }
  };

  if (isLoading) {
    return (
      <DoctorRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DoctorRoute>
    );
  }

  if (error) {
    return (
      <DoctorRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </DoctorRoute>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <DoctorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Stethoscope className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Doctor Dashboard</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Dr. {context?.user.name}
                </div>
                
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {context?.doctorProfile?.specialty}
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
                { id: 'appointments', name: 'Appointments', icon: Calendar },
                { id: 'patients', name: 'Patients', icon: Users },
                { id: 'tasks', name: 'Tasks', icon: FileText }
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
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardData?.todayAppointments.length || 0}
                      </p>
                      <p className="text-gray-600">Today's Appointments</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardData?.assignedPatients.length || 0}
                      </p>
                      <p className="text-gray-600">My Patients</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardData?.tasks.filter(t => t.status !== 'completed').length || 0}
                      </p>
                      <p className="text-gray-600">Pending Tasks</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Heart className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-semibold text-gray-900">
                        ₱{dashboardData?.payments.reduce((sum, p) => sum + (p.amount || 0), 0) || 0}
                      </p>
                      <p className="text-gray-600">Total Earnings</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
                </div>
                <div className="p-6">
                  {dashboardData?.todayAppointments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No appointments today</p>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData?.todayAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {appointment.patients?.users?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-sm text-gray-600">{appointment.service_type}</p>
                            <p className="text-sm text-gray-500">{appointment.appointment_time}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                            {appointment.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Confirm
                              </button>
                            )}
                            {appointment.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Today's Appointments</h2>
                <p className="text-gray-600">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData?.todayAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.appointment_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">
                              {appointment.patients?.users?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.patients?.users?.phone || 'No phone'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.service_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Confirm
                            </button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Complete
                            </button>
                          )}
                          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dashboardData?.todayAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No appointments scheduled for today
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                {dashboardData?.assignedPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No patients assigned
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData?.assignedPatients.map((patientData) => {
                      const patient = patientData.patients;
                      return (
                        <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{patient.users?.name}</h3>
                              <p className="text-sm text-gray-500">{patient.users?.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Phone:</span>
                              <span className="text-gray-900">{patient.users?.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Gender:</span>
                              <span className="text-gray-900 capitalize">{patient.gender || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">DOB:</span>
                              <span className="text-gray-900">
                                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not provided'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                {dashboardData?.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tasks assigned
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.tasks.map((task) => (
                      <div key={task.id} className={`p-4 border rounded-lg ${task.status === 'completed' ? 'bg-gray-50' : 'bg-white'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            <div className="flex items-center space-x-4 mt-3 text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.priority} priority
                              </span>
                              <span className="text-gray-500">Type: {task.task_type}</span>
                              {task.due_date && (
                                <span className="text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </DoctorRoute>
  );
};