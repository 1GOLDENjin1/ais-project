import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Phone,
  Mail,
  Bell,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import StaffManagementService, { type StaffAppointment } from '@/services/staffDatabaseService';
import PatientInfoModal from '@/components/modals/PatientInfoModal';
import DoctorInfoModal from '@/components/modals/DoctorInfoModal';

interface AppointmentManagementProps {
  appointments?: StaffAppointment[];
  onRefresh?: () => void;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ 
  appointments: propAppointments,
  onRefresh 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [appointments, setAppointments] = useState<StaffAppointment[]>(propAppointments || []);
  const [loading, setLoading] = useState(!propAppointments);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<StaffAppointment | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | 'complete' | 'reminder'>('confirm');
  const [notes, setNotes] = useState('');
  
  // Modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Load appointments if not provided via props
  useEffect(() => {
    if (!propAppointments) {
      loadAppointments();
    }

    // Set up realtime subscription for appointments
    const appointmentSubscription = StaffManagementService.subscribeToAppointments((payload) => {
      console.log('Real-time appointment update:', payload);
      
      // Reload appointments when changes occur
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
        loadAppointments();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      StaffManagementService.unsubscribe(appointmentSubscription);
    };
  }, [propAppointments]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await StaffManagementService.getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler functions
  const handleConfirmAppointment = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setActionType('confirm');
    setShowConfirmDialog(true);
  };

  const handleCancelAppointment = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setActionType('cancel');
    setShowCancelDialog(true);
  };

