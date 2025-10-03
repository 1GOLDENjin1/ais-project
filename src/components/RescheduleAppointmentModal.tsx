import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AppointmentService } from '../services/databaseService';

interface RescheduleAppointmentModalProps {
  appointment?: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    doctor?: {
      name: string;
    };
  } | null;
  isOpen?: boolean;
  onClose?: () => void;
  // Legacy props for backward compatibility
  appointmentId?: string;
  currentDate?: string;
  currentTime?: string;
  doctorName?: string;
  onRescheduled?: () => void;
  children?: React.ReactNode;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  // Legacy props
  appointmentId,
  currentDate,
  currentTime,
  doctorName,
  onRescheduled,
  children
}) => {
  // Use new appointment object or fall back to legacy props
  const finalAppointmentId = appointment?.id || appointmentId || '';
  const finalCurrentDate = appointment?.appointment_date || currentDate || '';
  const finalCurrentTime = appointment?.appointment_time || currentTime || '';
  const finalDoctorName = appointment?.doctor?.name || doctorName || 'Doctor';
  const finalIsOpen = isOpen !== undefined ? isOpen : false;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string, formatStr: string) => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatStr);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (finalIsOpen) {
      setSelectedDate(undefined);
      setSelectedTime('');
      setReason('');
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [finalIsOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select both date and time for the new appointment.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const newDate = format(selectedDate, 'yyyy-MM-dd');
      const result = await AppointmentService.reschedule(finalAppointmentId, newDate, selectedTime, reason);

      if (result.success) {
        toast({
          title: "Reschedule Request Sent",
          description: "Your reschedule request has been sent to the doctor for confirmation. You will be notified once approved.",
        });
        setOpen(false);
        onClose?.();
        onRescheduled?.();
      } else {
        throw new Error(result.error || 'Failed to reschedule appointment');
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Disable past dates and Sundays
  };

  // Don't render if no appointment data and no legacy props
  if (!appointment && !appointmentId) {
    return null;
  }

  return (
    <Dialog open={finalIsOpen || open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setOpen(false);
        onClose?.();
      }
    }}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">Current Appointment</h4>
            <p className="text-sm text-gray-600">Doctor: {finalDoctorName}</p>
            <p className="text-sm text-gray-600">
              Current Date: {safeFormatDate(finalCurrentDate, 'PPP')} at {finalCurrentTime}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Select new date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">New Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Please let us know why you need to reschedule..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  onClose?.();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Rescheduling...' : 'Reschedule'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};