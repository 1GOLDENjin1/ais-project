import React from 'react';
import { Button } from '@/components/ui/button';
import { CancelAppointmentModal } from '@/components/CancelAppointmentModal';
import { XCircle } from 'lucide-react';

interface CancelButtonProps {
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    doctor?: {
      name: string;
    };
    status: string;
  };
  onCancelled: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const CancelAppointmentButton: React.FC<CancelButtonProps> = ({
  appointment,
  onCancelled,
  variant = 'outline',
  size = 'sm'
}) => {
  // Don't render the button if appointment is already cancelled or completed
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return null;
  }

  return (
    <CancelAppointmentModal
      appointmentId={appointment.id}
      appointmentDate={appointment.appointment_date}
      appointmentTime={appointment.appointment_time}
      doctorName={appointment.doctor?.name || 'Doctor'}
      onCancelled={onCancelled}
    >
      <Button
        variant={variant}
        size={size}
        className="text-red-600 hover:text-red-700"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </CancelAppointmentModal>
  );
};

export default CancelAppointmentButton;