import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Video,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Star,
  Stethoscope
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  consultation_fee: number;
  rating: number;
  availability: string[];
  avatar?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  preparation?: string;
  requirements?: string[];
  home_service_available?: boolean;
}

interface BookingFormData {
  doctor_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: 'in-person' | 'video-call' | 'phone';
  reason: string;
  notes: string;
}

const PatientBookingPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [bookingData, setBookingData] = useState<BookingFormData>({
    doctor_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    consultation_type: 'in-person',
    reason: '',
    notes: ''
  });

  // Load real data from database
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load doctors from database
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('doctors')
          .select(`
            id,
            specialty,
            consultation_fee,
            rating,
            users:user_id (
              name,
              email,
              phone
            )
          `)
          .eq('is_available', true);

        if (doctorsError) {
          console.error('Error loading doctors:', doctorsError);
        } else if (doctorsData) {
          const formattedDoctors = doctorsData.map((doctor: any) => ({
            id: doctor.id,
            name: doctor.users?.name || 'Unknown Doctor',
            specialty: doctor.specialty,
            consultation_fee: doctor.consultation_fee,
            rating: doctor.rating || 4.5,
            availability: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] // Default availability
          }));
          setDoctors(formattedDoctors);
        }

        // Load services from database
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_available', true)
          .order('popular', { ascending: false });

        if (servicesError) {
          console.error('Error loading services:', servicesError);
          toast({
            title: "Error Loading Services",
            description: "Unable to load services. Please refresh the page.",
            variant: "destructive",
          });
        } else if (servicesData) {
          const formattedServices = servicesData.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            category: service.category,
            preparation: service.preparation,
            requirements: service.requirements,
            home_service_available: service.home_service_available
          }));
          setServices(formattedServices);
          console.log('✅ Loaded services:', formattedServices.length, 'services');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load appointment data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast({
        title: "Access Denied",
        description: "This page is for patients only.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [user, navigate, toast]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get patient ID from database
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError) {
        throw new Error('Patient record not found. Please complete your profile first.');
      }

      // Create appointment record
      const appointmentData = {
        patient_id: patientData.id,
        doctor_id: bookingData.doctor_id,
        service_type: selectedService?.name || 'General Consultation',
        reason: bookingData.reason,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        appointment_type: 'consultation',
        consultation_type: bookingData.consultation_type,
        duration_minutes: parseInt(selectedService?.duration?.match(/\d+/)?.[0] || '30'),
        fee: selectedService?.price || 0,
        notes: bookingData.notes,
        status: 'pending'
      };

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (appointmentError) {
        throw new Error('Failed to create appointment: ' + appointmentError.message);
      }

      // Create notification for the appointment
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Appointment Scheduled',
          message: `Your appointment for ${selectedService?.name} on ${bookingData.appointment_date} at ${bookingData.appointment_time} has been scheduled.`,
          type: 'appointment',
          priority: 'medium',
          related_appointment_id: appointment.id
        });

      toast({
        title: "Appointment Booked Successfully! 🎉",
        description: `Your ${selectedService?.name} appointment has been scheduled for ${bookingData.appointment_date} at ${bookingData.appointment_time}.`,
      });
      
      navigate('/dashboard?tab=appointments');
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Unable to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === bookingData.doctor_id);
  const selectedService = services.find(s => s.id === bookingData.service_id);

  const canProceed = () => {
    switch (step) {
      case 1: return bookingData.service_id !== '';
      case 2: return bookingData.doctor_id !== '';
      case 3: return bookingData.appointment_date !== '' && bookingData.appointment_time !== '';
      case 4: return bookingData.reason !== '';
      default: return false;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Book an Appointment</h1>
          <p className="text-muted-foreground">Schedule your healthcare consultation</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Step {step} of 4
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Step 1: Select Service */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Select a Service</h2>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading services...</p>
                    </div>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
                    <p className="text-gray-600 mb-4">No healthcare services are currently available for booking.</p>
                    <Button onClick={() => window.location.reload()}>Refresh Page</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-colors
                          ${bookingData.service_id === service.id 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        onClick={() => setBookingData({...bookingData, service_id: service.id})}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          <div className="flex gap-1">
                            <Badge variant="secondary">{service.category}</Badge>
                            {service.home_service_available && (
                              <Badge variant="outline" className="text-xs">Home Service</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        {service.preparation && (
                          <p className="text-xs text-orange-600 mb-2">
                            <strong>Preparation:</strong> {service.preparation}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-600">₱{service.price?.toLocaleString()}</span>
                          <span className="text-sm text-gray-500">{service.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Doctor */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Choose Your Doctor</h2>
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-colors
                        ${bookingData.doctor_id === doctor.id 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => setBookingData({...bookingData, doctor_id: doctor.id})}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{doctor.name}</h3>
                          <p className="text-gray-600">{doctor.specialty}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm ml-1">{doctor.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm font-semibold text-blue-600">₱{doctor.consultation_fee}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select Date & Time */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Select Date & Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <Label htmlFor="date">Appointment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingData.appointment_date}
                      onChange={(e) => setBookingData({...bookingData, appointment_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="consultation-type">Consultation Type</Label>
                    <Select 
                      value={bookingData.consultation_type} 
                      onValueChange={(value: any) => setBookingData({...bookingData, consultation_type: value})}
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
                            Video Call
                          </div>
                        </SelectItem>
                        <SelectItem value="phone">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Phone Call
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Available Times */}
                {selectedDoctor && bookingData.appointment_date && (
                  <div className="mt-6">
                    <Label>Available Times</Label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {selectedDoctor.availability.map((time) => (
                        <Button
                          key={time}
                          variant={bookingData.appointment_time === time ? "default" : "outline"}
                          onClick={() => setBookingData({...bookingData, appointment_time: time})}
                          className="text-sm"
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Appointment Details */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Appointment Details</h2>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="reason">Reason for Visit *</Label>
                    <Input
                      id="reason"
                      placeholder="Brief description of your concern"
                      value={bookingData.reason}
                      onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information you'd like the doctor to know"
                      value={bookingData.notes}
                      onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                    />
                  </div>

                  {/* Booking Summary */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="font-semibold">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Doctor:</span>
                        <span className="font-semibold">{selectedDoctor?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span className="font-semibold">{bookingData.appointment_date} at {bookingData.appointment_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-semibold capitalize">{bookingData.consultation_type.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span>Total Fee:</span>
                        <span className="text-xl font-bold text-blue-600">₱{selectedService?.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          {step < 4 ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientBookingPage;