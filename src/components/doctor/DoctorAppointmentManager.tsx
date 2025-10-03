import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Heart,
  Stethoscope
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies: string;
  medical_history: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  appointment_type: string;
  consultation_type: 'in-person' | 'video-call' | 'phone';
  duration_minutes: number;
  fee: number;
  notes: string;
  patient: Patient;
}

const DoctorAppointmentManager: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('today');

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Get doctor ID first
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (doctorError) throw doctorError;

      // Fetch appointments with patient data
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            date_of_birth,
            gender,
            blood_type,
            allergies,
            medical_history,
            user:users(name, email, phone)
          )
        `)
        .eq('doctor_id', doctorData.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      const formattedAppointments = appointmentsData.map(apt => ({
        ...apt,
        patient: {
          id: apt.patient.id,
          name: apt.patient.user.name,
          email: apt.patient.user.email,
          phone: apt.patient.user.phone,
          date_of_birth: apt.patient.date_of_birth,
          gender: apt.patient.gender,
          blood_type: apt.patient.blood_type,
          allergies: apt.patient.allergies,
          medical_history: apt.patient.medical_history
        }
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'default',
      cancelled: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  const filterAppointments = (filter: string) => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    switch (filter) {
      case 'today':
        return appointments.filter(apt => apt.appointment_date === todayStr);
      case 'upcoming':
        return appointments.filter(apt => 
          apt.appointment_date > todayStr && 
          ['pending', 'confirmed'].includes(apt.status)
        );
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed');
      case 'all':
      default:
        return appointments;
    }
  };

  const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{appointment.patient.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {getDateLabel(appointment.appointment_date)}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(parseISO(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(appointment.status)}
            <div className="text-sm text-gray-500 mt-1">
              {appointment.consultation_type === 'video-call' ? '📹 Video Call' : 
               appointment.consultation_type === 'phone' ? '📞 Phone Call' : '🏥 In-Person'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Patient Information</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {appointment.patient.email}
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                {appointment.patient.phone}
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-gray-400" />
                Blood Type: {appointment.patient.blood_type}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Appointment Details</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Service:</strong> {appointment.service_type}</div>
              <div><strong>Duration:</strong> {appointment.duration_minutes} minutes</div>
              <div><strong>Fee:</strong> ₱{appointment.fee?.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {appointment.reason && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Reason for Visit
            </h4>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{appointment.reason}</p>
          </div>
        )}

        {appointment.patient.allergies && (
          <div className="mb-4">
            <h4 className="font-medium text-red-600 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Allergies
            </h4>
            <p className="text-sm bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
              {appointment.patient.allergies}
            </p>
          </div>
        )}

        {appointment.patient.medical_history && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <Stethoscope className="w-4 h-4 mr-2" />
              Medical History
            </h4>
            <p className="text-sm bg-blue-50 p-3 rounded-lg">
              {appointment.patient.medical_history}
            </p>
          </div>
        )}

        <div className="flex space-x-2 pt-3 border-t">
          {appointment.status === 'pending' && (
            <>
              <Button 
                onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button 
                variant="outline"
                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          
          {appointment.status === 'confirmed' && (
            <Button 
              onClick={() => {
                // Navigate to consultation interface
                window.location.href = `/doctor/consultation/${appointment.id}`;
              }}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Start Consultation
            </Button>
          )}
          
          {appointment.status === 'completed' && (
            <Button 
              variant="outline"
              onClick={() => {
                // Navigate to view medical record
                window.location.href = `/doctor/medical-record/${appointment.id}`;
              }}
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Record
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">My Appointments</h1>
        <p className="opacity-90">Manage your patient appointments and consultations</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today ({filterAppointments('today').length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({filterAppointments('upcoming').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterAppointments('completed').length})</TabsTrigger>
          <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {filterAppointments('today').length > 0 ? (
            filterAppointments('today').map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No appointments scheduled for today</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {filterAppointments('upcoming').length > 0 ? (
            filterAppointments('upcoming').map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filterAppointments('completed').length > 0 ? (
            filterAppointments('completed').map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No completed appointments yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No appointments found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorAppointmentManager;