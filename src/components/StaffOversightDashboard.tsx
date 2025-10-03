// ===================================================
// STAFF OVERSIGHT DASHBOARD
// Comprehensive staff interface for appointment monitoring and management
// ===================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';
import { 
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Phone,
  MessageSquare,
  MapPin,
  Video,
  TrendingUp,
  Users,
  Activity,
  Bell
} from 'lucide-react';

interface AppointmentWithDetails {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  reason: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  consultation_type: string;
  status: string;
  fee: number;
  created_at: string;
  confirmed_at?: string;
  patients: {
    user_id: string;
    age: number;
    users: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  doctors: {
    user_id: string;
    specialty: string;
    users: {
      name: string;
      email: string;
    };
  };
}

interface DashboardStats {
  totalPending: number;
  totalConfirmed: number;
  totalToday: number;
  avgConfirmationTime: number;
  recentActivity: number;
}

const StaffOversightDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPending: 0,
    totalConfirmed: 0,
    totalToday: 0,
    avgConfirmationTime: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [doctorFilter, setDoctorFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
    loadDashboardStats();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('staff_appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          loadAppointments();
          loadDashboardStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Apply filters when appointments or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [appointments, searchTerm, statusFilter, dateFilter, doctorFilter]);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          doctor_id,
          service_type,
          reason,
          appointment_date,
          appointment_time,
          appointment_type,
          consultation_type,
          status,
          fee,
          created_at,
          confirmed_at,
          patients (
            user_id,
            age,
            users (
              name,
              email,
              phone
            )
          ),
          doctors (
            user_id,
            specialty,
            users (
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get counts by status
      const { data: pendingCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: confirmedCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed');

      const { data: todayCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('appointment_date', today);

      // Get recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: recentActivity } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      setStats({
        totalPending: pendingCount?.count || 0,
        totalConfirmed: confirmedCount?.count || 0,
        totalToday: todayCount?.count || 0,
        avgConfirmationTime: 0, // Calculate this if needed
        recentActivity: recentActivity?.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patients.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctors.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Date filter
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      filtered = filtered.filter(apt => apt.appointment_date === today);
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(apt => apt.appointment_date >= today);
    } else if (dateFilter === 'pending-urgent') {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      filtered = filtered.filter(apt => 
        apt.status === 'pending' && 
        new Date(apt.created_at) <= twoDaysAgo
      );
    }

    // Doctor filter
    if (doctorFilter !== 'all') {
      filtered = filtered.filter(apt => apt.doctor_id === doctorFilter);
    }

    setFilteredAppointments(filtered);
  };

  const getStatusBadge = (status: string, createdAt: string) => {
    const isUrgent = (new Date().getTime() - new Date(createdAt).getTime()) > (2 * 60 * 60 * 1000); // 2 hours

    switch (status) {
      case 'pending':
        return (
          <Badge 
            variant={isUrgent ? "destructive" : "secondary"}
            className={isUrgent ? "animate-pulse" : ""}
          >
            {isUrgent ? 'URGENT PENDING' : 'Pending'}
          </Badge>
        );
      case 'confirmed':
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
      case 'needs_reschedule':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Needs Reschedule</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-600">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const sendStaffIntervention = async (appointmentId: string, type: 'remind_doctor' | 'contact_patient' | 'auto_confirm') => {
    try {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) return;

      let notificationMessage = '';
      let targetUserId = '';

      switch (type) {
        case 'remind_doctor':
          targetUserId = appointment.doctors.user_id;
          notificationMessage = `⏰ STAFF REMINDER: Please confirm/respond to pending appointment with ${appointment.patients.users.name} scheduled for ${appointment.appointment_date}. It's been pending for over 2 hours.`;
          break;
        
        case 'contact_patient':
          targetUserId = appointment.patients.user_id;
          notificationMessage = `📞 STAFF UPDATE: We're following up on your appointment request. Our team is working to confirm your ${appointment.service_type} appointment scheduled for ${appointment.appointment_date}.`;
          break;
        
        case 'auto_confirm':
          // Auto-confirm the appointment
          const { error: updateError } = await supabase
            .from('appointments')
            .update({ 
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              doctor_notes: 'Auto-confirmed by staff oversight after 2+ hours'
            })
            .eq('id', appointmentId);

          if (updateError) throw updateError;

          // Notify patient of auto-confirmation
          await notificationService.createNotification({
            user_id: appointment.patients.user_id,
            title: '✅ Appointment Auto-Confirmed',
            message: `Your ${appointment.service_type} appointment on ${appointment.appointment_date} at ${formatTime(appointment.appointment_time)} has been confirmed by our staff.`,
            type: 'appointment',
            priority: 'high',
            is_read: false,
            related_appointment_id: appointmentId
          });

          // Notify doctor of auto-confirmation
          await notificationService.createNotification({
            user_id: appointment.doctors.user_id,
            title: '🏥 Staff Auto-Confirmed Appointment',
            message: `Staff has auto-confirmed your pending appointment with ${appointment.patients.users.name} on ${appointment.appointment_date}. No further action needed.`,
            type: 'appointment',
            priority: 'medium',
            is_read: false,
            related_appointment_id: appointmentId
          });

          toast({
            title: 'Appointment Auto-Confirmed',
            description: 'Appointment has been confirmed and all parties notified.',
          });

          loadAppointments();
          return;
      }

      // Send the notification
      if (targetUserId && notificationMessage) {
        await notificationService.createNotification({
          user_id: targetUserId,
          title: 'Staff Intervention',
          message: notificationMessage,
          type: 'system',
          priority: 'high',
          is_read: false,
          related_appointment_id: appointmentId
        });

        toast({
          title: 'Intervention Sent',
          description: `${type.replace('_', ' ')} intervention has been sent.`,
        });
      }

    } catch (error) {
      console.error('Error sending staff intervention:', error);
      toast({
        title: 'Error',
        description: 'Failed to send intervention. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const StatCard = ({ title, value, icon, trend, color = "blue" }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
            {trend && <p className="text-xs text-gray-500">{trend}</p>}
          </div>
          <div className={`p-3 bg-${color}-100 rounded-full`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Oversight Dashboard</h1>
          <p className="text-gray-600">Monitor and manage appointment workflow</p>
        </div>
        <Button onClick={loadAppointments} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Appointments"
          value={stats.totalPending}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
          trend={stats.totalPending > 5 ? "High volume" : "Normal"}
        />
        <StatCard
          title="Confirmed Today"
          value={stats.totalConfirmed}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.totalToday}
          icon={<Calendar className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Recent Activity"
          value={stats.recentActivity}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
          trend="Last 24 hours"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Patient, Doctor, Service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="needs_reschedule">Needs Reschedule</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date Filter</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="pending-urgent">Urgent Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <Button onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('today');
                setDoctorFilter('all');
              }} variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Appointments ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No appointments found</h3>
                <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Patient & Doctor Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{appointment.patients.users.name}</h4>
                            <p className="text-sm text-gray-600">→ Dr. {appointment.doctors.users.name}</p>
                          </div>
                          {getStatusBadge(appointment.status, appointment.created_at)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {appointment.appointment_date}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(appointment.appointment_time)}
                          </div>
                          <div className="flex items-center">
                            {appointment.consultation_type === 'video-call' ? (
                              <><Video className="h-4 w-4 mr-1" />Video</>
                            ) : (
                              <><MapPin className="h-4 w-4 mr-1" />In-Person</>
                            )}
                          </div>
                          <div>₱{appointment.fee?.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Service</p>
                        <p className="font-medium">{appointment.service_type}</p>
                        <p className="text-sm text-gray-600 capitalize">{appointment.appointment_type}</p>
                        <p className="text-xs text-gray-500 mt-1">{appointment.doctors.specialty}</p>
                      </div>

                      {/* Staff Actions */}
                      <div className="flex flex-col gap-2">
                        {appointment.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => sendStaffIntervention(appointment.id, 'remind_doctor')}
                              variant="outline"
                            >
                              <Bell className="h-4 w-4 mr-1" />
                              Remind Doctor
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => sendStaffIntervention(appointment.id, 'contact_patient')}
                              variant="outline"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Update Patient
                            </Button>
                            {(new Date().getTime() - new Date(appointment.created_at).getTime()) > (2 * 60 * 60 * 1000) && (
                              <Button
                                size="sm"
                                onClick={() => sendStaffIntervention(appointment.id, 'auto_confirm')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Auto-Confirm
                              </Button>
                            )}
                          </>
                        )}
                        
                        {appointment.patients.users.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${appointment.patients.users.phone}`)}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call Patient
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Reason</p>
                      <p className="text-sm">{appointment.reason}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffOversightDashboard;