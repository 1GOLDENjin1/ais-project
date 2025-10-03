// ===================================================
// ENHANCED APPOINTMENT BOOKING WORKFLOW
// Optimal booking system with real-time notifications
// ===================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';
import { 
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Video,
  MapPin,
  CreditCard,
  Bell,
  Stethoscope
} from 'lucide-react';

interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating: number;
  is_available: boolean;
  users: {
    name: string;
    email: string;
  };
}

interface BookingData {
  doctorId: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'follow-up' | 'check-up' | 'emergency';
  consultationType: 'in-person' | 'video-call';
  reason: string;
  notes?: string;
  fee: number;
}

interface BookingWorkflowProps {
  onBookingComplete?: (appointmentId: string) => void;
}

const EnhancedBookingWorkflow: React.FC<BookingWorkflowProps> = ({ 
  onBookingComplete 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingData, setBookingData] = useState<BookingData>({
    doctorId: '',
    serviceType: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'consultation',
    consultationType: 'in-person',
    reason: '',
    notes: '',
    fee: 0
  });
  const [loading, setLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Steps configuration
  const steps = [
    { id: 0, title: 'Select Service', description: 'Choose the type of medical service' },
    { id: 1, title: 'Choose Doctor', description: 'Select your preferred doctor' },
    { id: 2, title: 'Pick Date & Time', description: 'Select appointment date and time' },
    { id: 3, title: 'Add Details', description: 'Provide appointment details' },
    { id: 4, title: 'Confirm Booking', description: 'Review and confirm your appointment' }
  ];

  // Load doctors on component mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Load available slots when doctor and date are selected
  useEffect(() => {
    if (bookingData.doctorId && bookingData.appointmentDate) {
      loadAvailableSlots();
    }
  }, [bookingData.doctorId, bookingData.appointmentDate]);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          user_id,
          specialty,
          consultation_fee,
          rating,
          is_available,
          users (
            name,
            email
          )
        `)
        .eq('is_available', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctors. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const loadAvailableSlots = async () => {
    try {
      // Check doctor's schedule and existing appointments
      const { data: schedule, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('start_time, end_time')
        .eq('doctor_id', bookingData.doctorId)
        .eq('available_date', bookingData.appointmentDate);

      if (scheduleError) throw scheduleError;

      // Get existing appointments for the selected date and doctor
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', bookingData.doctorId)
        .eq('appointment_date', bookingData.appointmentDate)
        .in('status', ['pending', 'confirmed']);

      if (appointmentsError) throw appointmentsError;

      // Generate available time slots
      const slots = generateTimeSlots(schedule, existingAppointments || []);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  };

  const generateTimeSlots = (schedules: any[], existingAppointments: any[]) => {
    const slots = [];
    const bookedTimes = existingAppointments.map(apt => apt.appointment_time);

    // Default time slots if no schedule defined (9 AM - 5 PM)
    if (schedules.length === 0) {
      for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === 17 && minute > 0) break;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          if (!bookedTimes.includes(timeString)) {
            const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            slots.push({ value: timeString, label: displayTime });
          }
        }
      }
    } else {
      // Use doctor's defined schedule
      schedules.forEach(schedule => {
        const startHour = parseInt(schedule.start_time.split(':')[0]);
        const startMinute = parseInt(schedule.start_time.split(':')[1]);
        const endHour = parseInt(schedule.end_time.split(':')[0]);
        const endMinute = parseInt(schedule.end_time.split(':')[1]);

        for (let hour = startHour; hour <= endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            if (hour === endHour && minute >= endMinute) break;
            if (hour === startHour && minute < startMinute) continue;

            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            if (!bookedTimes.includes(timeString)) {
              const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              slots.push({ value: timeString, label: displayTime });
            }
          }
        }
      });
    }

    return slots;
  };

  const handleBookAppointment = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to book an appointment.',
        variant: 'destructive'
      });
      return;
    }

    setIsBooking(true);
    try {
      // Get patient ID
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError) throw patientError;

      // Create appointment with "pending" status - OPTIMAL WORKFLOW
      const appointmentData = {
        patient_id: patient.id,
        doctor_id: bookingData.doctorId,
        service_type: bookingData.serviceType,
        reason: bookingData.reason,
        appointment_date: bookingData.appointmentDate,
        appointment_time: bookingData.appointmentTime,
        status: 'pending', // Always start as pending for doctor confirmation
        appointment_type: bookingData.appointmentType,
        consultation_type: bookingData.consultationType,
        duration_minutes: 30, // Default duration
        fee: bookingData.fee,
        notes: bookingData.notes
      };

      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // IMMEDIATE NOTIFICATIONS TO ALL PARTIES
      await sendBookingNotifications(newAppointment);

      // Success feedback
      toast({
        title: 'Appointment Booked Successfully!',
        description: 'Your appointment is pending confirmation. You will be notified once confirmed.',
      });

      onBookingComplete?.(newAppointment.id);

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'There was an error booking your appointment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsBooking(false);
    }
  };

  const sendBookingNotifications = async (appointment: any) => {
    try {
      const selectedDoctor = doctors.find(d => d.id === appointment.doctor_id);
      
      // 1. PATIENT NOTIFICATION
      await notificationService.createNotification({
        user_id: user!.id,
        title: 'Appointment Booked Successfully',
        message: `Your ${appointment.service_type} appointment with Dr. ${selectedDoctor?.users?.name} on ${appointment.appointment_date} at ${appointment.appointment_time} is pending confirmation.`,
        type: 'appointment',
        priority: 'medium',
        is_read: false,
        related_appointment_id: appointment.id
      });

      // 2. DOCTOR NOTIFICATION
      if (selectedDoctor?.user_id) {
        await notificationService.createNotification({
          user_id: selectedDoctor.user_id,
          title: 'New Appointment Request',
          message: `${user!.name} has booked a ${appointment.service_type} appointment on ${appointment.appointment_date} at ${appointment.appointment_time}. Please confirm or reschedule.`,
          type: 'appointment',
          priority: 'high',
          is_read: false,
          related_appointment_id: appointment.id
        });
      }

      // 3. STAFF NOTIFICATION (for oversight)
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('user_id')
        .limit(5); // Notify up to 5 staff members

      if (!staffError && staff) {
        for (const staffMember of staff) {
          await notificationService.createNotification({
            user_id: staffMember.user_id,
            title: 'New Patient Appointment',
            message: `New appointment: ${user!.name} → Dr. ${selectedDoctor?.users?.name} on ${appointment.appointment_date}. Monitor for confirmation.`,
            type: 'appointment',
            priority: 'low',
            is_read: false,
            related_appointment_id: appointment.id
          });
        }
      }

      console.log('✅ All booking notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step Components
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            <span className="text-xs mt-1 text-center max-w-20">{step.title}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const ServiceSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Service Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { value: 'General Consultation', icon: <Stethoscope className="h-5 w-5" /> },
          { value: 'Specialist Consultation', icon: <User className="h-5 w-5" /> },
          { value: 'Follow-up Visit', icon: <Clock className="h-5 w-5" /> },
          { value: 'Health Check-up', icon: <CheckCircle className="h-5 w-5" /> },
          { value: 'Emergency Consultation', icon: <AlertCircle className="h-5 w-5" /> },
          { value: 'Telemedicine', icon: <Video className="h-5 w-5" /> }
        ].map((service) => (
          <Button
            key={service.value}
            variant={bookingData.serviceType === service.value ? "default" : "outline"}
            className="justify-start h-12"
            onClick={() => setBookingData({...bookingData, serviceType: service.value})}
          >
            {service.icon}
            <span className="ml-2">{service.value}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  const DoctorSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose Your Doctor</h3>
      <div className="space-y-3">
        {doctors.map((doctor) => (
          <Card 
            key={doctor.id}
            className={`cursor-pointer transition-all ${
              bookingData.doctorId === doctor.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => {
              setBookingData({
                ...bookingData, 
                doctorId: doctor.id,
                fee: doctor.consultation_fee
              });
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{doctor.users.name}</h4>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-yellow-600">★ {doctor.rating.toFixed(1)}</span>
                    <Badge variant="secondary" className="ml-2">
                      ₱{doctor.consultation_fee?.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                {bookingData.doctorId === doctor.id && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const DateTimeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Date & Time</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Appointment Date</Label>
          <Input
            id="date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={bookingData.appointmentDate}
            onChange={(e) => setBookingData({...bookingData, appointmentDate: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="consultation-type">Consultation Type</Label>
          <Select
            value={bookingData.consultationType}
            onValueChange={(value: 'in-person' | 'video-call') => 
              setBookingData({...bookingData, consultationType: value})
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  In-Person Visit
                </div>
              </SelectItem>
              <SelectItem value="video-call">
                <div className="flex items-center">
                  <Video className="h-4 w-4 mr-2" />
                  Video Consultation
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {bookingData.appointmentDate && (
        <div>
          <Label>Available Time Slots</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
            {availableSlots.map((slot) => (
              <Button
                key={slot.value}
                variant={bookingData.appointmentTime === slot.value ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingData({...bookingData, appointmentTime: slot.value})}
              >
                {slot.label}
              </Button>
            ))}
          </div>
          {availableSlots.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No available slots for this date. Please select another date.
            </p>
          )}
        </div>
      )}
    </div>
  );

  const AppointmentDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Appointment Details</h3>
      
      <div>
        <Label htmlFor="appointment-type">Appointment Type</Label>
        <Select
          value={bookingData.appointmentType}
          onValueChange={(value: 'consultation' | 'follow-up' | 'check-up' | 'emergency') => 
            setBookingData({...bookingData, appointmentType: value})
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consultation">Consultation</SelectItem>
            <SelectItem value="follow-up">Follow-up</SelectItem>
            <SelectItem value="check-up">Check-up</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reason">Reason for Visit</Label>
        <Textarea
          id="reason"
          placeholder="Please describe your symptoms or reason for the appointment..."
          value={bookingData.reason}
          onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information for the doctor..."
          value={bookingData.notes}
          onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
        />
      </div>
    </div>
  );

  const BookingConfirmation = () => {
    const selectedDoctor = doctors.find(d => d.id === bookingData.doctorId);
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Confirm Your Appointment</h3>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Appointment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-600">Service</p>
                <p className="font-semibold">{bookingData.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Type</p>
                <p className="font-semibold capitalize">{bookingData.appointmentType}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Doctor</p>
                <p className="font-semibold">{selectedDoctor?.users.name}</p>
                <p className="text-sm text-blue-700">{selectedDoctor?.specialty}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Method</p>
                <p className="font-semibold capitalize flex items-center">
                  {bookingData.consultationType === 'video-call' 
                    ? <><Video className="h-4 w-4 mr-1" />Video Call</>
                    : <><MapPin className="h-4 w-4 mr-1" />In-Person</>
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Date & Time</p>
                <p className="font-semibold">{bookingData.appointmentDate}</p>
                <p className="text-sm text-blue-700">{
                  new Date(`2000-01-01T${bookingData.appointmentTime}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })
                }</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Fee</p>
                <p className="font-semibold">₱{bookingData.fee.toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-blue-600">Reason</p>
              <p className="text-sm">{bookingData.reason}</p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Bell className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800">What happens next?</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Your appointment will be saved with "pending" status</li>
                <li>• Doctor will be notified immediately and can confirm within minutes</li>
                <li>• Staff will monitor for any scheduling conflicts</li>
                <li>• You'll receive confirmation notification once approved</li>
                <li>• Auto-confirmation after 2 hours if no conflicts</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleBookAppointment}
          disabled={isBooking}
          className="w-full h-12"
          size="lg"
        >
          {isBooking ? 'Booking Appointment...' : 'Confirm Appointment'}
        </Button>
      </div>
    );
  };

  // Validation for next button
  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: return bookingData.serviceType !== '';
      case 1: return bookingData.doctorId !== '';
      case 2: return bookingData.appointmentDate !== '' && bookingData.appointmentTime !== '';
      case 3: return bookingData.reason.trim() !== '';
      default: return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Book Your Appointment</CardTitle>
          <StepIndicator />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === 0 && <ServiceSelection />}
          {currentStep === 1 && <DoctorSelection />}
          {currentStep === 2 && <DateTimeSelection />}
          {currentStep === 3 && <AppointmentDetails />}
          {currentStep === 4 && <BookingConfirmation />}

          {currentStep < 4 && (
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={nextStep}
                disabled={!canProceedToNext()}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBookingWorkflow;