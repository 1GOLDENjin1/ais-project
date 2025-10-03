/**
 * Patient Dashboard
 * Comprehensive dashboard for patient users
 */

import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth-service';
import { healthcareService, type AccessContext } from '@/services/healthcare-service';
import { PatientRoute } from '@/components/auth/ProtectedRoute';
import { 
  Calendar, 
  Clock, 
  FileText, 
  TestTube, 
  Heart, 
  Bell, 
  User, 
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Video,
  Monitor,
  Phone
} from 'lucide-react';
import { VideoCallRoom } from '@/components/VideoCallRoom';

interface PatientDashboardData {
  upcomingAppointments: any[];
  pastAppointments: any[];
  medicalRecords: any[];
  labTests: any[];
  healthMetrics: any[];
  notifications: any[];
}

export const PatientDashboard: React.FC = () => {
  const [context, setContext] = useState<AccessContext | null>(null);
  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Video call state
  const [inVideoCall, setInVideoCall] = useState(false);
  const [currentVideoCall, setCurrentVideoCall] = useState<any>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const currentContext = authService.getCurrentContext();
        if (!currentContext) {
          throw new Error('No authentication context');
        }

        setContext(currentContext);

        const data = await healthcareService.getPatientDashboard(currentContext);
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

  const handleJoinVideoCall = async (appointmentId: string) => {
    if (!context) return;

    try {
      const videoCall = await healthcareService.getVideoCall(context, appointmentId);
      
      if (!videoCall) {
        setError('Video call not available for this appointment');
        return;
      }

      if (videoCall.status !== 'scheduled' && videoCall.status !== 'ongoing') {
        setError('Video call is not available at this time');
        return;
      }

      const callData = await healthcareService.joinVideoCall(context, appointmentId);
      
      setCurrentVideoCall({
        ...videoCall,
        appointmentId,
        ...callData
      });
      setInVideoCall(true);
      
    } catch (error) {
      console.error('Error joining video call:', error);
      setError('Failed to join video call');
    }
  };

  const handleEndVideoCall = async (duration?: number, notes?: string) => {
    if (!currentVideoCall || !context) return;

    try {
      await healthcareService.endVideoCall(context, currentVideoCall.appointmentId, duration, notes);
      
      setInVideoCall(false);
      setCurrentVideoCall(null);
      
      // Refresh dashboard data to update appointment status
      const updatedData = await healthcareService.getPatientDashboard(context);
      setDashboardData(updatedData);
      
    } catch (error) {
      console.error('Error ending video call:', error);
      setError('Failed to end video call');
    }
  };

  const checkVideoCallAvailability = async (appointmentId: string) => {
    if (!context) return null;

    try {
      const videoCall = await healthcareService.getVideoCall(context, appointmentId);
      return videoCall;
    } catch (error) {
      return null;
    }
  };

  if (isLoading) {
    return (
      <PatientRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </PatientRoute>
    );
  }

  if (error) {
    return (
      <PatientRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </PatientRoute>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <PatientRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Patient Dashboard</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {context?.user.name}
                </div>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="relative p-2 text-gray-400 hover:text-gray-600"
                >
                  <Bell className="h-5 w-5" />
                  {dashboardData?.notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                  )}
                </button>
                
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
                { id: 'records', name: 'Medical Records', icon: FileText },
                { id: 'tests', name: 'Lab Tests', icon: TestTube },
                { id: 'health', name: 'Health Metrics', icon: Heart },
                { id: 'notifications', name: 'Notifications', icon: Bell },
                { id: 'profile', name: 'Profile', icon: Settings }
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
                        {dashboardData?.upcomingAppointments.length || 0}
                      </p>
                      <p className="text-gray-600">Upcoming Appointments</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardData?.medicalRecords.length || 0}
                      </p>
                      <p className="text-gray-600">Medical Records</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <TestTube className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardData?.labTests.length || 0}
                      </p>
                      <p className="text-gray-600">Lab Tests</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Bell className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-semibold text-gray-900">
                        {dashboardData?.notifications.filter(n => !n.is_read).length || 0}
                      </p>
                      <p className="text-gray-600">Unread Notifications</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
                      <a href="/book-appointment" className="text-blue-600 hover:text-blue-800 text-sm">
                        Book New
                      </a>
                    </div>
                  </div>
                  <div className="p-6">
                    {dashboardData?.upcomingAppointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
                    ) : (
                      <div className="space-y-4">
                        {dashboardData?.upcomingAppointments.slice(0, 3).map((appointment) => (
                          <div key={appointment.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <Calendar className="h-8 w-8 text-blue-600" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                Dr. {appointment.doctors?.users?.name}
                              </p>
                              <p className="text-sm text-gray-600">{appointment.service_type}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Notifications */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
                  </div>
                  <div className="p-6">
                    {dashboardData?.notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No notifications</p>
                    ) : (
                      <div className="space-y-4">
                        {dashboardData?.notifications.slice(0, 5).map((notification) => (
                          <div key={notification.id} className={`p-4 border rounded-lg ${notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex items-start space-x-3">
                              <Bell className={`h-5 w-5 mt-0.5 ${notification.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                              <div className="flex-1">
                                <p className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </p>
                                <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
                <a 
                  href="/book-appointment"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Book Appointment</span>
                </a>
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData?.upcomingAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">Dr. {appointment.doctors?.users?.name}</p>
                              <p className="text-sm text-gray-500">{appointment.doctors?.specialty}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.service_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <p>{new Date(appointment.appointment_date).toLocaleDateString()}</p>
                              <p className="text-gray-500">{appointment.appointment_time}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {appointment.consultation_type === 'video' ? (
                                <Video className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Monitor className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="text-sm font-medium capitalize">
                                {appointment.consultation_type === 'video' ? 'Video Call' : 'In-Person'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {appointment.consultation_type === 'video' && appointment.status === 'confirmed' && (
                              <button
                                onClick={() => handleJoinVideoCall(appointment.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-xs"
                              >
                                <Video className="h-3 w-3" />
                                <span>Join Call</span>
                              </button>
                            )}
                            {appointment.consultation_type === 'in-person' && (
                              <span className="text-gray-500 text-xs">Visit Clinic</span>
                            )}
                            {appointment.status === 'pending' && (
                              <span className="text-yellow-600 text-xs">Awaiting Confirmation</span>
                            )}
                            {appointment.status === 'completed' && (
                              <span className="text-green-600 text-xs">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dashboardData?.upcomingAppointments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No upcoming appointments
                    </div>
                  )}
                </div>
              </div>

              {/* Past Appointments */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Past Appointments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData?.pastAppointments.slice(0, 10).map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">Dr. {appointment.doctors?.users?.name}</p>
                              <p className="text-sm text-gray-500">{appointment.doctors?.specialty}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.service_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dashboardData?.pastAppointments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No past appointments
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Medical Records Tab */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
              
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  {dashboardData?.medicalRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No medical records found
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {dashboardData?.medicalRecords.map((record) => (
                        <div key={record.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium text-gray-900">Dr. {record.doctors?.users?.name}</h3>
                              <p className="text-sm text-gray-500">{new Date(record.created_at).toLocaleDateString()}</p>
                            </div>
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                          
                          {record.diagnosis && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-700 mb-2">Diagnosis</h4>
                              <p className="text-gray-600">{record.diagnosis}</p>
                            </div>
                          )}
                          
                          {record.notes && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                              <p className="text-gray-600">{record.notes}</p>
                            </div>
                          )}
                          
                          {record.prescriptions && record.prescriptions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Prescriptions</h4>
                              <div className="space-y-2">
                                {record.prescriptions.map((prescription: any) => (
                                  <div key={prescription.id} className="bg-gray-50 p-3 rounded">
                                    <p className="font-medium text-gray-900">{prescription.medication_name}</p>
                                    {prescription.dosage && <p className="text-sm text-gray-600">Dosage: {prescription.dosage}</p>}
                                    {prescription.instructions && <p className="text-sm text-gray-600">Instructions: {prescription.instructions}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lab Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Lab Tests</h2>
              
              <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData?.labTests.map((test) => (
                        <tr key={test.id}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {test.test_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Dr. {test.doctors?.users?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(test.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {test.result ? (
                              <span className="text-gray-900">{test.result}</span>
                            ) : (
                              <span className="text-yellow-600">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dashboardData?.labTests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No lab tests found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Health Metrics Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Health Metrics</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                {dashboardData?.healthMetrics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No health metrics recorded
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.healthMetrics.map((metric: any) => (
                      <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">{metric.metric_type}</h3>
                            <p className="text-sm text-gray-500">{new Date(metric.recorded_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                            <p className="text-sm text-gray-500">{metric.unit}</p>
                          </div>
                        </div>
                        {metric.notes && (
                          <p className="text-sm text-gray-600 mt-2">{metric.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
              
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  {dashboardData?.notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData?.notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 border rounded-lg ${notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-start space-x-3">
                            <Bell className={`h-5 w-5 mt-0.5 ${notification.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {notification.priority}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
              
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{context?.user.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{context?.user.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-900">{context?.user.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <p className="mt-1 text-sm text-gray-900 capitalize">{context?.user.role}</p>
                        </div>
                      </div>
                    </div>
                    
                    {context?.patientProfile && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {context.patientProfile.date_of_birth 
                                ? new Date(context.patientProfile.date_of_birth).toLocaleDateString()
                                : 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <p className="mt-1 text-sm text-gray-900 capitalize">
                              {context.patientProfile.gender || 'Not provided'}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {context.patientProfile.address || 'Not provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Video Call Interface */}
      {inVideoCall && currentVideoCall && (
        <div className="fixed inset-0 z-50">
          <VideoCallRoom
            roomId={currentVideoCall.room_id}
            userRole="patient"
            userName={context?.user.name || 'Patient'}
            appointmentId={currentVideoCall.appointmentId}
            onCallEnd={handleEndVideoCall}
          />
        </div>
      )}
    </PatientRoute>
  );
};