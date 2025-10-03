import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  FileText,
  Video,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Heart,
  Pill,
  TestTube
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DoctorManagementService, { 
  type DoctorProfile, 
  type DoctorAppointment 
} from '@/services/doctorDatabaseService';
import { doctorDataService } from '@/services/doctorDataService';

interface DoctorDashboardMainProps {
  doctorProfile: DoctorProfile;
}

const DoctorDashboardMain: React.FC<DoctorDashboardMainProps> = ({ doctorProfile }) => {
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<DoctorAppointment[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<DoctorAppointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [doctorProfile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await doctorDataService.getDoctorSnapshotByDoctorId(
        doctorProfile.id,
        doctorProfile.user_id
      );

      if (error || !data) {
        throw new Error(error || 'Failed to load doctor snapshot');
      }

      // Today's appointments
      setTodayAppointments(data.todaysAppointments);

      // Dashboard stats mapping
      setDashboardStats({
        todayAppointments: data.stats.todaysAppointments,
        todayCompleted: data.todaysAppointments.filter(a => a.status === 'completed').length,
        totalPatients: data.stats.uniquePatients,
        totalConsultations: data.stats.completedAppointments,
        newPatients: 0
      });

      // Upcoming appointments (next ones in future, not cancelled)
      const upcoming = (data.appointments || []).filter(a => {
        try {
          const d = new Date(a.appointment_date + 'T00:00:00');
          return d.getTime() > Date.now() && a.status !== 'cancelled';
        } catch {
          return false;
        }
      }).sort((a, b) => {
        const da = new Date(a.appointment_date + 'T' + a.appointment_time);
        const db = new Date(b.appointment_date + 'T' + b.appointment_time);
        return da.getTime() - db.getTime();
      });
      setUpcomingAppointments(upcoming);

      // Recent patients (from unique patients, enrich with last appointment if available)
      const lastByPatient = new Map<string, string>();
      (data.appointments || []).forEach(a => {
        const key = a.patient?.id;
        if (!key) return;
        const current = lastByPatient.get(key);
        const dateStr = a.appointment_date;
        if (!current || new Date(dateStr) > new Date(current)) {
          lastByPatient.set(key, dateStr);
        }
      });

      const recent = (data.patients || []).map(p => ({
        id: p.id,
        users: { name: p.name, email: p.email, phone: p.phone },
        last_appointment: lastByPatient.get(p.id) || null
      }));
      setRecentPatients(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (appointmentId: string, action: 'start' | 'complete' | 'reschedule') => {
    try {
      let success = false;
      
      switch (action) {
        case 'start':
          success = await DoctorManagementService.updateAppointmentStatus(appointmentId, 'confirmed');
          break;
        case 'complete':
          success = await DoctorManagementService.updateAppointmentStatus(appointmentId, 'completed');
          break;
        case 'reschedule':
          // Navigate to reschedule interface
          toast({
            title: "Reschedule",
            description: "Reschedule functionality will be available soon.",
          });
          return;
      }

      if (success) {
        toast({
          title: "Success",
          description: `Appointment ${action}ed successfully.`,
        });
        await loadDashboardData();
      } else {
        throw new Error(`Failed to ${action} appointment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      toast({
        title: "Action Failed",
        description: `Failed to ${action} appointment. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: DoctorAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: DoctorAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Clock className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, 
              Dr. {doctorProfile.users?.name}
            </h1>
            <p className="text-blue-100">
              {todayAppointments.length > 0 
                ? `You have ${todayAppointments.length} appointments today`
                : 'No appointments scheduled for today'
              }
            </p>
            <p className="text-blue-100 text-sm mt-1">
              {doctorProfile.specialty} • License: {doctorProfile.license_number}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{new Date().getDate()}</div>
            <div className="text-blue-100">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
            <div className="text-blue-100 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{dashboardStats?.todayAppointments || 0}</div>
            <p className="text-xs text-blue-700 mt-1">
              {dashboardStats?.todayCompleted || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{dashboardStats?.totalPatients || 0}</div>
            <p className="text-xs text-green-700 mt-1">
              {dashboardStats?.newPatients || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Consultations</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{dashboardStats?.totalConsultations || 0}</div>
            <p className="text-xs text-purple-700 mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {doctorProfile.rating?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-orange-700 mt-1">
              {doctorProfile.total_ratings || 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {appointment.patient?.users?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {appointment.patient?.users?.name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-600">{appointment.service_type}</p>
                          <p className="text-xs text-blue-600">
                            {appointment.appointment_time} • {appointment.consultation_type}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getStatusColor(appointment.status)} flex items-center space-x-1`}>
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">{appointment.status}</span>
                      </Badge>
                      
                      <div className="flex space-x-1">
                        {appointment.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleQuickAction(appointment.id, 'start')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Start
                          </Button>
                        )}
                        
                        {appointment.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleQuickAction(appointment.id, 'complete')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Complete
                          </Button>
                        )}

                        {/* Phone contact button removed as requested */}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments scheduled for today</p>
                  <p className="text-sm text-gray-400">Enjoy your free time!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Recent Patients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                        {patient.users?.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{patient.users?.name}</p>
                        <p className="text-sm text-gray-600">
                          Last visit: {patient.last_appointment ? new Date(patient.last_appointment).toLocaleDateString() : 'Never'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {patient.blood_type && (
                            <Badge variant="outline" className="text-xs">
                              <Heart className="h-3 w-3 mr-1" />
                              {patient.blood_type}
                            </Badge>
                          )}
                          {patient.allergies && (
                            <Badge variant="outline" className="text-xs text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Allergies
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons removed as requested */}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent patients</p>
                  <p className="text-sm text-gray-400">Patient history will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/doctor/appointments'}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manage Appointments
            </Button>
            <Button 
              className="w-full justify-start bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = '/doctor/lab-results'}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Lab Results
            </Button>
            <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
              <Pill className="h-4 w-4 mr-2" />
              Write Prescription
            </Button>
            <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700">
              <Video className="h-4 w-4 mr-2" />
              Start Video Call
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Upcoming Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{appointment.patient?.users?.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                      </p>
                      <p className="text-xs text-blue-600">{appointment.service_type}</p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No upcoming appointments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboardMain;