// ===================================================
// DOCTOR CONFIRMATION INTERFACE
// Mobile-friendly doctor interface for quick appointment confirmations
// ===================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Phone,
  MessageSquare,
  AlertTriangle,
  MapPin,
  Video,
  Edit3,
  Bell
} from 'lucide-react';

interface PendingAppointment {
  id: string;
  patient_id: string;
  service_type: string;
  reason: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  consultation_type: string;
  fee: number;
  notes: string;
  status: string;
  original_date?: string;
  original_time?: string;
  reschedule_reason?: string;
  reschedule_requested_by?: string;
  created_at: string;
  patients: {
    user_id: string;
    age: number;
    users: {
      name: string;
      email: string;
      phone?: string;
    };
  } | null;
}

interface DoctorConfirmationProps {
  doctorId?: string;
}

const DoctorConfirmationInterface: React.FC<DoctorConfirmationProps> = ({ 
  doctorId 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointment | null>(null);
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  useEffect(() => {
    loadPendingAppointments();
    
    // Subscribe to real-time appointment updates
    const subscription = supabase
      .channel('doctor_appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${getDoctorIdFromUser()}`
        },
        () => {
          loadPendingAppointments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getDoctorIdFromUser = async () => {
    if (doctorId) return doctorId;
    
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      return error ? null : data?.id;
    } catch {
      return null;
    }
  };

  const loadPendingAppointments = async () => {
    try {
      const currentDoctorId = await getDoctorIdFromUser();
      if (!currentDoctorId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          service_type,
          reason,
          appointment_date,
          appointment_time,
          appointment_type,
          consultation_type,
          fee,
          notes,
          status,
          original_date,
          original_time,
          reschedule_reason,
          reschedule_requested_by,
          created_at,
          patients (
            user_id,
            age,
            users (
              name,
              email,
              phone
            )
          )
        `)
        .eq('doctor_id', currentDoctorId)
        .in('status', ['pending', 'pending_reschedule_confirmation'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface (Supabase returns arrays for joins)
      const transformedData = (data || []).map(appointment => {
        const patientData = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients;
        if (patientData) {
          const userData = Array.isArray(patientData.users) ? patientData.users[0] : patientData.users;
          return {
            ...appointment,
            patients: {
              ...patientData,
              users: userData
            }
          } as PendingAppointment;
        }
        return appointment as unknown as PendingAppointment;
      }).filter(appointment => appointment.patients);
      
      setPendingAppointments(transformedData);
    } catch (error) {
      console.error('Error loading pending appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending appointments.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmAppointment = async (appointment: PendingAppointment) => {
    setActionLoading(appointment.id);
    try {
      // Update appointment status to confirmed
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      // Send confirmation notifications
      await sendConfirmationNotifications(appointment, 'confirmed');

      toast({
        title: 'Appointment Confirmed',
        description: `Appointment with ${appointment.patients.users.name} has been confirmed.`,
      });

      // Refresh the list
      loadPendingAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm appointment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const rescheduleAppointment = async (appointment: PendingAppointment) => {
    setActionLoading(appointment.id);
    try {
      // Update appointment status to needs_reschedule
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'needs_reschedule',
          doctor_notes: rescheduleNotes
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      // Send reschedule notifications
      await sendRescheduleNotifications(appointment, rescheduleNotes);

      toast({
        title: 'Reschedule Request Sent',
        description: `Patient will be notified to reschedule the appointment.`,
      });

      // Reset form and refresh
      setRescheduleNotes('');
      setSelectedAppointment(null);
      loadPendingAppointments();
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reschedule request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const sendConfirmationNotifications = async (appointment: PendingAppointment, status: string) => {
    try {
      // Patient notification
      await notificationService.createNotification({
        user_id: appointment.patients.user_id,
        title: '✅ Appointment Confirmed',
        message: `Great news! Your ${appointment.service_type} appointment on ${appointment.appointment_date} at ${formatTime(appointment.appointment_time)} has been confirmed by the doctor.`,
        type: 'appointment',
        priority: 'high',
        is_read: false,
        related_appointment_id: appointment.id
      });

      // Staff notification
      const { data: staff } = await supabase
        .from('staff')
        .select('user_id')
        .limit(3);

      if (staff) {
        for (const staffMember of staff) {
          await notificationService.createNotification({
            user_id: staffMember.user_id,
            title: 'Appointment Confirmed',
            message: `Dr. ${user?.name} confirmed appointment with ${appointment.patients.users.name} on ${appointment.appointment_date}.`,
            type: 'appointment',
            priority: 'low',
            is_read: false,
            related_appointment_id: appointment.id
          });
        }
      }
    } catch (error) {
      console.error('Error sending confirmation notifications:', error);
    }
  };

  const sendRescheduleNotifications = async (appointment: PendingAppointment, notes: string) => {
    try {
      // Patient notification
      await notificationService.createNotification({
        user_id: appointment.patients.user_id,
        title: '📅 Reschedule Required',
        message: `Your doctor has requested to reschedule your ${appointment.service_type} appointment. Reason: ${notes}. Please book a new time slot.`,
        type: 'appointment',
        priority: 'high',
        is_read: false,
        related_appointment_id: appointment.id
      });

      // Staff notification
      const { data: staff } = await supabase
        .from('staff')
        .select('user_id')
        .limit(3);

      if (staff) {
        for (const staffMember of staff) {
          await notificationService.createNotification({
            user_id: staffMember.user_id,
            title: 'Appointment Reschedule Request',
            message: `Dr. ${user?.name} requested reschedule for ${appointment.patients.users.name}'s appointment. Patient notified to rebook.`,
            type: 'appointment',
            priority: 'medium',
            is_read: false,
            related_appointment_id: appointment.id
          });
        }
      }
    } catch (error) {
      console.error('Error sending reschedule notifications:', error);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUrgencyBadge = (appointment: PendingAppointment) => {
    const createdAt = new Date(appointment.created_at);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (appointment.appointment_type === 'emergency') {
      return <Badge variant="destructive" className="text-xs">URGENT</Badge>;
    }
    
    if (hoursSinceCreated > 2) {
      return <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">Auto-confirm Soon</Badge>;
    }
    
    return <Badge variant="secondary" className="text-xs">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Appointment Confirmations</h1>
          <p className="text-gray-600">
            {pendingAppointments.length} pending appointment{pendingAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={loadPendingAppointments} variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {pendingAppointments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending appointments to confirm at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingAppointments.map((appointment) => (
            <Card key={appointment.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {appointment.patients.users.name}
                      </h3>
                      {getUrgencyBadge(appointment)}
                      <Badge variant="outline" className="text-xs">
                        Age {appointment.patients.age}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {appointment.appointment_date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(appointment.appointment_time)}
                      </div>
                      <div className="flex items-center">
                        {appointment.consultation_type === 'video-call' ? (
                          <><Video className="h-4 w-4 mr-2" />Video Call</>
                        ) : (
                          <><MapPin className="h-4 w-4 mr-2" />In-Person</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Service Type</p>
                      <p className="font-medium">{appointment.service_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                      <p className="font-medium capitalize">{appointment.appointment_type}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Reason for Visit</p>
                      <p className="text-sm">{appointment.reason}</p>
                    </div>
                    {appointment.notes && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Additional Notes</p>
                        <p className="text-sm">{appointment.notes}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Contact</p>
                      <p className="text-sm">{appointment.patients.users.email}</p>
                      {appointment.patients.users.phone && (
                        <p className="text-sm">{appointment.patients.users.phone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Fee</p>
                      <p className="font-medium">₱{appointment.fee?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => confirmAppointment(appointment)}
                    disabled={actionLoading === appointment.id}
                    className="flex-1 min-w-32"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading === appointment.id ? 'Confirming...' : 'Confirm'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedAppointment(appointment)}
                    className="flex-1 min-w-32"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>

                  {appointment.patients.users.phone && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`tel:${appointment.patients.users.phone}`)}
                      size="sm"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => window.open(`sms:${appointment.patients.users.phone}`)}
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Request Reschedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Appointment with <strong>{selectedAppointment.patients.users.name}</strong> on{' '}
                <strong>{selectedAppointment.appointment_date}</strong> at{' '}
                <strong>{formatTime(selectedAppointment.appointment_time)}</strong>
              </p>
              
              <div>
                <Label htmlFor="reschedule-reason">Reason for Reschedule</Label>
                <Textarea
                  id="reschedule-reason"
                  placeholder="Please provide a reason for the reschedule request..."
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => rescheduleAppointment(selectedAppointment)}
                  disabled={!rescheduleNotes.trim() || actionLoading === selectedAppointment.id}
                  className="flex-1"
                >
                  {actionLoading === selectedAppointment.id ? 'Sending...' : 'Send Request'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAppointment(null);
                    setRescheduleNotes('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DoctorConfirmationInterface;