import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rlsDataService } from "@/lib/rls-data-service";
import { AppointmentService } from "@/services/databaseService";
import { supabase } from "@/lib/supabase";
import type { AvailableDoctorView, CreateAppointmentInput, ApiResponse } from "@/types/rls-types";
import { 
  Calendar,
  Clock,
  PhilippinePeso,
  User,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  AlertCircle,
  Home,
  MessageSquare,
  Shield,
  Smartphone,
  Video,
  Monitor
} from "lucide-react";
import { db } from "@/lib/db";
import { videoSDK } from "@/services/videoSDK";
// Debug import removed for now


// Import services (with fallbacks if not available)
let PaymentService: any;
let paymentMethods: any[] = [];
let formatCurrency: any;
let SMSService: any;
let AppointmentReminderScheduler: any;

try {
  const paymentServices = require('@/services/payment');
  PaymentService = paymentServices.PaymentService;
  paymentMethods = paymentServices.paymentMethods || [];
  formatCurrency = paymentServices.formatCurrency || ((amount: number) => `₱${amount.toLocaleString()}`);
} catch (error) {
  // Payment service initialized with fallback
  formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  paymentMethods = [
    {
      id: 'paymongo',
      name: 'PayMongo',
      type: 'gateway',
      icon: '�',
      isAvailable: true,
      processingFee: 2.5,
      description: 'Secure checkout powered by PayMongo',
      requirements: ['Valid email address', 'Supported card or e-wallet']
    }
  ];
}

try {
  const notificationServices = require('@/services/notifications');
  SMSService = notificationServices.SMSService;
  AppointmentReminderScheduler = notificationServices.AppointmentReminderScheduler;
} catch (error) {
  // Notification service initialized with fallback
}

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  consultation_fee: number | null;
}

interface BookingStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

