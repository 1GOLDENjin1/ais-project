import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rlsDataService } from "@/lib/rls-data-service";
import { useAppointmentRealtime, useTaskRealtime } from "@/hooks/useRealtimeData";
import type { PatientAppointmentView, PatientDashboardSummary } from "@/types/rls-types";
import { videoSDK } from "@/services/videoSDK";
import { 
  Calendar,
  Clock,
  PhilippinePeso,
  User,
  FileText,
  Bell,
  MapPin,
  Phone,
  Settings,
  Heart,
  Activity,
  TestTube,
  Camera,
  Stethoscope,
  Home,
  MessageSquare,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Timer,
  Plus,
  Eye,
  Download,
  RefreshCw,
  Video
} from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor_name?: string;
  reason?: string;
  consultation_type?: string;
  fee?: number;
  notes?: string;
}

interface LabResult {
  id: string;
  test_type: string;
  test_date: string;
  status: string;
  results?: any;
  doctor_notes?: string;
  normal_ranges?: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
}

interface HealthMetric {
  id: string;
  patient_id: string;
  metric_type: string;
  value: string;
  unit: string;
  recorded_date: string;
  recorded_by: string;
  notes?: string;
  created_at: string;
}

const PatientDashboardComplete = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast({
        title: "Access Denied",
        description: "This dashboard is for patients only.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    loadDashboardData();
  }, [user, navigate, toast]);

  // Real-time subscription for appointments
  useAppointmentRealtime(
    (payload) => {
      console.log('Appointment realtime update:', payload);
      loadAppointments(); // Reload appointments when there's a change
    },
    !!user && user.role === 'patient' // only enable for patients
  );

  const loadDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await Promise.all([
        loadAppointments(),
        loadLabResults(),
        loadNotifications(),
        loadHealthMetrics()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinVideoCall = (appointmentId: string) => {
    try {
      // Navigate to video call page with appointment ID
      navigate(`/video-call?appointmentId=${appointmentId}`);
    } catch (error) {
      console.error('Error joining video call:', error);
      toast({
        title: "Video Call Error",
        description: "Unable to join video call. Please try again.",
        variant: "destructive"
      });
    }
  };

  const loadAppointments = async () => {
    if (!user) return;

    try {
      const allAppointments = await rlsDataService.getPatientAppointments();
      
      const now = new Date();
      const upcoming = allAppointments.filter(apt => {
        const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
        return appointmentDateTime > now;
      }).sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() - new Date(`${b.appointment_date}T${b.appointment_time}`).getTime());
      
      const past = allAppointments.filter(apt => {
        const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
        return appointmentDateTime <= now;
      }).sort((a, b) => new Date(`${b.appointment_date}T${b.appointment_time}`).getTime() - new Date(`${a.appointment_date}T${a.appointment_time}`).getTime());

      setAppointments(allAppointments);
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadLabResults = async () => {
    if (!user) return;

    try {
      const results = await rlsDataService.getPatientLabTests();
      setLabResults(results);
    } catch (error) {
      console.error('Error loading lab results:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const userNotifications = await rlsDataService.getUserNotifications();
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadHealthMetrics = async () => {
    if (!user) return;

    try {
      // Health metrics would need to be implemented in RLS service
      const metrics: any[] = [];
      setHealthMetrics(metrics);
    } catch (error) {
      console.error('Error loading health metrics:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await rlsDataService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => `₱${amount?.toLocaleString() || '0'}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground">Manage your healthcare journey</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button onClick={() => navigate('/services')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Book Service
            </Button>
            <Button variant="outline" onClick={() => navigate('/profile/edit')}>
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lab Results</p>
                  <p className="text-2xl font-bold">{labResults.length}</p>
                </div>
                <TestTube className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                  <p className="text-2xl font-bold">{notifications.filter(n => !n.is_read).length}</p>
                </div>
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold">{pastAppointments.length}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="lab-results">Lab Results</TabsTrigger>
            <TabsTrigger value="health-metrics">Health</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next Appointment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Next Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.slice(0, 2).map((appointment) => (
                        <div key={appointment.id} className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{appointment.reason || 'Medical Consultation'}</p>
                              <p className="text-sm text-muted-foreground">
                                Dr. {appointment.doctor_name || 'Healthcare Professional'}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(appointment.appointment_date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(appointment.appointment_time)}
                                </span>
                                {appointment.consultation_type === 'home-service' && (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Home className="h-4 w-4" />
                                    Home Visit
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          
                          {appointment.fee && (
                            <div className="mt-2 pt-2 border-t border-primary/10">
                              <p className="text-sm font-semibold text-primary">
                                Fee: {formatCurrency(appointment.fee)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('appointments')}
                        className="w-full"
                      >
                        View All Appointments
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No upcoming appointments</p>
                      <Button 
                        onClick={() => navigate('/services')}
                        className="mt-4"
                      >
                        Book an Appointment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Lab Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Recent Lab Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {labResults.length > 0 ? (
                    <div className="space-y-4">
                      {labResults.slice(0, 3).map((result) => (
                        <div key={result.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{result.test_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(result.test_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                            {result.status === 'completed' && (
                              <Button variant="ghost" size="sm" className="mt-1">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('lab-results')}
                        className="w-full"
                      >
                        View All Results
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <TestTube className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No lab results yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                          !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-medium ${!notification.is_read ? 'text-primary' : ''}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('notifications')}
                      className="w-full"
                    >
                      View All Notifications
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Appointments</h2>
              <Button onClick={() => navigate('/services')}>
                <Plus className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
            </div>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{appointment.reason || 'Medical Consultation'}</h3>
                            <p className="text-sm text-muted-foreground">
                              Dr. {appointment.doctor_name || 'Healthcare Professional'}
                            </p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(appointment.appointment_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatTime(appointment.appointment_time)}
                          </div>
                          {appointment.consultation_type === 'video-call' && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Video className="h-4 w-4" />
                              Video Call
                            </div>
                          )}
                          {appointment.consultation_type === 'home-service' && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Home className="h-4 w-4" />
                              Home Visit
                            </div>
                          )}
                          {appointment.fee && (
                            <div className="flex items-center gap-2">
                              <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
                              {formatCurrency(appointment.fee)}
                            </div>
                          )}
                        </div>
                        
                        {/* Video Call Action */}
                        {appointment.consultation_type === 'video-call' && appointment.status === 'confirmed' && (
                          <div className="pt-3 border-t">
                            <Button 
                              onClick={() => handleJoinVideoCall(appointment.id)}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Video Consultation
                            </Button>
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                    <Button onClick={() => navigate('/services')}>
                      Book Your First Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Past Appointments</CardTitle>
                  <CardDescription>Your appointment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastAppointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{appointment.reason || 'Medical Consultation'}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {pastAppointments.length > 5 && (
                      <Button variant="outline" className="w-full">
                        Load More
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lab Results Tab */}
          <TabsContent value="lab-results" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Lab Results</h2>
              <Button variant="outline" onClick={loadLabResults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {labResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {labResults.map((result) => (
                  <Card key={result.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{result.test_type}</CardTitle>
                          <CardDescription>{formatDate(result.test_date)}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {result.status === 'completed' && result.results ? (
                        <div className="space-y-3">
                          <div className="text-sm">
                            <p className="font-medium text-green-600">Results Available</p>
                            <p className="text-muted-foreground">Click to view detailed results</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : result.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          Processing results...
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Test scheduled. Results will be available once processing is complete.
                        </div>
                      )}
                      
                      {result.doctor_notes && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium">Doctor's Notes:</p>
                          <p className="text-sm text-muted-foreground">{result.doctor_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <TestTube className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No lab results available</p>
                  <Button onClick={() => navigate('/services')}>
                    Book Lab Services
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Health Metrics Tab */}
          <TabsContent value="health-metrics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Health Metrics</h2>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </div>

            {healthMetrics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthMetrics.map((metric) => (
                  <Card key={metric.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground capitalize">
                            {metric.metric_type?.replace('_', ' ') || 'Unknown'}
                          </p>
                          <p className="text-2xl font-bold">
                            {metric.value} {metric.unit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(metric.recorded_date)}
                          </p>
                        </div>
                        <Heart className="h-8 w-8 text-red-500" />
                      </div>
                      {metric.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{metric.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No health metrics recorded yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking your vital signs and health indicators
                  </p>
                  <Button>
                    Add First Metric
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Notifications</h2>
              <Button variant="outline" size="sm">
                Mark All as Read
              </Button>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      !notification.is_read ? 'border-primary/20 bg-primary/5' : ''
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${!notification.is_read ? 'text-primary' : ''}`}>
                            {notification.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboardComplete;