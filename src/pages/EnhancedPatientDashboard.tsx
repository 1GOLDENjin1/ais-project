import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rlsDataService } from "@/lib/rls-data-service";
import { healthcareService } from "@/services/healthcare-service";
import { MessagingModal } from "@/components/MessagingModal";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Calendar,
  Clock,
  Heart,
  Activity,
  TestTube,
  Bell,
  Plus,
  Settings,
  MapPin,
  Video,
  Phone,
  MessageSquare,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Timer,
  ArrowRight,
  Stethoscope,
  Pill,
  Shield,
  Target,
  ChevronRight,
  Star,
  Zap,
  Users,
  Calendar as CalendarIcon
} from "lucide-react";

interface EnhancedAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  doctor_name: string;
  doctor_specialty: string;
  doctor_avatar?: string;
  reason: string;
  consultation_type: 'in-person' | 'video-call' | 'phone';
  fee: number;
  duration_minutes: number;
  location?: string;
  notes?: string;
}

interface HealthMetric {
  id: string;
  type: string;
  value: number;
  unit: string;
  recorded_date: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  trend: 'up' | 'down' | 'stable';
  notes?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'result' | 'reminder' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  is_read: boolean;
}

const EnhancedPatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingAppointments, setUpcomingAppointments] = useState<EnhancedAppointment[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingResults: 0,
    healthScore: 85
  });

  // Dialog states for standard confirmation popups
  const [showBookAppointmentDialog, setShowBookAppointmentDialog] = useState(false);
  const [showMessageDoctorDialog, setShowMessageDoctorDialog] = useState(false);
  const [showJoinCallDialog, setShowJoinCallDialog] = useState(false);
  const [showLabResultsDialog, setShowLabResultsDialog] = useState(false);
  const [showMedicalRecordsDialog, setShowMedicalRecordsDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<EnhancedAppointment | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);

  // Confirmation handlers for patient dashboard actions
  const confirmBookAppointment = () => {
    setShowBookAppointmentDialog(false);
    toast({
      title: "Redirecting to Book Appointment",
      description: "Taking you to the appointment booking page...",
    });
    navigate('/book-appointment');
  };

  const confirmMessageDoctor = () => {
    setShowMessageDoctorDialog(false);
    toast({
      title: "Opening Messaging",
      description: "Starting a conversation with your doctor...",
    });
    navigate('/message-doctor');
  };

  const confirmJoinCall = () => {
    if (!selectedAppointment) return;
    
    setShowJoinCallDialog(false);
    toast({
      title: "Joining Video Call",
      description: `Connecting to your appointment with ${selectedAppointment.doctor_name}...`,
    });
    // Add video call logic here
    navigate(`/video-call?appointmentId=${selectedAppointment.id}`);
    setSelectedAppointment(null);
  };

  const confirmViewLabResults = () => {
    setShowLabResultsDialog(false);
    toast({
      title: "Loading Lab Results",
      description: "Fetching your latest test results...",
    });
    navigate('/lab-results');
  };

  const confirmViewMedicalRecords = () => {
    setShowMedicalRecordsDialog(false);
    toast({
      title: "Loading Medical Records",
      description: "Accessing your complete medical history...",
    });
    navigate('/medical-records');
  };

  const confirmViewProfile = () => {
    setShowProfileDialog(false);
    toast({
      title: "Opening Profile",
      description: "Taking you to your profile settings...",
    });
    navigate('/profile');
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      // Get patient dashboard data from healthcare service
      // Create a proper context object
      const context = {
        user: {
          id: user.id,
          name: user.name || '',
          role: user.role as 'patient',
          email: user.email || '',
          created_at: new Date().toISOString()
        },
        patientProfile: user.role === 'patient' ? { 
          id: user.id,
          user_id: user.id,
          date_of_birth: '',
          gender: '',
          phone: '',
          address: '',
          emergency_contact: '',
          medical_history: '',
          allergies: '',
          created_at: ''
        } : null
      };
      
      const dashboardData = await healthcareService.getPatientDashboard(context);

      // Convert upcoming appointments to EnhancedAppointment format
      const enhancedAppointments: EnhancedAppointment[] = dashboardData.upcomingAppointments.map((apt: any) => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        doctor_name: apt.doctors?.users?.name || 'Unknown Doctor',
        doctor_specialty: apt.doctors?.specialty || 'General Practice',
        reason: apt.reason || 'Consultation',
        consultation_type: apt.consultation_type,
        fee: apt.fee || 0,
        duration_minutes: apt.duration_minutes || 30,
        location: apt.location || 'TBD'
      }));

      // Convert health metrics to HealthMetric format
      const enhancedHealthMetrics: HealthMetric[] = dashboardData.healthMetrics.map((metric: any) => ({
        id: metric.id,
        type: metric.metric_type,
        value: parseFloat(metric.value) || 0,
        unit: metric.unit || '',
        recorded_date: metric.recorded_date,
        status: 'normal', // Could be calculated based on value ranges
        trend: 'stable' // Could be calculated by comparing recent values
      }));

      // Convert notifications to Notification format
      const enhancedNotifications: Notification[] = dashboardData.notifications.map((notif: any) => ({
        id: notif.id,
        title: notif.title || 'Notification',
        message: notif.message || 'You have a notification',
        type: notif.type || 'general',
        priority: notif.priority || 'medium',
        created_at: notif.created_at,
        is_read: notif.is_read || false
      }));

      setUpcomingAppointments(enhancedAppointments);
      setHealthMetrics(enhancedHealthMetrics);
      setNotifications(enhancedNotifications);
      
      // Calculate real stats
      const totalAppointments = dashboardData.upcomingAppointments.length + dashboardData.pastAppointments.length;
      const completedAppointments = dashboardData.pastAppointments.filter((apt: any) => apt.status === 'completed').length;
      
      setStats({
        totalAppointments,
        completedAppointments,
        pendingResults: dashboardData.labTests.filter((test: any) => test.status === 'pending').length,
        healthScore: enhancedHealthMetrics.length > 0 ? 85 : 0 // Could calculate based on health metrics
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'high': return 'text-orange-600';
      case 'low': return 'text-blue-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />;
      case 'stable': return <div className="h-4 w-4 border-t-2 border-gray-400" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-b-4 border-blue-600 rounded-full mx-auto"></div>
              <p className="text-lg text-gray-600 mt-4">Loading your healthcare dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-600 text-lg">Welcome to your health dashboard</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => setShowBookAppointmentDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button variant="outline" onClick={() => setShowProfileDialog(true)} className="border-2 hover:bg-gray-50">
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Next Appointment</p>
                  <p className="text-2xl font-bold">
                    {upcomingAppointments.length > 0 ? formatDistanceToNow(new Date(upcomingAppointments[0].appointment_date)) : 'None'}
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Health Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stats.healthScore}%</p>
                    <Badge className="bg-green-400 text-green-900 text-xs">Excellent</Badge>
                  </div>
                </div>
                <Heart className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Pending Results</p>
                  <p className="text-2xl font-bold">{stats.pendingResults}</p>
                </div>
                <TestTube className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">New Notifications</p>
                  <p className="text-2xl font-bold">{notifications.filter(n => !n.is_read).length}</p>
                </div>
                <Bell className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="overview" className="text-sm font-medium">Overview</TabsTrigger>
            <TabsTrigger value="appointments" className="text-sm font-medium">Appointments</TabsTrigger>
            <TabsTrigger value="health" className="text-sm font-medium">Health Metrics</TabsTrigger>
            <TabsTrigger value="notifications" className="text-sm font-medium">Notifications</TabsTrigger>
            <TabsTrigger value="messages" className="text-sm font-medium">Messages</TabsTrigger>
          </TabsList>

          {/* Enhanced Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Appointments */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-blue-600" />
                        Upcoming Appointments
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('appointments')}>
                        View All <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.slice(0, 2).map((appointment) => (
                        <div key={appointment.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                                  {appointment.doctor_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{appointment.doctor_name}</h3>
                                <p className="text-sm text-blue-600 font-medium">{appointment.doctor_specialty}</p>
                                <p className="text-sm text-gray-600 mt-1">{appointment.reason}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {appointment.appointment_time}
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Timer className="h-4 w-4" />
                                    {appointment.duration_minutes} mins
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status}
                              </Badge>
                              {appointment.consultation_type === 'video-call' && (
                                <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700" onClick={() => { setSelectedAppointment(appointment); setShowJoinCallDialog(true); }}>
                                  <Video className="h-4 w-4 mr-1" />
                                  Join Call
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No upcoming appointments</p>
                        <p className="text-sm">Book your next appointment to stay on top of your health</p>
                        <Button className="mt-4" onClick={() => setShowBookAppointmentDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Book Appointment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Health Summary */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" onClick={() => setShowBookAppointmentDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Book New Appointment
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-2 hover:bg-gray-50" onClick={() => setShowMessageDoctorDialog(true)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Doctor
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-2 hover:bg-gray-50" onClick={() => setShowLabResultsDialog(true)}>
                      <TestTube className="h-4 w-4 mr-2" />
                      View Lab Results
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-2 hover:bg-gray-50" onClick={() => setShowMedicalRecordsDialog(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Medical Records
                    </Button>
                  </CardContent>
                </Card>

                {/* Health Summary */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Health Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Overall Health Score</span>
                      <span className="text-2xl font-bold text-green-600">{stats.healthScore}%</span>
                    </div>
                    <Progress value={stats.healthScore} className="h-3" />
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-2xl font-bold text-blue-600">{stats.completedAppointments}</p>
                        <p className="text-xs text-gray-600">Visits</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-2xl font-bold text-green-600">{healthMetrics.filter(m => m.status === 'normal').length}</p>
                        <p className="text-xs text-gray-600">Normal Metrics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Health Metrics */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-6 w-6 text-red-600" />
                    Recent Health Metrics
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('health')}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {healthMetrics.slice(0, 3).map((metric) => (
                    <div key={metric.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-gray-50 to-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{metric.type}</h3>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                        <span className="text-sm text-gray-500">{metric.unit}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={`text-xs ${getHealthStatusColor(metric.status)} bg-transparent border`}>
                          {metric.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(metric.recorded_date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                              {appointment.doctor_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{appointment.doctor_name}</h3>
                            <p className="text-blue-600 font-medium">{appointment.doctor_specialty}</p>
                            <p className="text-gray-600 mt-1">{appointment.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium">{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</p>
                            <p className="text-sm text-gray-500">{appointment.appointment_time}</p>
                            <p className="text-sm text-gray-500">₱{appointment.fee.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs can be enhanced similarly */}
          <TabsContent value="health">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Health Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">Health metrics content will be implemented here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">Notifications content will be implemented here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <MessageSquare className="h-16 w-16 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700">Message Your Healthcare Team</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Start conversations with your doctors, get quick responses to your questions, and stay connected with your healthcare providers.
                  </p>
                  <Button 
                    onClick={() => setShowMessaging(true)}
                    className="mt-4"
                    size="lg"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Open Messages
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Patient Dashboard Confirmation Dialogs */}
        
        {/* Book Appointment Confirmation Dialog */}
        <Dialog open={showBookAppointmentDialog} onOpenChange={setShowBookAppointmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Navigate to the appointment booking system to schedule a new consultation.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Appointment Booking</span>
                </div>
                <p className="text-sm text-gray-600">
                  You will be able to:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Choose your preferred doctor</li>
                  <li>• Select available time slots</li>
                  <li>• Pick consultation type (in-person or video)</li>
                  <li>• Add appointment notes</li>
                </ul>
                <div className="text-xs text-blue-600 mt-2">
                  This will redirect you to the appointment booking page.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBookAppointmentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmBookAppointment}>
                <Calendar className="h-4 w-4 mr-2" />
                Continue to Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message Doctor Confirmation Dialog */}
        <Dialog open={showMessageDoctorDialog} onOpenChange={setShowMessageDoctorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message Your Doctor</DialogTitle>
              <DialogDescription>
                Open the messaging system to communicate with your healthcare provider.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-green-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Doctor Messaging</span>
                </div>
                <p className="text-sm text-gray-600">
                  Secure messaging features:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Send messages directly to your doctor</li>
                  <li>• Ask questions about your health</li>
                  <li>• Request prescription refills</li>
                  <li>• Share health updates</li>
                </ul>
                <div className="text-xs text-green-600 mt-2">
                  All messages are encrypted and HIPAA compliant.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMessageDoctorDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmMessageDoctor}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Messaging
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Video Call Confirmation Dialog */}
        <Dialog open={showJoinCallDialog} onOpenChange={setShowJoinCallDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Video Call</DialogTitle>
              <DialogDescription>
                Connect to your scheduled video consultation appointment.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4">
                <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Video className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Video Consultation</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Doctor:</span> {selectedAppointment.doctor_name}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {selectedAppointment.appointment_date}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {selectedAppointment.appointment_time}
                    </div>
                    <div>
                      <span className="font-medium">Specialty:</span> {selectedAppointment.doctor_specialty}
                    </div>
                  </div>
                  <div className="text-xs text-purple-600 mt-2">
                    Make sure you have a stable internet connection and your camera/microphone are working.
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowJoinCallDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmJoinCall}>
                <Video className="h-4 w-4 mr-2" />
                Join Call Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Lab Results Confirmation Dialog */}
        <Dialog open={showLabResultsDialog} onOpenChange={setShowLabResultsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Lab Results</DialogTitle>
              <DialogDescription>
                Access your laboratory test results and reports.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-orange-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <TestTube className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Laboratory Results</span>
                </div>
                <p className="text-sm text-gray-600">
                  You can view:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Recent blood test results</li>
                  <li>• Imaging study reports</li>
                  <li>• Pathology findings</li>
                  <li>• Historical lab data trends</li>
                </ul>
                <div className="text-xs text-orange-600 mt-2">
                  Results are updated as soon as they're available from the lab.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLabResultsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmViewLabResults}>
                <TestTube className="h-4 w-4 mr-2" />
                View Results
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Medical Records Confirmation Dialog */}
        <Dialog open={showMedicalRecordsDialog} onOpenChange={setShowMedicalRecordsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Medical Records</DialogTitle>
              <DialogDescription>
                Access your complete medical history and health records.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-teal-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-teal-800">Medical History</span>
                </div>
                <p className="text-sm text-gray-600">
                  Your records include:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Past appointments and diagnoses</li>
                  <li>• Prescription history</li>
                  <li>• Vaccination records</li>
                  <li>• Surgical procedures</li>
                  <li>• Doctor's notes and recommendations</li>
                </ul>
                <div className="text-xs text-teal-600 mt-2">
                  All medical information is securely stored and protected.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMedicalRecordsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmViewMedicalRecords}>
                <FileText className="h-4 w-4 mr-2" />
                View Records
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Settings Confirmation Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profile Settings</DialogTitle>
              <DialogDescription>
                Manage your personal information and account preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-indigo-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-indigo-800">Account Management</span>
                </div>
                <p className="text-sm text-gray-600">
                  You can update:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Personal information and contact details</li>
                  <li>• Insurance information</li>
                  <li>• Emergency contacts</li>
                  <li>• Communication preferences</li>
                  <li>• Password and security settings</li>
                </ul>
                <div className="text-xs text-indigo-600 mt-2">
                  Keep your information current for better healthcare services.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmViewProfile}>
                <Settings className="h-4 w-4 mr-2" />
                Open Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Messaging Modal */}
        <MessagingModal 
          isOpen={showMessaging}
          onClose={() => setShowMessaging(false)}
        />
      </div>
    </div>
  );
};

export default EnhancedPatientDashboard;