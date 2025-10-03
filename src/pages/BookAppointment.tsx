import { useState, useEffect } from "react";
import { authService } from '@/services/auth-service';
import { healthcareService, type AccessContext } from '@/services/healthcare-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientRoute } from "@/components/auth/ProtectedRoute";
import PayMongoPopupModal from '@/components/PayMongoPopupModal';
import { 
  Calendar,
  Clock,
  PhilippinePeso,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  AlertCircle,
  Home,
  MessageSquare,
  Video,
  Monitor,
  Stethoscope,
  X
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  consultation_fee: number | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  category: string;
}

const BookAppointment = () => {
  const [context, setContext] = useState<AccessContext | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  
  const [bookingData, setBookingData] = useState({
    selectedDoctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    notes: '',
    consultationType: 'physical' as 'physical' | 'online'
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentContext = authService.getCurrentContext();
        if (!currentContext || currentContext.user.role !== 'patient') {
          window.location.href = '/login';
          return;
        }

        setContext(currentContext);
        
        // Get selected service from localStorage
        const storedService = localStorage.getItem('selectedService');
        if (storedService) {
          setSelectedService(JSON.parse(storedService));
        }
        
        await loadDoctorsAndServices();
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load appointment data');
      }
    };

    loadInitialData();
  }, []);

  const loadDoctorsAndServices = async () => {
    setIsLoading(true);
    try {
      const data = await healthcareService.getAvailableDoctorsAndServices();
      
      // Transform doctors data
      const doctorsData = data.doctors.map((doc: any) => ({
        id: doc.id,
        name: doc.users?.name || 'Unknown',
        specialty: doc.specialty,
        consultation_fee: doc.consultation_fee
      }));

      setDoctors(doctorsData);
      
      if (doctorsData.length === 0) {
        setError('No doctors available for booking');
      }
    } catch (error) {
      console.error('Error loading doctors and services:', error);
      setError('Failed to load available doctors and services');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookedTimeSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return;
    
    try {
      // This would call your service to get booked appointments for the doctor on the selected date
      // const bookedSlots = await healthcareService.getBookedTimeSlots(doctorId, date);
      // For now, simulate some booked slots
      const mockBookedSlots = ['09:00', '10:30', '14:00', '15:30'];
      setBookedTimeSlots(mockBookedSlots);
    } catch (error) {
      console.error('Error loading booked time slots:', error);
      setBookedTimeSlots([]);
    }
  };

  const handleBooking = async () => {
    if (!bookingData.selectedDoctor || !bookingData.appointmentDate || !bookingData.appointmentTime) {
      setError('Please complete all required fields');
      return;
    }

    if (!context || !selectedService) {
      setError('Required information not available');
      return;
    }

    setIsBooking(true);
    setError(null);
    
    try {
      const appointmentData = {
        doctor_id: bookingData.selectedDoctor,
        service_type: selectedService.name,
        appointment_date: bookingData.appointmentDate,
        appointment_time: bookingData.appointmentTime,
        reason: bookingData.reason,
        consultation_type: bookingData.consultationType
      };

      const result = await healthcareService.bookAppointment(context, appointmentData);

      if (result) {
        // Find the selected doctor info
        const selectedDoctor = doctors.find(d => d.id === bookingData.selectedDoctor);
        
        // Create appointment object for payment modal
        const appointmentForPayment = {
          id: result.id || 'temp-id',
          doctorName: selectedDoctor?.name || 'Unknown Doctor',
          specialty: selectedDoctor?.specialty || 'General Medicine',
          serviceType: selectedService.name,
          date: bookingData.appointmentDate,
          time: bookingData.appointmentTime,
          fee: selectedDoctor?.consultation_fee || selectedService.price || 1000,
          consultationType: bookingData.consultationType === 'physical' ? 'in-person' as const : 'video-call' as const
        };

        setCreatedAppointment(appointmentForPayment);
        setShowPaymentModal(true);
        
      } else {
        throw new Error('Failed to create appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError('There was an error booking your appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('✅ Payment successful:', paymentData);
    
    // Update appointment status to confirmed and payment to paid
    if (createdAppointment?.id && context) {
      try {
        // Update appointment status
        await healthcareService.updateAppointmentStatus(context, createdAppointment.id, 'confirmed');
        
        console.log('✅ Appointment confirmed and payment successful');
      } catch (error) {
        console.error('Error updating records after payment:', error);
      }
    }
    
    setBookingComplete(true);
    setShowPaymentModal(false);
    // Clear stored service
    localStorage.removeItem('selectedService');
  };

  const isTimeSlotBooked = (timeValue: string) => {
    return bookedTimeSlots.includes(timeValue);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break; // Stop at 5:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <PatientRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </PatientRoute>
    );
  }

  if (error) {
    return (
      <PatientRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md max-w-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.href = '/patient/dashboard'}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </PatientRoute>
    );
  }

  if (bookingComplete) {
    const selectedDoctor = doctors.find(d => d.id === bookingData.selectedDoctor);
    
    return (
      <PatientRoute>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg border-green-200">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Thank You!
                    </h1>
                    <p className="text-xl text-green-600 font-semibold mb-2">
                      Your appointment has been successfully scheduled
                    </p>
                    <p className="text-gray-600">
                      Mendoza Diagnostic Center - Your trusted healthcare partner
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="text-left">
                        <p className="font-semibold text-gray-700">Service</p>
                        <p className="text-gray-900 font-medium">{selectedService?.name || 'General Consultation'}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-700">Doctor</p>
                        <p className="text-gray-900 font-medium">Dr. {selectedDoctor?.name}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-700">Date & Time</p>
                        <p className="text-gray-900 font-medium">
                          {new Date(bookingData.appointmentDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-gray-900 font-medium">{bookingData.appointmentTime}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-700">Consultation Type</p>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          {bookingData.consultationType === 'online' ? (
                            <><Video className="h-4 w-4 text-blue-600" /> Online Consultation</>
                          ) : (
                            <><MapPin className="h-4 w-4 text-green-600" /> Physical Visit</>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {bookingData.reason && (
                      <div className="mt-4 text-left">
                        <p className="font-semibold text-gray-700">Reason for Visit</p>
                        <p className="text-gray-900">{bookingData.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-left">
                        <h4 className="font-semibold text-yellow-800">Important Reminders</h4>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                          <li>• Please arrive 15 minutes early for your appointment</li>
                          <li>• Bring a valid ID and any previous medical records</li>
                          <li>• Payment will be collected at the clinic after your service</li>
                          {bookingData.consultationType === 'online' && (
                            <li>• You will receive online consultation details via SMS or call</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={() => window.location.href = '/patient/portal'}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Back to Portal
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/patient/dashboard'}
                      className="flex-1"
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PatientRoute>
    );
  }

  return (
    <PatientRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/patient/dashboard'}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
              <p className="text-gray-600">Select a service and schedule your appointment</p>
            </div>

            {/* Service Display */}
            {selectedService && (
              <div className="mb-8">
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Booking: {selectedService.name}
                        </h2>
                        <p className="text-gray-600">{selectedService.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 max-w-md mx-auto">
                <span>Consultation Type</span>
                <span>Select Doctor</span>
                <span>Date & Time</span>
                <span>Confirm</span>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {currentStep === 1 && 'Choose Consultation Type'}
                    {currentStep === 2 && 'Select Doctor'}
                    {currentStep === 3 && 'Choose Date & Time'}
                    {currentStep === 4 && 'Confirm Appointment'}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 && 'Select how you would like to have your consultation'}
                    {currentStep === 2 && 'Choose your preferred doctor'}
                    {currentStep === 3 && 'Pick a convenient date and time'}
                    {currentStep === 4 && 'Review and confirm your appointment details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Consultation Type Selection */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                          onClick={() => setBookingData(prev => ({ ...prev, consultationType: 'physical' }))}
                          className={`cursor-pointer border-2 rounded-xl p-6 transition-all ${
                            bookingData.consultationType === 'physical'
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                              bookingData.consultationType === 'physical' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <MapPin className={`h-8 w-8 ${
                                bookingData.consultationType === 'physical' ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${
                              bookingData.consultationType === 'physical' ? 'text-blue-900' : 'text-gray-700'
                            }`}>
                              Physical Consultation
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                              Visit Mendoza Diagnostic Center in person
                            </p>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>• Face-to-face consultation</p>
                              <p>• Full physical examination</p>
                              <p>• Direct access to all equipment</p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() => setBookingData(prev => ({ ...prev, consultationType: 'online' }))}
                          className={`cursor-pointer border-2 rounded-xl p-6 transition-all ${
                            bookingData.consultationType === 'online'
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                              bookingData.consultationType === 'online' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <Video className={`h-8 w-8 ${
                                bookingData.consultationType === 'online' ? 'text-green-600' : 'text-gray-400'
                              }`} />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${
                              bookingData.consultationType === 'online' ? 'text-green-900' : 'text-gray-700'
                            }`}>
                              Online Consultation
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                              Consult with doctor remotely via video call
                            </p>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>• Video consultation from home</p>
                              <p>• Convenient and safe</p>
                              <p>• Good for follow-ups</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <Button 
                          onClick={() => setCurrentStep(2)}
                          disabled={!bookingData.consultationType}
                          className="px-8"
                        >
                          Continue to Doctor Selection
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Doctor Selection */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      {doctors.length > 0 ? (
                        <div className="space-y-4">
                          {doctors.map((doctor) => (
                            <div
                              key={doctor.id}
                              onClick={() => setBookingData(prev => ({ ...prev, selectedDoctor: doctor.id }))}
                              className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                                bookingData.selectedDoctor === doctor.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  bookingData.selectedDoctor === doctor.id ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                  <User className={`h-6 w-6 ${
                                    bookingData.selectedDoctor === doctor.id ? 'text-blue-600' : 'text-gray-500'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">Dr. {doctor.name}</h3>
                                  <p className="text-sm text-gray-600">{doctor.specialty || 'General Practice'}</p>
                                  <p className="text-sm font-medium text-blue-600">
                                    Consultation Fee: {formatPrice(doctor.consultation_fee || 500)}
                                  </p>
                                </div>
                                {bookingData.selectedDoctor === doctor.id && (
                                  <CheckCircle className="h-6 w-6 text-blue-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No doctors available for selection.</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <Button 
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                        <Button 
                          onClick={() => {
                            if (bookingData.selectedDoctor) {
                              setCurrentStep(3);
                            }
                          }}
                          disabled={!bookingData.selectedDoctor}
                        >
                          Continue to Date & Time
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Date & Time Selection */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      {/* Date Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="date">Select Appointment Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={bookingData.appointmentDate}
                          onChange={(e) => {
                            setBookingData(prev => ({ ...prev, appointmentDate: e.target.value }));
                            // Load booked slots for the selected doctor and date
                            if (bookingData.selectedDoctor && e.target.value) {
                              loadBookedTimeSlots(bookingData.selectedDoctor, e.target.value);
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full"
                        />
                      </div>

                      {/* Time Selection */}
                      {bookingData.appointmentDate && (
                        <div className="space-y-4">
                          <Label>Available Time Slots</Label>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {generateTimeSlots().map((slot) => {
                              const isBooked = isTimeSlotBooked(slot.value);
                              return (
                                <Button
                                  key={slot.value}
                                  variant={bookingData.appointmentTime === slot.value ? "default" : "outline"}
                                  onClick={() => {
                                    if (!isBooked) {
                                      setBookingData(prev => ({ ...prev, appointmentTime: slot.value }));
                                    }
                                  }}
                                  disabled={isBooked}
                                  className={`relative ${
                                    isBooked 
                                      ? 'opacity-50 cursor-not-allowed bg-red-50 border-red-200 text-red-400' 
                                      : bookingData.appointmentTime === slot.value
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-blue-50'
                                  }`}
                                >
                                  {slot.label}
                                  {isBooked && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <X className="h-4 w-4" />
                                    </span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                          
                          {bookedTimeSlots.length > 0 && (
                            <div className="text-sm text-gray-500 mt-2">
                              <p className="flex items-center gap-1">
                                <X className="h-4 w-4 text-red-400" />
                                Unavailable time slots are marked and cannot be selected
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <Button 
                          variant="outline"
                          onClick={() => setCurrentStep(2)}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep(4)}
                          disabled={!bookingData.appointmentDate || !bookingData.appointmentTime}
                        >
                          Review Appointment
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Confirmation & Additional Details */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Appointment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Service</p>
                            <p className="text-gray-900">{selectedService?.name}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Doctor</p>
                            <p className="text-gray-900">Dr. {doctors.find(d => d.id === bookingData.selectedDoctor)?.name}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Date & Time</p>
                            <p className="text-gray-900">
                              {new Date(bookingData.appointmentDate).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })} at {bookingData.appointmentTime}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Consultation Type</p>
                            <p className="text-gray-900 flex items-center gap-2">
                              {bookingData.consultationType === 'online' ? (
                                <><Video className="h-4 w-4 text-green-600" /> Online Consultation</>
                              ) : (
                                <><MapPin className="h-4 w-4 text-blue-600" /> Physical Visit</>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Visit *</Label>
                        <Input
                          id="reason"
                          value={bookingData.reason}
                          onChange={(e) => setBookingData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Brief description of your concern"
                          required
                        />
                      </div>

                      {/* Additional Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={bookingData.notes}
                          onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional information or special requests"
                          rows={3}
                        />
                      </div>

                      {/* Error Display */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                          {error}
                        </div>
                      )}

                      {/* Booking Buttons */}
                      <div className="flex justify-between">
                        <Button 
                          variant="outline"
                          onClick={() => setCurrentStep(3)}
                          disabled={isBooking}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                        <Button 
                          onClick={handleBooking}
                          disabled={isBooking || !bookingData.reason.trim()}
                          size="lg"
                          className="px-8"
                        >
                          {isBooking ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Booking Appointment...
                            </>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 mr-2" />
                              Confirm Appointment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* PayMongo Payment Modal */}
      {showPaymentModal && createdAppointment && (
        <PayMongoPopupModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          appointmentData={createdAppointment}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </PatientRoute>
  );
};

export default BookAppointment;