// ===================================================
// VIDEO CONSULTATION BOOKING INTEGRATION
// Integrates video call functionality into the appointment booking system
// ===================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoSDKService } from '@/services/videoSDKService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Monitor,
  CheckCircle, 
  AlertCircle, 
  Info,
  Wifi
} from 'lucide-react';

interface VideoConsultationBookingProps {
  doctorId: string;
  doctorName: string;
  specialty: string;
  consultationFee: number;
  videoConsultationFee?: number;
  onBookingComplete?: (appointmentData: any, videoCallData?: any) => void;
}

export function VideoConsultationBooking({
  doctorId,
  doctorName,
  specialty,
  consultationFee,
  videoConsultationFee = consultationFee,
  onBookingComplete
}: VideoConsultationBookingProps) {
  const [consultationType, setConsultationType] = useState<'in-person' | 'video-call'>('in-person');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, doctorId]);

  const loadAvailableSlots = async () => {
    try {
      // Load doctor's available time slots for the selected date
      const { data: schedule } = await supabase
        .from('doctor_schedules')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('available_date', selectedDate);

      if (schedule && schedule.length > 0) {
        // Generate time slots (this is simplified - in production you'd check for existing appointments)
        const slots = [];
        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM
        
        for (let hour = startHour; hour < endHour; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      setBookingError('Please select both date and time');
      return;
    }

    setIsLoading(true);
    setBookingError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get patient ID
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patient) throw new Error('Patient profile not found');

      // Create appointment
      const appointmentData = {
        patient_id: patient.id,
        doctor_id: doctorId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        service_type: `${specialty} Consultation`,
        consultation_type: consultationType,
        status: 'confirmed',
        fee: consultationType === 'video-call' ? videoConsultationFee : consultationFee,
        appointment_type: 'consultation'
      };

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      let videoCallData = null;

      // If it's a video consultation, create video call record
      if (consultationType === 'video-call') {
        const videoSDKService = VideoSDKService.getInstance();
        
        try {
          const videoCallSession = await videoSDKService.startVideoCallSession({
            appointmentId: appointment.id,
            doctorId: doctorId,
            patientId: patient.id,
            enableRecording: true
          });

          videoCallData = videoCallSession;

          // Create notification for video call
          await supabase
            .from('notifications')
            .insert([
              {
                user_id: user.id,
                title: 'Video Consultation Scheduled',
                message: `Your video consultation with Dr. ${doctorName} is scheduled for ${selectedDate} at ${selectedTime}. You will receive a link to join the call.`,
                type: 'appointment',
                priority: 'high',
                related_appointment_id: appointment.id
              },
              {
                user_id: doctorId,
                title: 'New Video Consultation',
                message: `New video consultation scheduled for ${selectedDate} at ${selectedTime}. Patient: ${user.email}`,
                type: 'appointment',
                priority: 'medium',
                related_appointment_id: appointment.id
              }
            ]);
        } catch (videoError) {
          console.error('Error creating video call:', videoError);
          // Continue with appointment booking even if video call setup fails
          // We can create the video call later
        }
      } else {
        // Regular appointment notification
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: user.id,
              title: 'Appointment Confirmed',
              message: `Your appointment with Dr. ${doctorName} is confirmed for ${selectedDate} at ${selectedTime}.`,
              type: 'appointment',
              priority: 'medium',
              related_appointment_id: appointment.id
            },
            {
              user_id: doctorId,
              title: 'New Appointment',
              message: `New appointment scheduled for ${selectedDate} at ${selectedTime}. Patient: ${user.email}`,
              type: 'appointment',
              priority: 'medium',
              related_appointment_id: appointment.id
            }
          ]);
      }

      // Call completion callback
      if (onBookingComplete) {
        onBookingComplete(appointment, videoCallData);
      }

      console.log('✅ Appointment booked successfully');

    } catch (error) {
      console.error('❌ Error booking appointment:', error);
      setBookingError(error instanceof Error ? error.message : 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) { // Next 14 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Sundays (assuming clinic is closed)
      if (date.getDay() !== 0) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  return (
    <div className="space-y-6">
      {/* Consultation Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Choose Consultation Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={consultationType}
            onValueChange={(value) => setConsultationType(value as 'in-person' | 'video-call')}
            className="space-y-4"
          >
            {/* In-Person Option */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="in-person" id="in-person" className="mt-1" />
              <Label htmlFor="in-person" className="flex-1 cursor-pointer">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">In-Person Consultation</span>
                  <Badge variant="outline">₱{consultationFee.toLocaleString()}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Visit the clinic for face-to-face consultation with physical examination.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  ✓ Physical examination included • ✓ Lab tests available on-site
                </div>
              </Label>
            </div>

            {/* Video Call Option */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="video-call" id="video-call" className="mt-1" />
              <Label htmlFor="video-call" className="flex-1 cursor-pointer">
                <div className="flex items-center space-x-2 mb-2">
                  <Video className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Video Consultation</span>
                  <Badge variant="outline">₱{videoConsultationFee.toLocaleString()}</Badge>
                  <Badge variant="secondary" className="text-xs">Convenient</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Consult with the doctor from the comfort of your home via secure video call.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  ✓ Secure & private • ✓ No travel needed • ✓ Prescription delivery available
                </div>
              </Label>
            </div>
          </RadioGroup>

          {consultationType === 'video-call' && (
            <Alert className="mt-4">
              <Wifi className="h-4 w-4" />
              <AlertDescription>
                <strong>Video Consultation Requirements:</strong>
                <ul className="mt-1 text-sm list-disc list-inside">
                  <li>Stable internet connection (minimum 1 Mbps)</li>
                  <li>Device with camera and microphone</li>
                  <li>Quiet, well-lit space for consultation</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Date & Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Select Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selection */}
          <div>
            <Label className="text-sm font-medium">Select Date</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
              {generateDateOptions().map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                  className="text-xs"
                >
                  {new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <Label className="text-sm font-medium">Select Time</Label>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                  {availableSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className="text-xs"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No available slots for this date. Please select another date.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Summary */}
      {selectedDate && selectedTime && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Doctor:</span>
              <span className="text-sm">Dr. {doctorName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Specialty:</span>
              <span className="text-sm">{specialty}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Type:</span>
              <div className="flex items-center space-x-2">
                {consultationType === 'video-call' ? (
                  <>
                    <Video className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Video Consultation</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">In-Person</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Date & Time:</span>
              <span className="text-sm">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })} at {selectedTime}
              </span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span className="text-sm">Total Fee:</span>
              <span className="text-lg text-green-600">
                ₱{(consultationType === 'video-call' ? videoConsultationFee : consultationFee).toLocaleString()}
              </span>
            </div>

            {bookingError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{bookingError}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleBookAppointment}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Booking...
                </div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VideoConsultationBooking;