  const handleCompleteAppointment = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setActionType('complete');
    setShowConfirmDialog(true);
  };

  const handleSendReminder = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setActionType('reminder');
    setShowReminderDialog(true);
  };

  const handleViewPatient = (appointment: StaffAppointment) => {
    // Create patient info from available appointment data
    const patientInfo = {
      id: appointment.patient_id,
      name: appointment.patient?.users?.name || 'Unknown Patient',
      phone: appointment.patient?.users?.phone || 'Not available',
      email: appointment.patient?.users?.email || 'Not available'
    };
    
    setSelectedPatient(patientInfo);
    setShowPatientModal(true);
  };

  const handleViewDoctor = (appointment: StaffAppointment) => {
    // Create doctor info from available appointment data
    const doctorInfo = {
      id: appointment.doctor_id,
      name: appointment.doctor?.users?.name || 'Unknown Doctor',
      specialty: appointment.doctor?.specialty || 'General Medicine',
      title: 'Dr.',
      phone: appointment.doctor?.users?.phone || 'Not available',
      email: appointment.doctor?.users?.email || 'Not available'
    };
    
    setSelectedDoctor(doctorInfo);
    setShowDoctorModal(true);
  };

  const executeAction = async () => {
    if (!selectedAppointment) return;

    try {
      let success = false;
      const appointmentId = selectedAppointment.id;

      switch (actionType) {
        case 'confirm':
          success = await StaffManagementService.updateAppointmentStatus(
            appointmentId, 
            'confirmed', 
            `Confirmed by staff: ${user?.name || user?.id}. ${notes}`
          );
          break;
        case 'cancel':
          success = await StaffManagementService.updateAppointmentStatus(
            appointmentId, 
            'cancelled', 
            `Cancelled by staff: ${user?.name || user?.id}. Reason: ${notes}`
          );
          break;
        case 'complete':
          success = await StaffManagementService.updateAppointmentStatus(
            appointmentId, 
            'completed', 
            `Completed by staff: ${user?.name || user?.id}. ${notes}`
          );
          break;
        case 'reminder':
          success = await StaffManagementService.sendAppointmentReminder(appointmentId);
          break;
      }

      if (success) {
        toast({
          title: "Success",
          description: `Appointment ${actionType}${actionType === 'reminder' ? ' sent' : 'ed'} successfully.`,
        });

        // Update local state
        if (actionType !== 'reminder') {
          const updatedAppointments = appointments.map(apt => 
            apt.id === appointmentId 
              ? { 
                  ...apt, 
                  status: actionType === 'confirm' ? 'confirmed' : 
                          actionType === 'cancel' ? 'cancelled' : 'completed' 
                } 
              : apt
          );
          setAppointments(updatedAppointments);
        }

        // Notify patient
        if (selectedAppointment.patient_id) {
          await StaffManagementService.sendNotification(
            selectedAppointment.patient_id,
            `Appointment ${actionType === 'confirm' ? 'Confirmed' : 
                            actionType === 'cancel' ? 'Cancelled' : 
                            actionType === 'complete' ? 'Completed' : 'Reminder'}`,
            `Your appointment on ${new Date(selectedAppointment.appointment_date).toLocaleDateString()} at ${selectedAppointment.appointment_time} has been ${actionType}${actionType === 'reminder' ? ' - this is a reminder' : 'ed'}.`,
            'appointment',
            actionType === 'cancel' ? 'high' : 'medium'
          );
        }

        if (onRefresh) onRefresh();
      } else {
        throw new Error(`Failed to ${actionType} appointment`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing appointment:`, error);
      toast({
        title: "Action Failed",
        description: `Failed to ${actionType} appointment. Please try again.`,
        variant: "destructive"
      });
    }

    // Reset state
    setShowConfirmDialog(false);
    setShowCancelDialog(false);
    setShowReminderDialog(false);
    setSelectedAppointment(null);
    setNotes('');
  };

  const getStatusColor = (status: StaffAppointment['status']) => {
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

  const getStatusIcon = (status: StaffAppointment['status']) => {
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

  const canModifyAppointment = (appointment: StaffAppointment) => {
    return appointment.status === 'pending' || appointment.status === 'confirmed';
  };

  const todayAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.appointment_date);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  });

  const upcomingAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.appointment_date);
    const today = new Date();
    return appointmentDate > today;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Clock className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading appointments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Appointments */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Today's Appointments ({todayAppointments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {appointment.patient?.users?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </div>
                    <div>
                      <p 
                        className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleViewPatient(appointment)}
                      >
                        {appointment.patient?.users?.name || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-blue-600">{appointment.service_type}</p>
                      <p className="text-xs text-gray-500">
                        {appointment.appointment_time} • 
                        <span 
                          className="cursor-pointer hover:text-blue-600 transition-colors underline"
                          onClick={() => handleViewDoctor(appointment)}
                        >
                          Dr. {appointment.doctor?.users?.name || 'Unknown'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.patient?.users?.phone && (
                          <span className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{appointment.patient.users.phone}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={`${getStatusColor(appointment.status)} flex items-center space-x-1`}>
                    {getStatusIcon(appointment.status)}
                    <span className="capitalize">{appointment.status}</span>
                  </Badge>
                  
                  <div className="flex space-x-2">
                    {appointment.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleConfirmAppointment(appointment)}
                          className="hover:bg-green-50 hover:border-green-300 border-green-200 text-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCancelAppointment(appointment)}
                          className="hover:bg-red-50 hover:border-red-300 border-red-200 text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}

                    {appointment.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCompleteAppointment(appointment)}
                        className="hover:bg-blue-50 hover:border-blue-300 border-blue-200 text-blue-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}

                    {canModifyAppointment(appointment) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSendReminder(appointment)}
                        className="hover:bg-orange-50 hover:border-orange-300 border-orange-200 text-orange-600"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Remind
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (appointment.patient?.users?.phone) {
                          window.open(`tel:${appointment.patient.users.phone}`);
                        }
                      }}
                      className="hover:bg-gray-50 hover:border-gray-300 border-gray-200 text-gray-600"
                      disabled={!appointment.patient?.users?.phone}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {todayAppointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No appointments scheduled for today.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Upcoming Appointments ({upcomingAppointments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingAppointments.slice(0, 10).map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p 
                        className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleViewPatient(appointment)}
                      >
                        {appointment.patient?.users?.name || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.service_type} • {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                      </p>
                      <p className="text-xs text-blue-600">
                        <span 
                          className="cursor-pointer hover:text-blue-800 transition-colors underline"
                          onClick={() => handleViewDoctor(appointment)}
                        >
                          Dr. {appointment.doctor?.users?.name || 'Unknown'}
                        </span>
                         • {appointment.doctor?.specialty || 'General'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={`${getStatusColor(appointment.status)} flex items-center space-x-1`}>
                    {getStatusIcon(appointment.status)}
                    <span className="capitalize">{appointment.status}</span>
                  </Badge>
                  
                  <div className="flex space-x-2">
                    {appointment.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleConfirmAppointment(appointment)}
                        className="hover:bg-green-50 hover:border-green-300"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSendReminder(appointment)}
                      className="hover:bg-orange-50 hover:border-orange-300"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Remind
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {upcomingAppointments.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'confirm' ? 'Confirm Appointment' :
               actionType === 'complete' ? 'Mark as Completed' : 'Action Confirmation'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'confirm' 
                ? `Confirm this appointment for ${selectedAppointment?.patient?.users?.name}?`
                : `Mark this appointment as completed for ${selectedAppointment?.patient?.users?.name}?`
              }
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="py-4">
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Patient:</span>
                  <span>{selectedAppointment.patient?.users?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Service:</span>
                  <span>{selectedAppointment.service_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date & Time:</span>
                  <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}</span>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="action-notes">Notes (optional)</Label>
                <Textarea 
                  id="action-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeAction}>
              {actionType === 'confirm' ? 'Confirm' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action will notify the patient.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="py-4">
              <div className="p-4 bg-red-50 rounded-lg space-y-2 border border-red-200">
                <div className="flex justify-between">
                  <span className="font-medium">Patient:</span>
                  <span>{selectedAppointment.patient?.users?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Service:</span>
                  <span>{selectedAppointment.service_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date & Time:</span>
                  <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}</span>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="cancel-reason">Reason for cancellation *</Label>
                <Textarea 
                  id="cancel-reason"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  className="mt-2"
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Appointment
            </Button>
            <Button 
              variant="destructive" 
              onClick={executeAction}
              disabled={!notes.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Confirmation Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Appointment Reminder</DialogTitle>
            <DialogDescription>
              Send a reminder notification to {selectedAppointment?.patient?.users?.name}?
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="py-4">
              <div className="p-4 bg-orange-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Appointment Reminder</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Patient will receive a notification about their appointment:</p>
                  <p className="font-medium mt-2">
                    {selectedAppointment.service_type} on {new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeAction}>
              <Bell className="h-4 w-4 mr-2" />
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Information Modal */}
      <PatientInfoModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        patient={selectedPatient}
      />

      {/* Doctor Information Modal */}
      <DoctorInfoModal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        doctor={selectedDoctor}
      />
    </div>
  );
};

export default AppointmentManagement;