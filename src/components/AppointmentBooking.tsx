import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { rlsDataService } from "@/lib/rls-data-service";
import { AppointmentService } from "@/services/databaseService";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { AvailableDoctorView } from "@/types/rls-types";

type DoctorWithUser = AvailableDoctorView;

const AppointmentBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [doctors, setDoctors] = useState<DoctorWithUser[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
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
    }
    finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Selection",
        description: "Please select a doctor, date, and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Starting appointment booking...');
      
      // Get or create patient record
      let { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // If patient not found, create one
        if (patientError || !patient) {
        console.log('👤 Creating patient profile...');
        
        // First, check if we need to authenticate with Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        console.log('🔐 Supabase auth check:', { authUser, authError });
        
        // If no Supabase auth user, try to sign in with current user credentials
        if (!authUser && user?.email) {
          console.log('🔐 Attempting Supabase auth signin...');
          try {
            // Try to sign in with a default password or create user
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: user.email,
              password: 'defaultpassword123' // This would need to be the user's actual password
            });
            console.log('🔐 Sign in attempt:', { signInData, signInError });
          } catch (authErr) {
            console.log('⚠️ Auth signin failed:', authErr);
          }
        }
        
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            date_of_birth: null,
            gender: null,
            address: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();
          
        if (createError) {
          throw new Error(`Failed to create patient profile: ${createError.message}`);
        }
        patient = newPatient;
      }      console.log('✅ Patient profile ready:', patient.id);

      // Convert time format if needed
      let appointmentTime = selectedTime;
      if (selectedTime.includes('AM') || selectedTime.includes('PM')) {
        appointmentTime = convertTo24Hour(selectedTime);
      }

      console.log('📅 Booking appointment with:', {
        patient_id: patient.id,
        doctor_id: selectedDoctor,
        appointment_date: selectedDate,
        appointment_time: appointmentTime,
      });

      // Create appointment using the working database service
      const appointmentId = await AppointmentService.createAppointment({
        patient_id: patient.id,
        doctor_id: selectedDoctor,
        service_type: 'consultation',
        appointment_date: selectedDate,
        appointment_time: appointmentTime,
        reason: 'Appointment booked through online system',
        appointment_type: 'regular',
        consultation_type: 'in-person',
        duration_minutes: 30,
      });

      if (!appointmentId) {
        throw new Error('Failed to create appointment - no ID returned');
      }

      console.log('✅ Appointment created successfully:', appointmentId);

      toast({
        title: "Appointment Confirmed! 🎉",
        description: `Your appointment has been scheduled for ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}.`,
      });

      // Reset form
      setSelectedDoctor("");
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedTime("");

    } catch (error: any) {
      console.error('❌ Error creating appointment:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const availableTimes = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Book Your Appointment</h2>
          <p className="text-lg text-muted-foreground">
            Schedule your visit with our healthcare professionals quickly and easily
          </p>
        </div>

        <div className="medical-card p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Select Doctor
              </h3>
              <div className="space-y-3">
                {isLoadingDoctors && (
                  <div className="text-sm text-muted-foreground">Loading doctors…</div>
                )}
                {!isLoadingDoctors && doctors.length === 0 && (
                  <div className="text-sm text-muted-foreground">No doctors are currently available for booking.</div>
                )}
                {doctors.map((doctor) => {
                  const ratingLabel = typeof doctor.rating === 'number' ? `⭐ ${doctor.rating.toFixed(1)}` : 'No ratings yet';
                  return (
                    <Card 
                      key={doctor.id} 
                      className={`cursor-pointer transition-smooth border-2 ${
                        selectedDoctor === doctor.id 
                          ? 'border-primary shadow-soft' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedDoctor(doctor.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="font-medium text-foreground">{doctor.name}</div>
                          <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs bg-accent-soft text-accent px-2 py-1 rounded-full">
                              {ratingLabel}
                            </div>
                            <div className="text-xs text-success font-medium">
                              {doctor.is_available ? 'Available' : 'Unavailable'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Select Date
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({length: 14}, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  
                  return (
                    <Button
                      key={dateStr}
                      variant={selectedDate === dateStr ? "medical" : "outline"}
                      className="flex flex-col h-auto py-3"
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <span className="text-xs">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Select Time
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "medical" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Appointment Summary */}
          {selectedDoctor && selectedDate && selectedTime && (
            <div className="mt-8 pt-8 border-t border-border">
              <div className="bg-primary-soft p-6 rounded-lg space-y-4">
                <h4 className="font-semibold text-foreground">Appointment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>{doctors.find(d => d.id === selectedDoctor)?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{selectedTime}</span>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="medical" className="flex-1" onClick={handleConfirmAppointment}>
                    Confirm Appointment
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Request Video Call
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AppointmentBooking;