const EnhancedBookAppointment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get service details from navigation state
  const serviceDetails = location.state || {};
  
  const [currentStep, setCurrentStep] = useState(0);
  const [doctors, setDoctors] = useState<(Doctor & { name: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    serviceId: serviceDetails.serviceId || '',
    serviceName: serviceDetails.serviceName || '',
    servicePrice: serviceDetails.servicePrice || 0,
    serviceDuration: serviceDetails.serviceDuration || '',
    serviceCategory: serviceDetails.serviceCategory || '',
    selectedDoctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: serviceDetails.serviceName ? `${serviceDetails.serviceName} appointment` : '',
    notes: '',
    homeService: false,
    emergencyContact: '',
    specialRequirements: '',
    paymentMethod: paymentMethods[0]?.id ?? '',
    preferredContactMethod: 'sms',
    consultationType: 'physical' as 'physical' | 'online'
  });

  const [paymentBreakdown, setPaymentBreakdown] = useState({
    subtotal: 0,
    processingFee: 0,
    homeServiceFee: 0,
    total: 0
  });

  const bookingSteps: BookingStep[] = [
    { id: 'service', name: 'Service Details', description: 'Review selected service', completed: false },
    { id: 'doctor', name: 'Select Doctor', description: 'Choose your preferred doctor', completed: false },
    { id: 'consultation', name: 'Consultation Type', description: 'Choose consultation type', completed: false },
    { id: 'schedule', name: 'Date & Time', description: 'Pick appointment schedule', completed: false },
    { id: 'details', name: 'Additional Info', description: 'Provide additional details', completed: false },
    { id: 'payment', name: 'Payment', description: 'Complete payment', completed: false },
    { id: 'confirmation', name: 'Confirmation', description: 'Appointment confirmed', completed: false }
  ];

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      toast({
        title: "Access Denied",
        description: "Please login as a patient to book appointments.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!serviceDetails.serviceId) {
      navigate('/services');
      return;
    }

    loadDoctors();
    calculatePricing();
  }, [user, serviceDetails, navigate, toast]);

  useEffect(() => {
    calculatePricing();
  }, [bookingData.homeService, bookingData.paymentMethod, serviceDetails.servicePrice]);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const doctorsWithUsers = await rlsDataService.getPublicDoctors();
      setDoctors(doctorsWithUsers);

      if (doctorsWithUsers.length === 0) {
        toast({
          title: "No doctors available",
          description: "Please contact an administrator to add active doctors before booking.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load available doctors.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePricing = () => {
    const basePrice = serviceDetails.servicePrice || 0;
    const homeServiceFee = bookingData.homeService ? 500 : 0;
    const subtotal = basePrice + homeServiceFee;
    
    let processingFee = 0;
    if (bookingData.paymentMethod) {
      const paymentMethod = paymentMethods.find(pm => pm.id === bookingData.paymentMethod);
      if (paymentMethod && paymentMethod.processingFee) {
        processingFee = subtotal * (paymentMethod.processingFee / 100);
      }
    }
    
    setPaymentBreakdown({
      subtotal: basePrice,
      processingFee,
      homeServiceFee,
      total: subtotal + processingFee
    });
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, bookingSteps.length - 1));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Doctor selection (moved to step 1)
        if (!bookingData.selectedDoctor) {
          toast({
            title: "Doctor Required",
            description: "Please select a doctor for your appointment.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 2: // Consultation type (moved to step 2)
        if (!bookingData.consultationType) {
          toast({
            title: "Consultation Type Required",
            description: "Please select consultation type (Physical or Online).",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 3: // Schedule (moved to step 3)
        if (!bookingData.appointmentDate || !bookingData.appointmentTime) {
          toast({
            title: "Schedule Required",
            description: "Please select date and time for your appointment.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 5: // Payment
        if (!bookingData.paymentMethod) {
          toast({
            title: "Payment Method Required",
            description: "Please select a payment method.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleCompleteBooking = async () => {
    if (!validateCurrentStep()) return;

    setIsBooking(true);
    setIsProcessingPayment(true);

    try {
      // First check if PayMongo server is reachable
      console.log('🏥 Testing PayMongo server connection...');
      try {
        const healthResp = await fetch('http://localhost:8787/health');
        const healthData = await healthResp.json();
        console.log('✅ PayMongo server health check:', healthData);
      } catch (healthError) {
        console.error('❌ PayMongo server not reachable:', healthError);
        throw new Error('Payment service is not available. Please ensure the PayMongo server is running on port 8787.');
      }
      // Get or create patient record
      console.log('👤 Getting/creating patient record for user:', user!.id);
      let patient;
      try {
        patient = await db.getPatientByUserId(user!.id);
        if (!patient) {
          console.log('👤 Patient not found, creating new patient...');
          patient = await db.createPatient({
            userId: user!.id,
            dateOfBirth: null,
            gender: null,
            address: null,
            bloodType: null,
            allergies: null
          });
        }
        console.log('✅ Patient record ready:', patient?.id);
      } catch (dbError) {
        console.error('❌ Database patient operation failed:', dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
      }

      // PayMongo redirect flow: create a pending payment record, then request checkout URL and redirect
      let pendingPaymentId: string | null = null;
      let appointmentForPaymentId: string | null = null;
      if (bookingData.paymentMethod === 'paymongo') {
        // Check Supabase authentication first
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        console.log('🔐 Enhanced booking auth check:', { authUser, authError });
        
        // Get or create patient record
        let { data: patientRecord, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        console.log('👤 Patient lookup result:', { patientRecord, patientError });

        if (patientError || !patientRecord) {
          console.log('👤 Creating patient profile for Enhanced booking...');
          
          const patientData = {
            user_id: user.id,
            date_of_birth: null,
            gender: null,
            address: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log('👤 Creating patient with data:', patientData);
          
          const { data: newPatient, error: createError } = await supabase
            .from('patients')
            .insert(patientData)
            .select('id')
            .single();
            
          console.log('👤 Patient creation result:', { newPatient, createError });
            
          if (createError) {
            console.error('❌ Patient creation failed:', createError);
            throw new Error(`Failed to create patient profile: ${createError.message} (Code: ${createError.code})`);
          }
          patientRecord = newPatient;
        }

        // Convert time format if needed
        let appointmentTime = bookingData.appointmentTime;
        if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
          const convertTo24Hour = (time12h: string): string => {
            const [time, modifier] = time12h.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') {
              hours = '00';
            }
            if (modifier === 'PM') {
              hours = (parseInt(hours, 10) + 12).toString();
            }
            return `${hours}:${minutes}:00`;
          };
          appointmentTime = convertTo24Hour(appointmentTime);
        }

        console.log('🚀 Creating appointment with Enhanced booking...');
        // Create the appointment using working AppointmentService
        const appointmentId = await AppointmentService.createAppointment({
          patient_id: patientRecord.id,
          doctor_id: bookingData.selectedDoctor,
          service_type: bookingData.reason || 'consultation',
          appointment_date: bookingData.appointmentDate,
          appointment_time: appointmentTime,
          reason: `${bookingData.reason}${bookingData.notes ? ` | Notes: ${bookingData.notes}` : ''}${bookingData.specialRequirements ? ` | Special Requirements: ${bookingData.specialRequirements}` : ''}${bookingData.homeService ? ' | Home service requested' : ''}`,
          appointment_type: 'consultation',
          consultation_type: bookingData.consultationType || 'in-person',
          duration_minutes: 30,
          fee: paymentBreakdown.total
        });

        if (!appointmentId) {
          console.error('❌ AppointmentService returned null/undefined');
          
          // Fallback: Try direct Supabase insert with minimal data
          console.log('🔄 Attempting fallback direct insert...');
          try {
            const { data: fallbackResult, error: fallbackError } = await supabase
              .from('appointments')
              .insert({
                patient_id: patientRecord.id,
                doctor_id: bookingData.selectedDoctor,
                service_type: 'consultation',
                appointment_date: bookingData.appointmentDate,
                appointment_time: appointmentTime,
                status: 'pending',
                reason: bookingData.reason || 'Appointment booking',
                created_at: new Date().toISOString()
              })
              .select('id')
              .single();
              
            console.log('🔄 Fallback insert result:', { fallbackResult, fallbackError });
            
            if (fallbackResult?.id) {
              console.log('✅ Fallback appointment created:', fallbackResult.id);
              appointmentForPaymentId = fallbackResult.id;
            } else {
              throw new Error(`Appointment creation failed completely. Fallback error: ${fallbackError?.message || 'Unknown error'}`);
            }
          } catch (fallbackErr) {
            throw new Error(`All appointment creation methods failed: ${fallbackErr}`);
          }
        } else {
          console.log('✅ Enhanced appointment created successfully:', appointmentId);
          appointmentForPaymentId = appointmentId;
        }

        // Create pending payment linked to appointment
        const pendingPayment = await db.createPayment({
          patient_id: patient.id,
          appointment_id: appointmentForPaymentId,
          amount: paymentBreakdown.total,
          payment_type: 'consultation',
          payment_method: 'online',
          status: 'pending'
        });
        pendingPaymentId = pendingPayment?.id || null;

        // Ask backend to create a PayMongo payment link, then redirect
        console.log('🔗 Attempting to create PayMongo checkout...', {
          url: 'http://localhost:8787/api/create-checkout',
          amount: paymentBreakdown.total,
          description: `Payment for ${bookingData.serviceName}`,
          email: user?.email,
          reference: pendingPaymentId
        });

        const resp = await fetch('http://localhost:8787/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: paymentBreakdown.total,
            description: `Payment for ${bookingData.serviceName}`,
            email: user?.email,
            reference: pendingPaymentId || undefined
          })
        });

        console.log('📡 PayMongo API response:', { status: resp.status, ok: resp.ok });

        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('❌ PayMongo API error:', errorText);
          throw new Error(`Payment service unavailable. Please check if the PayMongo server is running on port 8787. Error: ${errorText || 'Unknown error'}`);
        }

        const data = await resp.json();
        if (!data?.url) {
          throw new Error(data?.error || 'Failed to create payment link');
        }

        // Best-effort: store PayMongo link id in the payment transaction_ref
        if (pendingPaymentId && data?.id) {
          try {
            await db.updatePayment(pendingPaymentId, {
              transaction_id: data.id
            });
          } catch {}
        }

        // Redirect to PayMongo hosted checkout
        window.location.href = data.url as string;
        return; // Stop further UI flow; user will return after payment
      }

      // Determine appointment status based on payment amount
      // For free services, confirm immediately
      // For paid services, status will be updated to 'confirmed' in PaymentSuccess page after payment
      const appointmentStatus = paymentBreakdown.total === 0 ? 'confirmed' : 'pending';

      // Check Supabase authentication for non-redirect path
      const { data: { user: authUser2 }, error: authError2 } = await supabase.auth.getUser();
      console.log('🔐 Non-redirect booking auth check:', { authUser2, authError2 });
      
      // Get or create patient record for non-redirect paths
      let { data: patientRecord2, error: patientError2 } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('👤 Non-redirect patient lookup:', { patientRecord2, patientError2 });

      if (patientError2 || !patientRecord2) {
        console.log('👤 Creating patient profile for non-redirect booking...');
        
        const patientData2 = {
          user_id: user.id,
          date_of_birth: null,
          gender: null,
          address: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log('👤 Creating non-redirect patient:', patientData2);
        
        const { data: newPatient2, error: createError2 } = await supabase
          .from('patients')
          .insert(patientData2)
          .select('id')
          .single();
          
        console.log('👤 Non-redirect patient creation:', { newPatient2, createError2 });
          
        if (createError2) {
          console.error('❌ Non-redirect patient creation failed:', createError2);
          throw new Error(`Failed to create patient profile: ${createError2.message} (Code: ${createError2.code})`);
        }
        patientRecord2 = newPatient2;
      }

      // Convert time format if needed
      let appointmentTime2 = bookingData.appointmentTime;
      if (appointmentTime2.includes('AM') || appointmentTime2.includes('PM')) {
        const convertTo24Hour = (time12h: string): string => {
          const [time, modifier] = time12h.split(' ');
          let [hours, minutes] = time.split(':');
          if (hours === '12') {
            hours = '00';
          }
          if (modifier === 'PM') {
            hours = (parseInt(hours, 10) + 12).toString();
          }
          return `${hours}:${minutes}:00`;
        };
        appointmentTime2 = convertTo24Hour(appointmentTime2);
      }

      console.log('🚀 Creating appointment for non-redirect path...');
      // Create appointment using working AppointmentService
      const appointmentId2 = await AppointmentService.createAppointment({
        patient_id: patientRecord2.id,
        doctor_id: bookingData.selectedDoctor,
        service_type: bookingData.reason || 'consultation',
        appointment_date: bookingData.appointmentDate,
        appointment_time: appointmentTime2,
        reason: `${bookingData.reason}${bookingData.notes ? ` | Notes: ${bookingData.notes}` : ''}${bookingData.specialRequirements ? ` | Special Requirements: ${bookingData.specialRequirements}` : ''}${bookingData.homeService ? ' | Home service requested' : ''}`,
        appointment_type: 'consultation',
        consultation_type: bookingData.consultationType === 'online' ? 'video-call' : 'in-person',
        duration_minutes: 30,
        fee: paymentBreakdown.total
      });

      let appointment: any = null;
      
      if (!appointmentId2) {
        console.error('❌ Non-redirect AppointmentService returned null/undefined');
        
        // Fallback: Try direct Supabase insert with minimal data
        console.log('🔄 Attempting non-redirect fallback direct insert...');
        try {
          const { data: fallbackResult2, error: fallbackError2 } = await supabase
            .from('appointments')
            .insert({
              patient_id: patientRecord2.id,
              doctor_id: bookingData.selectedDoctor,
              service_type: 'consultation',
              appointment_date: bookingData.appointmentDate,
              appointment_time: appointmentTime2,
              status: appointmentStatus,
              reason: bookingData.reason || 'Appointment booking',
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();
            
          console.log('🔄 Non-redirect fallback result:', { fallbackResult2, fallbackError2 });
          
          if (fallbackResult2?.id) {
            console.log('✅ Non-redirect fallback appointment created:', fallbackResult2.id);
            appointment = { id: fallbackResult2.id };
          } else {
            throw new Error(`Non-redirect appointment creation failed completely. Error: ${fallbackError2?.message || 'Unknown error'}`);
          }
        } catch (fallbackErr) {
          throw new Error(`All non-redirect appointment creation methods failed: ${fallbackErr}`);
        }
      } else {
        console.log('✅ Non-redirect appointment created successfully:', appointmentId2);
        appointment = { id: appointmentId2 };
      }

      // Create video meeting if this is a video consultation
      if (appointment && bookingData.consultationType === 'online') {
        try {
          const selectedDoctor = doctors.find(d => d.id === bookingData.selectedDoctor);
          await videoSDK.createMeeting({
            appointmentId: appointment.id,
            doctorName: selectedDoctor?.name || 'Healthcare Professional',
            patientName: user!.name
          });
          
          console.log(`Video meeting created for appointment: ${appointment.id}`);
        } catch (videoError) {
          console.error('Failed to create video meeting:', videoError);
          // Don't fail the booking if video meeting creation fails
          toast({
            title: "Video Setup Warning",
            description: "Appointment created but video setup may need attention. Contact support if needed.",
            variant: "default"
          });
        }
      }

      if (appointment) {
        // Send SMS confirmation if service is available
        if (SMSService && user?.phone && bookingData.preferredContactMethod === 'sms') {
          try {
            const smsService = SMSService.getInstance();
            const selectedDoctor = doctors.find(d => d.id === bookingData.selectedDoctor);
            
            await smsService.sendAppointmentConfirmation(
              user.phone,
              user.name,
              {
                serviceName: bookingData.serviceName,
                doctorName: selectedDoctor?.name || 'Healthcare Professional',
                appointmentDate: bookingData.appointmentDate,
                appointmentTime: bookingData.appointmentTime,
                location: bookingData.homeService ? 'Your Home' : 'Mendoza Diagnostic Center',
                preparation: serviceDetails.preparation
              },
              appointment.id,
              user.id
            );

            // Schedule appointment reminders
            if (AppointmentReminderScheduler) {
              const scheduler = new AppointmentReminderScheduler();
              await scheduler.scheduleAppointmentReminders({
                id: appointment.id,
                patientId: user.id,
                patientName: user.name,
                patientPhone: user.phone,
                serviceName: bookingData.serviceName,
                doctorName: selectedDoctor?.name || 'Healthcare Professional',
                appointmentDate: bookingData.appointmentDate,
                appointmentTime: bookingData.appointmentTime,
                preparation: serviceDetails.preparation
              });
            }
          } catch (smsError) {
            console.error('SMS notification failed:', smsError);
            // Don't fail the booking if SMS fails
          }
        }

        // Create notification with appropriate status message
        const statusMessage = appointmentStatus === 'confirmed' 
          ? `Your ${bookingData.serviceName} appointment has been confirmed for ${bookingData.appointmentDate} at ${bookingData.appointmentTime}.`
          : `Your ${bookingData.serviceName} appointment has been scheduled for ${bookingData.appointmentDate} at ${bookingData.appointmentTime}. It will be confirmed after payment.`;

        await db.createNotification({
          userId: user!.id,
          title: appointmentStatus === 'confirmed' ? "Appointment Confirmed!" : "Appointment Booked Successfully",
          message: statusMessage,
          type: 'appointment',
          priority: 'medium',
          isRead: false
        });

        setBookingComplete(true);
        setCurrentStep(5); // Move to confirmation step
        
        const toastMessage = appointmentStatus === 'confirmed'
          ? `Your appointment has been confirmed${bookingData.preferredContactMethod === 'sms' ? ' and SMS confirmation sent' : ''}!`
          : `Your appointment has been scheduled${bookingData.preferredContactMethod === 'sms' ? ' and SMS confirmation sent' : ''}. It will be confirmed after payment.`;
        
        toast({
          title: "Booking Successful!",
          description: toastMessage,
        });
      } else {
        throw new Error('Failed to create appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
      setIsProcessingPayment(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break;
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

  // Step content components
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {bookingSteps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            <span className="text-xs mt-1 text-center max-w-20">{step.name}</span>
          </div>
          {index < bookingSteps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              index < currentStep ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (bookingComplete && currentStep === 5) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-green-200">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Appointment Booked Successfully!
                  </h1>
                  <p className="text-muted-foreground">
                    Your {bookingData.serviceName} appointment has been confirmed.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Service</p>
                      <p className="text-muted-foreground">{bookingData.serviceName}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Date & Time</p>
                      <p className="text-muted-foreground">
                        {bookingData.appointmentDate} at {bookingData.appointmentTime}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Consultation Type</p>
                      <p className="text-muted-foreground flex items-center gap-2">
                        {bookingData.consultationType === 'online' ? (
                          <><Video className="h-4 w-4 text-green-600" /> Online Consultation</>
                        ) : (
                          <><MapPin className="h-4 w-4 text-blue-600" /> Physical Visit</>
                        )}
                        {bookingData.homeService && <span className="text-blue-600"> + Home Service</span>}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Total Fee</p>
                      <p className="text-muted-foreground">{formatCurrency(paymentBreakdown.total)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-6 text-sm text-muted-foreground">
                  {bookingData.preferredContactMethod === 'sms' && user?.phone && (
                    <div className="flex items-center justify-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS confirmation sent to {user.phone}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    Appointment reminders will be sent 24 hours and 2 hours before
                  </div>
                  {serviceDetails.preparation && (
                    <div className="flex items-center justify-center gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      Remember: {serviceDetails.preparation}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/services')}
                    className="flex-1"
                  >
                    Book Another Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/services')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>

          {/* Step Indicator */}
          <StepIndicator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{bookingSteps[currentStep]?.name}</CardTitle>
                  <CardDescription>{bookingSteps[currentStep]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Step 0: Service Details */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <div className="text-2xl">
                            {serviceDetails.serviceCategory === 'laboratory' && '🧪'}
                            {serviceDetails.serviceCategory === 'imaging' && '📷'}
                            {serviceDetails.serviceCategory === 'consultation' && '👨‍⚕️'}
                            {serviceDetails.serviceCategory === 'examination' && '🏥'}
                            {(!serviceDetails.serviceCategory || serviceDetails.serviceCategory === 'other') && '🏥'}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{bookingData.serviceName}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {bookingData.serviceCategory} Service
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{bookingData.serviceDuration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{formatCurrency(bookingData.servicePrice)}</span>
                        </div>
                      </div>

                      {serviceDetails.description && (
                        <p className="text-sm text-muted-foreground">{serviceDetails.description}</p>
                      )}

                      {serviceDetails.preparation && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-amber-900">Preparation Required</p>
                              <p className="text-sm text-amber-800">{serviceDetails.preparation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {serviceDetails.homeServiceAvailable && (
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="homeService" 
                            checked={bookingData.homeService}
                            onCheckedChange={(checked) => 
                              setBookingData(prev => ({ ...prev, homeService: checked as boolean }))
                            }
                          />
                          <div>
                            <Label htmlFor="homeService" className="text-sm font-medium">
                              Request Home Service (+₱500)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Our staff will visit your location for this service
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 1: Doctor Selection */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <Label>Select Doctor</Label>
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading doctors...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {doctors.map((doctor) => {
                            const consultationFeeLabel = typeof doctor.consultation_fee === 'number'
                              ? formatCurrency(doctor.consultation_fee)
                              : 'Fee to be confirmed';

                            return (
                              <Card 
                                key={doctor.id} 
                                className={`cursor-pointer transition-colors hover:bg-accent ${
                                  bookingData.selectedDoctor === doctor.id ? 'ring-2 ring-primary bg-accent' : ''
                                }`}
                                onClick={() => setBookingData(prev => ({ ...prev, selectedDoctor: doctor.id }))}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{doctor.name}</p>
                                      <p className="text-sm text-muted-foreground">{doctor.specialty ?? 'Specialty pending'}</p>
                                      <p className="text-sm font-semibold text-primary">
                                        {consultationFeeLabel}
                                      </p>
                                    </div>
                                    {bookingData.selectedDoctor === doctor.id && (
                                      <CheckCircle className="h-5 w-5 text-primary" />
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                      
                      {doctors.length === 0 && !isLoading && (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No doctors available at the moment</p>
                          <p className="text-sm">Please try again later</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Consultation Type Selection */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <Label className="text-lg font-semibold">Choose Consultation Type</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            bookingData.consultationType === 'physical'
                              ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setBookingData(prev => ({ ...prev, consultationType: 'physical' }))}
                        >
                          <CardContent className="p-6 text-center">
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
                              <p>• Face-to-face examination</p>
                              <p>• Full access to equipment</p>
                              <p>• Direct interaction with doctor</p>
                            </div>
                            {bookingData.consultationType === 'physical' && (
                              <div className="mt-4">
                                <CheckCircle className="h-6 w-6 text-blue-600 mx-auto" />
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            bookingData.consultationType === 'online'
                              ? 'ring-2 ring-green-500 bg-green-50 shadow-lg'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setBookingData(prev => ({ ...prev, consultationType: 'online' }))}
                        >
                          <CardContent className="p-6 text-center">
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
                              Consult with doctor via video call
                            </p>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>• Video consultation from home</p>
                              <p>• Convenient and safe</p>
                              <p>• Good for follow-ups</p>
                            </div>
                            {bookingData.consultationType === 'online' && (
                              <div className="mt-4">
                                <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Schedule */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="appointmentDate">Appointment Date</Label>
                          <Input
                            id="appointmentDate"
                            type="date"
                            value={bookingData.appointmentDate}
                            onChange={(e) => setBookingData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div>
                          <Label htmlFor="appointmentTime">Appointment Time</Label>
                          <Select
                            value={bookingData.appointmentTime}
                            onValueChange={(value) => setBookingData(prev => ({ ...prev, appointmentTime: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {generateTimeSlots().map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Additional Details */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Reason for Visit</Label>
                        <Input
                          id="reason"
                          value={bookingData.reason}
                          onChange={(e) => setBookingData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Brief description of your concern"
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={bookingData.notes}
                          onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional information or special requests"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input
                          id="emergencyContact"
                          value={bookingData.emergencyContact}
                          onChange={(e) => setBookingData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                          placeholder="Name and phone number"
                        />
                      </div>

                      <div>
                        <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
                        <Textarea
                          id="specialRequirements"
                          value={bookingData.specialRequirements}
                          onChange={(e) => setBookingData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                          placeholder="Wheelchair access, interpreter needed, etc."
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Preferred Contact Method</Label>
                        <Select
                          value={bookingData.preferredContactMethod}
                          onValueChange={(value) => setBookingData(prev => ({ ...prev, preferredContactMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sms">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                SMS Notifications
                              </div>
                            </SelectItem>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Email Notifications
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Payment */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-lg font-semibold">Select Payment Method</Label>
                        <p className="text-sm text-muted-foreground mb-4">Choose how you'd like to pay for your appointment</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {paymentMethods.filter(pm => pm.isAvailable).map((method) => (
                            <Card 
                              key={method.id}
                              className={`cursor-pointer transition-colors hover:bg-accent ${
                                bookingData.paymentMethod === method.id ? 'ring-2 ring-primary bg-accent' : ''
                              }`}
                              onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: method.id }))}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">{method.icon}</span>
                                    <div>
                                      <p className="font-medium">{method.name}</p>
                                      <p className="text-xs text-muted-foreground">{method.description}</p>
                                      {method.processingFee > 0 && (
                                        <p className="text-xs text-amber-600">+{method.processingFee}% processing fee</p>
                                      )}
                                    </div>
                                  </div>
                                  {bookingData.paymentMethod === method.id && (
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {bookingData.paymentMethod && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Payment Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Service Fee:</span>
                              <span>{formatCurrency(paymentBreakdown.subtotal)}</span>
                            </div>
                            {paymentBreakdown.homeServiceFee > 0 && (
                              <div className="flex justify-between">
                                <span>Home Service Fee:</span>
                                <span>{formatCurrency(paymentBreakdown.homeServiceFee)}</span>
                              </div>
                            )}
                            {paymentBreakdown.processingFee > 0 && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Processing Fee:</span>
                                <span>{formatCurrency(paymentBreakdown.processingFee)}</span>
                              </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>{formatCurrency(paymentBreakdown.total)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousStep}
                      disabled={currentStep === 0}
                    >
                      Previous
                    </Button>
                    
                    {currentStep < 4 ? (
                      <Button onClick={handleNextStep}>
                        Next
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleCompleteBooking}
                        disabled={isBooking}
                        className="min-w-32"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : isBooking ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Complete Booking
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold">{bookingData.serviceName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {bookingData.serviceCategory} Service
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    {bookingData.consultationType && (
                      <div>
                        <p className="font-medium">Consultation Type:</p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          {bookingData.consultationType === 'online' ? (
                            <><Video className="h-4 w-4 text-green-600" /> Online Consultation</>
                          ) : (
                            <><MapPin className="h-4 w-4 text-blue-600" /> Physical Visit</>
                          )}
                        </p>
                      </div>
                    )}

                    {bookingData.selectedDoctor && (
                      <div>
                        <p className="font-medium">Doctor:</p>
                        <p className="text-muted-foreground">
                          {doctors.find(d => d.id === bookingData.selectedDoctor)?.name || 'Selected'}
                        </p>
                      </div>
                    )}
                    
                    {bookingData.appointmentDate && bookingData.appointmentTime && (
                      <div>
                        <p className="font-medium">Schedule:</p>
                        <p className="text-muted-foreground">
                          {bookingData.appointmentDate} at {bookingData.appointmentTime}
                        </p>
                      </div>
                    )}
                    
                    {bookingData.homeService && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Home className="h-4 w-4" />
                        <span>Home Service</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Service Fee:</span>
                      <span>{formatCurrency(paymentBreakdown.subtotal)}</span>
                    </div>
                    {paymentBreakdown.homeServiceFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Home Service:</span>
                        <span>{formatCurrency(paymentBreakdown.homeServiceFee)}</span>
                      </div>
                    )}
                    {paymentBreakdown.processingFee > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Processing Fee:</span>
                        <span>{formatCurrency(paymentBreakdown.processingFee)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(paymentBreakdown.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookAppointment;