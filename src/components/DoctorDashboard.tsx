import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Video, 
  MessageSquare, 
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Pill,
  TestTube,
  Bell,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DoctorManagementService, { 
  type DoctorAppointment, 
  type DoctorTask, 
  type DoctorMessageThread,
  type DoctorProfile 
} from '@/services/doctorDatabaseService';

const DoctorDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<DoctorAppointment[]>([]);
  const [recentTasks, setRecentTasks] = useState<DoctorTask[]>([]);
  const [messageThreads, setMessageThreads] = useState<DoctorMessageThread[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingTasks: 0,
    unreadMessages: 0,
    totalPatients: 0
  });

  // Get doctor ID from user context (assuming user has doctor_id or we need to fetch it)
  const [doctorId, setDoctorId] = useState<string>('');

  // Load initial data
  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // First get the doctor profile to get the doctor ID
        // This assumes the user.id is linked to doctors table via user_id
        const profile = await DoctorManagementService.getMyProfile(user.id);
        if (!profile) {
          toast({
            title: "Access Denied",
            description: "Doctor profile not found. Please contact administration.",
            variant: "destructive"
          });
          return;
        }

        setDoctorProfile(profile);
        setDoctorId(profile.id);

        // Load dashboard data
        const [
          appointments,
          tasks,
          threads
        ] = await Promise.all([
          DoctorManagementService.getTodaysAppointments(profile.id),
          DoctorManagementService.getMyTasks(profile.id),
          DoctorManagementService.getMyMessageThreads(profile.id)
        ]);

        setTodayAppointments(appointments);
        setRecentTasks(tasks.slice(0, 5)); // Show recent 5 tasks
        setMessageThreads(threads.slice(0, 5)); // Show recent 5 threads

        // Calculate stats
        const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
        const unreadMessagesCount = threads.filter(t => 
          t.last_message && t.last_message.sender_id !== profile.id
        ).length;

        setStats({
          todayAppointments: appointments.length,
          pendingTasks: pendingTasksCount,
          unreadMessages: unreadMessagesCount,
          totalPatients: 0 // This would need a separate query
        });

      } catch (error) {
        console.error('Error loading doctor dashboard:', error);
        toast({
          title: "Loading Failed",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!doctorId) return;

    const subscriptions = [
      DoctorManagementService.subscribeToMyAppointments(doctorId, () => {
        console.log('Appointments updated - reloading...');
        DoctorManagementService.getTodaysAppointments(doctorId).then(setTodayAppointments);
      }),
      DoctorManagementService.subscribeToMyTasks(doctorId, () => {
        console.log('Tasks updated - reloading...');
        DoctorManagementService.getMyTasks(doctorId).then(tasks => setRecentTasks(tasks.slice(0, 5)));
      }),
      DoctorManagementService.subscribeToMyMessages(doctorId, () => {
        console.log('Messages updated - reloading...');
        DoctorManagementService.getMyMessageThreads(doctorId).then(threads => setMessageThreads(threads.slice(0, 5)));
      })
    ];

    return () => {
      subscriptions.forEach(subscription => {
        DoctorManagementService.unsubscribe(subscription);
      });
    };
  }, [doctorId]);

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'complete' | 'cancel') => {
    try {
      const success = await DoctorManagementService.updateAppointmentStatus(appointmentId, action === 'cancel' ? 'cancelled' : action === 'confirm' ? 'confirmed' : 'completed');
      
      if (success) {
        toast({
          title: "Success",
          description: `Appointment ${action}ed successfully.`,
        });
        
        // Refresh appointments
        const updatedAppointments = await DoctorManagementService.getTodaysAppointments(doctorId);
        setTodayAppointments(updatedAppointments);
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: `Failed to ${action} appointment. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const success = await DoctorManagementService.completeTask(taskId);
      
      if (success) {
        toast({
          title: "Task Completed",
          description: "Task marked as completed successfully.",
        });
        
        // Refresh tasks
        const updatedTasks = await DoctorManagementService.getMyTasks(doctorId);
        setRecentTasks(updatedTasks.slice(0, 5));
      }
    } catch (error) {
      toast({
        title: "Task Update Failed",
        description: "Failed to update task status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getAppointmentStatusColor = (status: string) => {
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

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Stethoscope className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2 text-lg">Loading doctor dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Dr. {doctorProfile?.users?.name || user?.name || 'Doctor'}
          </h1>
          <p className="text-gray-600 mt-1">
            {doctorProfile?.specialty} • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={doctorProfile?.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {doctorProfile?.is_available ? "Available" : "Unavailable"}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayAppointments > 0 ? 'appointments scheduled' : 'No appointments today'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingTasks > 0 ? 'tasks to complete' : 'All caught up!'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unreadMessages > 0 ? 'unread messages' : 'No new messages'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">under your care</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Today's Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-500 text-white">
                        {appointment.patient?.users?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{appointment.patient?.users?.name || 'Unknown Patient'}</p>
                      <p className="text-sm text-blue-600">{appointment.service_type}</p>
                      <p className="text-xs text-gray-500">{appointment.appointment_time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getAppointmentStatusColor(appointment.status)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                    
                    <div className="flex space-x-1">
                      {appointment.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                          className="hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                          className="hover:bg-blue-50"
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {appointment.consultation_type === 'video-call' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-purple-50"
                        >
                          <Video className="h-4 w-4 text-purple-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {todayAppointments.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments scheduled for today.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <span>Recent Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    {task.patient && (
                      <p className="text-xs text-orange-600">Patient: {task.patient.users?.name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {task.due_date && `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getTaskPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    
                    {task.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCompleteTask(task.id)}
                        className="hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {recentTasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks assigned.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span>Recent Messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messageThreads.map((thread) => (
              <div 
                key={thread.id} 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-green-500 text-white">
                      {thread.patient?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{thread.patient?.name || 'Unknown Patient'}</p>
                    <p className="text-sm text-gray-600">{thread.last_message?.message_text || 'No messages'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(thread.last_message_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {thread.last_message?.sender_id !== doctorId && (
                    <Badge className="bg-green-500 text-white">New</Badge>
                  )}
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {messageThreads.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent messages.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center space-y-2 bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Schedule</span>
            </Button>
            <Button className="h-20 flex flex-col items-center space-y-2 bg-green-600 hover:bg-green-700">
              <Users className="h-6 w-6" />
              <span className="text-sm">Patients</span>
            </Button>
            <Button className="h-20 flex flex-col items-center space-y-2 bg-purple-600 hover:bg-purple-700">
              <Pill className="h-6 w-6" />
              <span className="text-sm">Prescriptions</span>
            </Button>
            <Button className="h-20 flex flex-col items-center space-y-2 bg-orange-600 hover:bg-orange-700">
              <TestTube className="h-6 w-6" />
              <span className="text-sm">Lab Tests</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;