import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import type { Appointment } from '@/lib/db';

interface ReschedulePolicy {
  freeRescheduleHours: number;
  rescheduleFeeBefore: number;
  cancelFeeAfter: number;
  maxReschedules: number;
}

interface AppointmentRescheduleProps {
  appointment: Appointment;
  onRescheduleSuccess: (updatedAppointment: Appointment) => void;
  onCancel: () => void;
}

interface AvailableSlot {
  date: string;
  time: string;
  doctorName: string;
  fee: number;
}

export const AppointmentReschedule: React.FC<AppointmentRescheduleProps> = ({
  appointment,
  onRescheduleSuccess,
  onCancel
}) => {
  const [selectedAction, setSelectedAction] = useState<'reschedule' | 'cancel'>('reschedule');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [reschedulePolicy] = useState<ReschedulePolicy>({
    freeRescheduleHours: 24,
    rescheduleFeeBefore: 200,
    cancelFeeAfter: 500,
    maxReschedules: 3
  });

  const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
  const hoursUntilAppointment = (appointmentDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const canRescheduleForFree = hoursUntilAppointment > reschedulePolicy.freeRescheduleHours;
  const rescheduleCount = 0; // This would come from the reschedule history table

  useEffect(() => {
    if (selectedAction === 'reschedule') {
      loadAvailableSlots();
    }
  }, [selectedAction]);

  const loadAvailableSlots = async () => {
    try {
      // Get available time slots for the next 30 days
      const slots: AvailableSlot[] = [];
      const today = new Date();
      
      // Generate next 30 days
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Generate time slots (9 AM to 5 PM, every 30 minutes)
        for (let hour = 9; hour <= 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 17 && minute > 0) break; // Stop at 5:00 PM
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Check if this slot is available (simplified logic)
            const isAvailable = Math.random() > 0.3; // 70% availability simulation
            
            if (isAvailable) {
              slots.push({
                date: dateString,
                time: timeString,
                doctorName: 'Available',
                fee: appointment.fee || 0
              });
            }
          }
        }
      }
      
      setAvailableSlots(slots.slice(0, 50)); // Limit to 50 slots for performance
    } catch (error) {
      console.error('Error loading available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available appointment slots",
        variant: "destructive"
      });
    }
  };

  const calculateFees = () => {
    const fees = {
      reschedule: 0,
      cancel: 0,
      refund: 0
    };

    if (selectedAction === 'reschedule') {
      if (!canRescheduleForFree) {
        fees.reschedule = reschedulePolicy.rescheduleFeeBefore;
      }
    } else if (selectedAction === 'cancel') {
      if (hoursUntilAppointment < reschedulePolicy.freeRescheduleHours) {
        fees.cancel = reschedulePolicy.cancelFeeAfter;
        fees.refund = Math.max(0, (appointment.fee || 0) - fees.cancel);
      } else {
        fees.refund = appointment.fee || 0;
      }
    }

    return fees;
  };

  const handleSubmit = async () => {
    if (selectedAction === 'reschedule') {
      if (!newDate || !newTime) {
        toast({
          title: "Missing Information",
          description: "Please select a new date and time for your appointment",
          variant: "destructive"
        });
        return;
      }
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this change",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (selectedAction === 'reschedule') {
        await handleReschedule();
      } else {
        await handleCancellation();
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    const fees = calculateFees();
    
    // Create reschedule record
    const rescheduleRecord = {
      appointmentId: appointment.id,
      originalDate: appointment.appointmentDate,
      originalTime: appointment.appointmentTime,
      newDate,
      newTime,
      rescheduleReason: reason,
      rescheduleFee: fees.reschedule,
      rescheduledBy: 'patient', // This would be the actual user ID
      rescheduleType: 'patient_request' as const
    };

    // Update appointment
    const updatedAppointment = await db.updateAppointmentStatus(appointment.id, 'confirmed');
    // Note: In a real implementation, you would update the date/time as well
    // For now, we'll simulate the update
    const appointmentToReturn = {
      ...appointment,
      appointmentDate: newDate,
      appointmentTime: newTime,
      status: 'confirmed' as const
    };

    if (updatedAppointment) {
      // Create notification
      await db.createNotification({
        userId: appointment.patientId,
        title: "Appointment Rescheduled Successfully",
        message: `Your appointment has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newTime}${fees.reschedule > 0 ? `. Reschedule fee: ₱${fees.reschedule}` : ''}`,
        type: 'appointment',
        priority: 'medium',
        isRead: false,
        relatedAppointmentId: appointment.id
      });

      // If there's a fee, create payment record
      if (fees.reschedule > 0) {
        await db.createPayment({
          patient_id: appointment.patientId,
          appointment_id: appointment.id,
          amount: fees.reschedule,
          payment_type: 'procedure',
          payment_method: 'online',
          status: 'pending',
          description: `Reschedule fee for appointment on ${new Date(newDate).toLocaleDateString()}`
        });
      }

      toast({
        title: "Appointment Rescheduled! 🎉",
        description: `Your appointment has been moved to ${new Date(newDate).toLocaleDateString()} at ${newTime}`,
      });

      onRescheduleSuccess(appointmentToReturn);
    } else {
      throw new Error('Failed to update appointment');
    }
  };

  const handleCancellation = async () => {
    const fees = calculateFees();
    
    // Update appointment status to cancelled
    const updatedAppointment = await db.updateAppointmentStatus(appointment.id, 'cancelled');

    if (updatedAppointment) {
      // Create notification
      await db.createNotification({
        userId: appointment.patientId,
        title: "Appointment Cancelled",
        message: `Your appointment for ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime} has been cancelled${fees.refund > 0 ? `. Refund of ₱${fees.refund} will be processed` : ''}${fees.cancel > 0 ? `. Cancellation fee: ₱${fees.cancel}` : ''}`,
        type: 'appointment',
        priority: 'medium',
        isRead: false,
        relatedAppointmentId: appointment.id
      });

      // Handle refund/cancellation fee
      if (fees.refund > 0 || fees.cancel > 0) {
        await db.createPayment({
          patient_id: appointment.patientId,
          appointment_id: appointment.id,
          amount: fees.cancel > 0 ? -fees.refund : fees.refund,
          payment_type: 'procedure',
          payment_method: 'bank_transfer',
          status: 'completed',
          description: fees.cancel > 0 
            ? `Partial refund after cancellation fee (₱${fees.cancel} deducted)`
            : 'Full refund for cancelled appointment'
        });
      }

      toast({
        title: "Appointment Cancelled",
        description: `Your appointment has been cancelled${fees.refund > 0 ? `. Refund of ₱${fees.refund} will be processed` : ''}`,
      });

      onRescheduleSuccess(updatedAppointment);
    } else {
      throw new Error('Failed to cancel appointment');
    }
  };

  const fees = calculateFees();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Modify Appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Appointment Info */}
          <Card className="bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Time: {appointment.appointmentTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span>Fee: ₱{(appointment.fee || 0).toLocaleString()}</span>
                </div>
                <div>
                  <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Information */}
          <Card className={hoursUntilAppointment < reschedulePolicy.freeRescheduleHours ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {hoursUntilAppointment < reschedulePolicy.freeRescheduleHours ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                Reschedule Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Time until appointment:</strong> {Math.round(hoursUntilAppointment)} hours
                </p>
                <p>
                  <strong>Free reschedule:</strong> {canRescheduleForFree ? '✅ Available' : '❌ Not available'} 
                  (must be {reschedulePolicy.freeRescheduleHours}+ hours before)
                </p>
                <p>
                  <strong>Reschedule fee:</strong> ₱{reschedulePolicy.rescheduleFeeBefore} (if within {reschedulePolicy.freeRescheduleHours} hours)
                </p>
                <p>
                  <strong>Cancellation policy:</strong> ₱{reschedulePolicy.cancelFeeAfter} fee if cancelled within {reschedulePolicy.freeRescheduleHours} hours
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          <div>
            <Label className="text-base font-semibold mb-4 block">What would you like to do?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer border-2 ${selectedAction === 'reschedule' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedAction('reschedule')}
              >
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Reschedule Appointment</h3>
                  <p className="text-sm text-gray-600 mt-1">Change date and time</p>
                  {fees.reschedule > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      Fee: ₱{fees.reschedule}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer border-2 ${selectedAction === 'cancel' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                onClick={() => setSelectedAction('cancel')}
              >
                <CardContent className="p-4 text-center">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <h3 className="font-semibold">Cancel Appointment</h3>
                  <p className="text-sm text-gray-600 mt-1">Cancel this appointment</p>
                  {fees.refund > 0 ? (
                    <Badge variant="default" className="mt-2 bg-green-600">
                      Refund: ₱{fees.refund}
                    </Badge>
                  ) : fees.cancel > 0 ? (
                    <Badge variant="destructive" className="mt-2">
                      Fee: ₱{fees.cancel}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="mt-2 bg-green-600">
                      Full Refund
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Reschedule Options */}
          {selectedAction === 'reschedule' && (
            <Card>
              <CardHeader>
                <CardTitle>Select New Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newDate">New Date</Label>
                    <Input
                      id="newDate"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Tomorrow minimum
                    />
                  </div>
                  <div>
                    <Label htmlFor="newTime">New Time</Label>
                    <Select onValueChange={setNewTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots
                          .filter(slot => slot.date === newDate)
                          .map((slot, index) => (
                            <SelectItem key={index} value={slot.time}>
                              {new Date(`2000-01-01T${slot.time}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Available Slots Preview */}
                {newDate && (
                  <div>
                    <Label className="block mb-2">Available times for {new Date(newDate).toLocaleDateString()}:</Label>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {availableSlots
                        .filter(slot => slot.date === newDate)
                        .map((slot, index) => (
                          <Button
                            key={index}
                            variant={newTime === slot.time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewTime(slot.time)}
                            className="text-xs"
                          >
                            {new Date(`2000-01-01T${slot.time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </Button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">
              Reason for {selectedAction === 'reschedule' ? 'Rescheduling' : 'Cancellation'} *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Please provide a reason for ${selectedAction === 'reschedule' ? 'rescheduling' : 'cancelling'} your appointment...`}
              rows={3}
            />
          </div>

          {/* Fee Summary */}
          {(fees.reschedule > 0 || fees.cancel > 0 || fees.refund > 0) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  Fee Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fees.reschedule > 0 && (
                    <div className="flex justify-between">
                      <span>Reschedule Fee:</span>
                      <span className="font-semibold">₱{fees.reschedule}</span>
                    </div>
                  )}
                  {fees.cancel > 0 && (
                    <div className="flex justify-between">
                      <span>Cancellation Fee:</span>
                      <span className="font-semibold text-red-600">₱{fees.cancel}</span>
                    </div>
                  )}
                  {fees.refund > 0 && (
                    <div className="flex justify-between">
                      <span>Refund Amount:</span>
                      <span className="font-semibold text-green-600">₱{fees.refund}</span>
                    </div>
                  )}
                  {selectedAction === 'cancel' && fees.refund === 0 && fees.cancel === 0 && (
                    <div className="flex justify-between">
                      <span>Full Refund:</span>
                      <span className="font-semibold text-green-600">₱{appointment.fee || 0}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button onClick={onCancel} variant="outline">
              Keep Original Appointment
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              variant={selectedAction === 'cancel' ? 'destructive' : 'default'}
            >
              {isLoading ? 'Processing...' : 
               selectedAction === 'reschedule' ? 'Reschedule Appointment' : 'Cancel Appointment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};