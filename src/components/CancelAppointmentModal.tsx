import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { AppointmentService } from '../services/databaseService';

interface CancelAppointmentModalProps {
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  onCancelled: () => void;
  children: React.ReactNode;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  appointmentId,
  appointmentDate,
  appointmentTime,
  doctorName,
  onCancelled,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const { toast } = useToast();

  const cancellationReasons = [
    'Personal emergency',
    'Schedule conflict',
    'Feeling unwell',
    'Travel issues',
    'Family emergency',
    'Work commitment',
    'Financial reasons',
    'Doctor recommendation',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const cancellationReason = reason === 'Other' ? customReason : reason;
      const result = await AppointmentService.cancel(appointmentId, cancellationReason);

      if (result.success) {
        toast({
          title: "Appointment Cancelled",
          description: "Your appointment has been cancelled successfully. If applicable, any refunds will be processed within 3-5 business days.",
        });
        setOpen(false);
        onCancelled();
      } else {
        throw new Error(result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel appointment. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Appointment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-900">Appointment Details</h4>
            <p className="text-sm text-red-800">Doctor: {doctorName}</p>
            <p className="text-sm text-red-800">
              Date: {format(new Date(appointmentDate), 'PPP')} at {appointmentTime}
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900">Cancellation Policy</h4>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• Cancellations 24+ hours before: Full refund</li>
              <li>• Cancellations 2-24 hours before: 50% refund</li>
              <li>• Cancellations less than 2 hours: No refund</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Cancellation *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cancellation reason" />
                </SelectTrigger>
                <SelectContent>
                  {cancellationReasons.map((reasonOption) => (
                    <SelectItem key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reason === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Please specify *</Label>
                <Textarea
                  id="customReason"
                  placeholder="Please provide the reason for cancellation..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Keep Appointment
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? 'Cancelling...' : 'Cancel Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};