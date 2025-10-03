// PatientDashboard UI Fixes and Enhancements

import React, { useState, useCallback, useMemo } from 'react';
import { AppointmentDetailsModal } from '@/components/AppointmentDetailsModal';
import { EnhancedAppointmentCard } from '@/components/EnhancedAppointmentCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import databaseService from '@/services/databaseService';

export const useAppointmentActions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = useCallback((appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  }, []);

  const handleJoinVideoCall = useCallback(async (appointmentId: string) => {
    try {
      // Check if video call exists
      const { data: videoCall, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (videoCall) {
        // Open existing video call
        window.open(videoCall.call_link, '_blank');
        toast({
          title: "Joining Video Call",
          description: "Opening video consultation in new window...",
        });
      } else {
        // Create new video call
        // For now, open a generic video call link
        const videoLink = `https://meet.jit.si/appointment-${appointmentId}`;
        window.open(videoLink, '_blank');
        toast({
          title: "Video Call Started",
          description: "Video consultation has been initiated.",
        });
      }
    } catch (error) {
      console.error('Video call error:', error);
      toast({
        title: "Error",
        description: "Unable to start video call. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRescheduleAppointment = useCallback(async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      const result = await databaseService.AppointmentService.reschedule(appointmentId, newDate, newTime);
      if (result.success) {
        toast({
          title: "Appointment Rescheduled",
          description: `Your appointment has been moved to ${newDate} at ${newTime}.`,
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast({
        title: "Error",
        description: "Unable to reschedule appointment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const handleCancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    try {
      if (!reason || reason.trim() === '') {
        throw new Error('Cancellation reason is required');
      }
      
      const result = await databaseService.AppointmentService.cancel(appointmentId, reason);
      if (result.success) {
        toast({
          title: "Appointment Cancelled",
          description: "Your appointment has been cancelled successfully.",
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to cancel appointment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const handleMessageDoctor = useCallback((appointmentId: string) => {
    // Navigate to messaging or show messaging modal
    navigate(`/send-message?appointment=${appointmentId}`);
    toast({
      title: "Messages",
      description: "Opening messaging interface...",
    });
  }, [navigate, toast]);

  return {
    selectedAppointment,
    showDetailsModal,
    setShowDetailsModal,
    handleViewDetails,
    handleJoinVideoCall,
    handleRescheduleAppointment,
    handleCancelAppointment,
    handleMessageDoctor,
  };
};

export const AppointmentsList: React.FC<{
  appointments: any[];
  onAppointmentUpdate?: () => void;
}> = ({ appointments, onAppointmentUpdate }) => {
  const {
    selectedAppointment,
    showDetailsModal,
    setShowDetailsModal,
    handleViewDetails,
    handleJoinVideoCall,
    handleRescheduleAppointment,
    handleCancelAppointment,
    handleMessageDoctor,
  } = useAppointmentActions();

  // Memoize processed appointments to prevent unnecessary re-renders
  const processedAppointments = useMemo(() => {
    return appointments.map(appointment => ({
      ...appointment,
      doctor: {
        name: appointment.doctor_name || 'Unknown Doctor',
        specialty: appointment.doctor_specialty || 'General Medicine',
        rating: appointment.doctor_rating || 0,
      },
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      consultationType: appointment.consultation_type || 'in-person',
      duration: appointment.duration_minutes || 30,
    }));
  }, [appointments]);

  const handleAppointmentAction = useCallback(async (appointmentId: string, action: string) => {
    const appointment = processedAppointments.find(a => a.id === appointmentId);
    
    switch (action) {
      case 'view-details':
        handleViewDetails(appointment);
        break;
      case 'join-call':
        await handleJoinVideoCall(appointmentId);
        break;
      case 'message':
        handleMessageDoctor(appointmentId);
        break;
      default:
        console.log(`Unhandled action: ${action}`);
    }
  }, [processedAppointments, handleViewDetails, handleJoinVideoCall, handleMessageDoctor]);

  return (
    <>
      {processedAppointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments</h3>
          <p className="text-gray-500 mb-4">You don't have any appointments scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {processedAppointments.map((appointment) => (
            <EnhancedAppointmentCard
              key={appointment.id}
              appointment={appointment}
              onJoinCall={() => handleAppointmentAction(appointment.id, 'join-call')}
              onReschedule={() => handleViewDetails(appointment)}
              onCancel={() => handleViewDetails(appointment)}
              onMessage={() => handleAppointmentAction(appointment.id, 'view-details')}
              variant="detailed"
            />
          ))}
        </div>
      )}

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onJoinCall={() => selectedAppointment && handleJoinVideoCall(selectedAppointment.id)}
        onReschedule={() => {
          // Handle reschedule logic here
          console.log('Reschedule clicked');
        }}
        onCancel={() => {
          // Handle cancel logic here
          console.log('Cancel clicked');
        }}
        onMessage={() => selectedAppointment && handleMessageDoctor(selectedAppointment.id)}
      />
    </>
  );
};

export default AppointmentsList;