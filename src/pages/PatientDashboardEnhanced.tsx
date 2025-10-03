import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Import our enhanced components
import EnhancedPatientDashboard from "./EnhancedPatientDashboard";
import { EnhancedAppointmentCard } from "@/components/EnhancedAppointmentCard";
import { EnhancedHealthMetrics } from "@/components/EnhancedHealthMetrics";
import { EnhancedNotifications } from "@/components/EnhancedNotifications";
import { EnhancedMobileNavigation } from "@/components/EnhancedMobileNavigation";
import { AddHealthMetricModal } from "@/components/AddHealthMetricModal";
import { RescheduleAppointmentModal } from "@/components/RescheduleAppointmentModal";
import { CancelAppointmentModal } from "@/components/CancelAppointmentModal";
import { RetryPaymentModal } from "@/components/RetryPaymentModal";
import { ViewAppointmentModal } from "@/components/ViewAppointmentModal";
import { SendMessageModal } from "@/components/SendMessageModal";
import { ViewMedicalRecordModal } from "@/components/ViewMedicalRecordModal";
import { ViewLabTestModal } from "@/components/ViewLabTestModal";
import { ViewPrescriptionModal } from "@/components/ViewPrescriptionModal";
import { ViewPaymentModal } from "@/components/ViewPaymentModal";
import { AppointmentService, HealthMetricsService, PaymentService, PatientService } from "@/services/databaseService";
import { 
  BookAppointmentButton,
  ViewProfileButton,
  AddHealthMetricButton,
  ViewHealthHistoryButton,
  AppointmentActionButtons,
  PaymentActionButtons,
  ViewMedicalRecordButton,
  ViewLabTestButton,
  ViewPrescriptionButton,
  RefreshDataButton
} from "@/components/DashboardButtons";

import { 
  Calendar,
  Clock,
  User,
  FileText,
  Bell,
  Settings,
  Heart,
  Activity,
  TestTube,
  Plus,
  Eye,
  Video,
  Phone,
  MessageSquare
} from "lucide-react";

interface PatientDashboardEnhancedProps {}

const PatientDashboardEnhanced: React.FC<PatientDashboardEnhancedProps> = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Real data from database
  const [patientData, setPatientData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  // Modal states for popups
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showViewAppointmentModal, setShowViewAppointmentModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointmentForModal, setSelectedAppointmentForModal] = useState<any>(null);

  // Modal states for records
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Selected data for modals
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<any>(null);
  const [selectedLabTest, setSelectedLabTest] = useState<any>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Load patient data from database (prevent duplicate calls)
  useEffect(() => {
    const loadPatientData = async () => {
      if (!user || hasLoadedOnce) return;

      setIsLoading(true);
      setHasLoadedOnce(true);
      try {
        console.log('🔍 Loading data for user:', user.email);

        // For demo purposes, if we can't find patient for current user, use sample patient
        let { data: patient, error: patientError } = await supabase
          .from('patients')
          .select(`
            *,
            users:user_id (
              name,
              email,
              phone
            )
          `)
          .eq('user_id', user.id)
          .single();

        // If no patient found, try to use the sample patient data for demo
        if (patientError && patientError.code === 'PGRST116') {
          console.log('No patient found for current user, checking sample data...');
          
          // Try to get sample patient (Juan Dela Cruz)
          const { data: samplePatient, error: sampleError } = await supabase
            .from('patients')
            .select(`
              *,
              users:user_id (
                name,
                email,
                phone
              )
            `)
            .eq('id', '660e8400-e29b-41d4-a716-446655440000')
            .single();

          if (!sampleError && samplePatient) {
            console.log('✅ Using sample patient data for demo');
            patient = samplePatient;
          } else {
            // Create a new patient record
            console.log('Creating patient record for user:', user.id);
            const { data: newPatient, error: createError } = await supabase
              .from('patients')
              .insert({
                user_id: user.id,
                date_of_birth: '1990-01-01',
                gender: 'male',
                address: '123 Sample Street, City',
                blood_type: 'O+',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select(`
                *,
                users:user_id (
                  name,
                  email,
                  phone
                )
              `)
              .single();

            if (createError) {
              console.error('Error creating patient:', createError);
              toast({
                title: "Setup Error",
                description: "Failed to create patient profile. Please try again.",
                variant: "destructive",
              });
            } else {
              patient = newPatient;
              console.log('✅ Patient record created');
            }
          }
        } else if (patientError) {
          console.error('Error loading patient:', patientError);
        }

        if (patient) {
          setPatientData(patient);
        }

        // Get appointments with doctor information
        let patientIdToUse = patient?.id;
        
        // Use comprehensive appointment service
        let appointmentsData = await AppointmentService.getPatientAppointments(patientIdToUse);
        let appointmentsError = null;

        // If no appointments found and we're not using sample patient, try sample patient data
        if ((!appointmentsData || appointmentsData.length === 0) && patientIdToUse !== '660e8400-e29b-41d4-a716-446655440000') {
          console.log('No appointments for current patient, loading sample data...');
          const { data: sampleAppointments, error: sampleError } = await supabase
            .from('appointments')
            .select(`
              *,
              doctors:doctor_id (
                specialty,
                consultation_fee,
                rating,
                license_number,
                users:user_id (
                  name,
                  email,
                  phone
                )
              )
            `)
            .eq('patient_id', '660e8400-e29b-41d4-a716-446655440000')
            .order('appointment_date', { ascending: false });
          
          if (!sampleError && sampleAppointments) {
            appointmentsData = sampleAppointments;
            appointmentsError = null;
            console.log('✅ Using sample appointment data');
          }
        }

        if (appointmentsError) {
          console.error('Error loading appointments:', appointmentsError);
        } else {
          const formattedAppointments = appointmentsData?.map((apt: any) => ({
            id: apt.id,
            doctor: {
              name: apt.doctors?.users?.name || 'Unknown Doctor',
              specialty: apt.doctors?.specialty || 'General Medicine',
              rating: apt.doctors?.rating || 0,
              phone: apt.doctors?.users?.phone,
              email: apt.doctors?.users?.email
            },
            date: apt.appointment_date,
            time: apt.appointment_time,
            type: apt.appointment_type || 'consultation',
            status: apt.status || 'pending',
            consultationType: apt.consultation_type || 'in-person',
            reason: apt.reason || apt.service_type || 'General Consultation',
            fee: apt.fee || apt.doctors?.consultation_fee || 1500,
            notes: apt.notes,
            serviceType: apt.service_type,
            duration: apt.duration_minutes || 30,
            duration_minutes: apt.duration_minutes || 30,
            durationMinutes: apt.duration_minutes || 30,
            createdAt: apt.created_at,
            location: apt.location || (apt.consultation_type === 'video-call' ? 'Video Call' : 'Clinic')
          })) || [];
          setAppointments(formattedAppointments);
          console.log('✅ Loaded appointments:', formattedAppointments.length);
          console.log('Appointment data:', formattedAppointments);
        }

        // Get health metrics
        let { data: metricsData, error: metricsError } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('patient_id', patientIdToUse)
          .order('recorded_at', { ascending: false });

        // Use sample data if no metrics found
        if ((!metricsData || metricsData.length === 0) && patientIdToUse !== '660e8400-e29b-41d4-a716-446655440000') {
          const { data: sampleMetrics, error: sampleMetricsError } = await supabase
            .from('health_metrics')
            .select('*')
            .eq('patient_id', '660e8400-e29b-41d4-a716-446655440000')
            .order('recorded_at', { ascending: false });
          
          if (!sampleMetricsError && sampleMetrics) {
            metricsData = sampleMetrics;
            metricsError = null;
          }
        }

        if (metricsError) {
          console.error('Error loading health metrics:', metricsError);
        } else {
          const formattedMetrics = metricsData?.map((metric: any) => ({
            id: metric.id,
            name: metric.metric_type,
            value: metric.value,
            unit: '',
            date: metric.recorded_at?.split('T')[0],
            status: 'normal' as const,
            target: '',
            progress: 75
          })) || [];
          setHealthMetrics(formattedMetrics);
          console.log('✅ Loaded health metrics:', formattedMetrics.length);
        }

        // Get notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notificationsError) {
          console.error('Error loading notifications:', notificationsError);
        } else {
          const formattedNotifications = notificationsData?.map((notif: any) => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            priority: notif.priority,
            timestamp: notif.created_at,
            isRead: notif.is_read
          })) || [];
          setNotifications(formattedNotifications);
        }

        // Get payment history with appointment details
        let { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            *,
            appointments:appointment_id (
              appointment_date,
              service_type,
              doctors:doctor_id (
                specialty,
                users:user_id (
                  name
                )
              )
            )
          `)
          .eq('patient_id', patientIdToUse)
          .order('created_at', { ascending: false });

        // If no payments found and we're not using sample patient, try sample patient data
        if ((!paymentsData || paymentsData.length === 0) && patientIdToUse !== '660e8400-e29b-41d4-a716-446655440000') {
          console.log('No payments for current patient, loading sample data...');
          const { data: samplePayments, error: samplePayError } = await supabase
            .from('payments')
            .select(`
              *,
              appointments:appointment_id (
                appointment_date,
                service_type,
                doctors:doctor_id (
                  specialty,
                  users:user_id (
                    name
                  )
                )
              )
            `)
            .eq('patient_id', '660e8400-e29b-41d4-a716-446655440000')
            .order('created_at', { ascending: false });
          
          if (!samplePayError && samplePayments) {
            paymentsData = samplePayments;
            paymentsError = null;
            console.log('✅ Using sample payment data');
          }
        }

        if (paymentsError) {
          console.error('Error loading payments:', paymentsError);
        } else {
          const formattedPayments = paymentsData?.map((payment: any) => ({
            ...payment,
            appointmentDetails: payment.appointments ? {
              date: payment.appointments.appointment_date,
              serviceType: payment.appointments.service_type,
              doctorName: payment.appointments.doctors?.users?.name,
              specialty: payment.appointments.doctors?.specialty
            } : null
          })) || [];
          setPayments(formattedPayments);
          console.log('✅ Loaded payments:', formattedPayments.length);
        }

        // Get medical records with prescriptions
        let { data: recordsData, error: recordsError } = await supabase
          .from('medical_records')
          .select(`
            *,
            doctors:doctor_id (
              specialty,
              users:user_id (
                name
              )
            ),
            appointments:appointment_id (
              appointment_date,
              appointment_time,
              service_type
            ),
            prescriptions (
              id,
              medication_name,
              dosage,
              instructions,
              created_at
            )
          `)
          .eq('patient_id', patientIdToUse)
          .order('created_at', { ascending: false });

        // Use sample data if no records found
        if ((!recordsData || recordsData.length === 0) && patientIdToUse !== '660e8400-e29b-41d4-a716-446655440000') {
          const { data: sampleRecords, error: sampleRecordsError } = await supabase
            .from('medical_records')
            .select(`
              *,
              doctors:doctor_id (
                specialty,
                users:user_id (
                  name
                )
              ),
              appointments:appointment_id (
                appointment_date,
                appointment_time,
                service_type
              ),
              prescriptions (
                id,
                medication_name,
                dosage,
                instructions,
                created_at
              )
            `)
            .eq('patient_id', '660e8400-e29b-41d4-a716-446655440000')
            .order('created_at', { ascending: false });
          
          if (!sampleRecordsError && sampleRecords) {
            recordsData = sampleRecords;
            recordsError = null;
          }
        }

        if (recordsError) {
          console.error('Error loading medical records:', recordsError);
        } else {
          setMedicalRecords(recordsData || []);
          console.log('✅ Loaded medical records:', recordsData?.length || 0);
        }

        // Get lab tests
        let { data: labTestsData, error: labTestsError } = await supabase
          .from('lab_tests')
          .select(`
            *,
            doctors:doctor_id (
              specialty,
              users:user_id (
                name
              )
            ),
            appointments:appointment_id (
              appointment_date,
              service_type
            )
          `)
          .eq('patient_id', patientIdToUse)
          .order('created_at', { ascending: false });

        // Use sample data if no lab tests found
        if ((!labTestsData || labTestsData.length === 0) && patientIdToUse !== '660e8400-e29b-41d4-a716-446655440000') {
          const { data: sampleLabTests, error: sampleLabTestsError } = await supabase
            .from('lab_tests')
            .select(`
              *,
              doctors:doctor_id (
                specialty,
                users:user_id (
                  name
                )
              ),
              appointments:appointment_id (
                appointment_date,
                service_type
              )
            `)
            .eq('patient_id', '660e8400-e29b-41d4-a716-446655440000')
            .order('created_at', { ascending: false });
          
          if (!sampleLabTestsError && sampleLabTests) {
            labTestsData = sampleLabTests;
            labTestsError = null;
          }
        }

        if (labTestsError) {
          console.error('Error loading lab tests:', labTestsError);
        } else {
          setLabTests(labTestsData || []);
          console.log('✅ Loaded lab tests:', labTestsData?.length || 0);
        }

        // Get prescriptions (standalone)
        const { data: prescriptionsData, error: prescriptionsError } = await supabase
          .from('prescriptions')
          .select(`
            *,
            medical_records:medical_record_id (
              diagnosis,
              created_at,
              doctors:doctor_id (
                specialty,
                users:user_id (
                  name
                )
              )
            )
          `)
          .eq('medical_records.patient_id', patient?.id)
          .order('created_at', { ascending: false });

        if (!prescriptionsError && prescriptionsData) {
          setPrescriptions(prescriptionsData);
          console.log('✅ Loaded prescriptions:', prescriptionsData.length);
        }

      } catch (error) {
        console.error('Error loading patient data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only load if we haven't loaded data yet
    if (user && !hasLoadedOnce) {
      loadPatientData();
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  useEffect(() => {
    // Check if user is authenticated and is a patient
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast({
        title: "Access Denied",
        description: "This dashboard is for patients only.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Check mobile status
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [user, navigate, toast]);

  const handleAppointmentAction = async (appointmentId: string, action: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    switch (action) {
      case 'join-call':
        try {
          // Patients can ONLY join existing calls; they cannot create calls.
          const appointmentWithCall = await AppointmentService.getAppointmentWithVideoCall(appointmentId);
          if (appointmentWithCall?.video_calls?.[0]) {
            // Start the call
            await AppointmentService.startVideoCall(appointmentId);
            window.open(appointmentWithCall.video_calls[0].call_link, '_blank');
          } else {
            toast({
              title: 'No active call yet',
              description: 'Ask your doctor for the Meeting ID or wait for the doctor to start the call.',
            });
            navigate('/join-call');
          }
        } catch (error) {
          console.error('Error joining call:', error);
          toast({
            title: "Error",
            description: "Failed to join video call. Please try again.",
            variant: "destructive"
          });
        }
        break;
      case 'message':
        // Open message modal
        const appointmentForMessage = appointments.find(apt => apt.id === appointmentId);
        if (appointmentForMessage) {
          setSelectedAppointmentForModal(appointmentForMessage);
          setShowSendMessageModal(true);
        }
        break;
    }
  };

  const refreshDashboardData = () => {
    // Trigger a re-fetch of all dashboard data
    setHasLoadedOnce(false);
    setIsLoading(true);
    // The useEffect will handle the data fetching
  };

  const handleHealthMetricAction = (action: string) => {
    if (action === 'add') {
      // This will be handled by the AddHealthMetricModal component
      return;
    } else if (action === 'history') {
      // Navigate to health metrics history page
      navigate('/health-metrics-history');
    }
  };

  const handleMetricAdded = () => {
    refreshDashboardData();
    toast({
      title: "Health Metric Added",
      description: "Your health metric has been recorded successfully.",
    });
  };

  const handleAppointmentUpdated = () => {
    refreshDashboardData();
  };

  const handlePaymentUpdated = () => {
    refreshDashboardData();
  };

  // Modal handler functions
  const handleViewMedicalRecord = (recordId: string) => {
    const record = medicalRecords.find(r => r.id === recordId);
    if (record) {
      setSelectedMedicalRecord(record);
      setShowMedicalRecordModal(true);
    }
  };

  const handleViewLabTest = (testId: string) => {
    const test = labTests.find(t => t.id === testId);
    if (test) {
      setSelectedLabTest(test);
      setShowLabTestModal(true);
    }
  };

  const handleViewPrescription = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
      setSelectedPrescription(prescription);
      setShowPrescriptionModal(true);
    }
  };

  const handleViewPayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setShowPaymentModal(true);
    }
  };

  // Appointment action handlers
  const handleRescheduleAppointment = (appointment: any) => {
    setSelectedAppointmentForModal(appointment);
    setShowRescheduleModal(true);
  };

  const handleCancelAppointment = async (appointment: any, reason: string) => {
    try {
      const result = await AppointmentService.cancel(appointment.id, reason);
      
      if (result.success) {
        toast({
          title: "Appointment Cancelled",
          description: "Your appointment has been successfully cancelled.",
        });
        refreshDashboardData();
        return true;
      } else {
        throw new Error(result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel appointment. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const upcomingCount = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard...</h2>
              <p className="text-gray-600">Fetching your health information</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // For mobile, show the mobile navigation version
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedMobileNavigation 
          unreadNotifications={unreadCount}
          upcomingAppointments={upcomingCount}
        />
        
        <main className="pb-20 pt-4">
          {/* Mobile-optimized content */}
          <div className="px-4 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600">Manage your health journey</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Upcoming</p>
                      <p className="font-bold">{upcomingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Notifications</p>
                      <p className="font-bold">{unreadCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent appointments */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Recent Appointments</h2>
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments</h3>
                    <p className="text-gray-600 mb-4">You don't have any appointments yet.</p>
                    <Button onClick={() => navigate('/book-appointment')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Book Your First Appointment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                appointments.slice(0, 2).map((appointment) => (
                  <div key={appointment.id}>
                    <EnhancedAppointmentCard
                      appointment={appointment}
                      onJoinCall={() => {}}
                      onReschedule={() => {}}
                      onCancel={() => {}}
                      onMessage={() => {}}
                      variant="compact"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Desktop version - use the full enhanced dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome back, {user.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 text-lg mt-1">Manage your healthcare journey with confidence</p>
              {patientData && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">ID: {patientData.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">Blood Type: {patientData.blood_type || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Insurance: {patientData.insurance_provider || 'None'}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <BookAppointmentButton />
              <ViewProfileButton />
              {/* Patient-only quick access to join a video call */}
              {user?.role === 'patient' && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/join-call')}
                  className="flex items-center"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Video Call
                </Button>
              )}
              <RefreshDataButton onRefresh={refreshDashboardData} />
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border border-gray-200 rounded-xl p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="appointments" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              Appointments
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              Records
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Upcoming Appointments</p>
                      <p className="text-3xl font-bold text-blue-700">{upcomingCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Lab Tests</p>
                      <p className="text-3xl font-bold text-red-700">{labTests.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                      <TestTube className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Medical Records</p>
                      <p className="text-3xl font-bold text-green-700">{medicalRecords.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Total Payments</p>
                      <p className="text-3xl font-bold text-purple-700">₱{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent appointments overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="h-5 w-5" />
                    Recent Appointments
                  </CardTitle>
                  <CardDescription className="text-blue-100">Your latest appointments and consultations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments</h3>
                      <p className="text-gray-600 mb-4">You don't have any appointments yet.</p>
                      <Button onClick={() => navigate('/book-appointment')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Book Your First Appointment
                      </Button>
                    </div>
                  ) : (
                    <>
                      {appointments.slice(0, 3).map((appointment) => (
                        <div key={appointment.id}>
                          <EnhancedAppointmentCard
                            appointment={appointment}
                            onJoinCall={() => handleAppointmentAction(appointment.id, 'join-call')}
                            onReschedule={() => handleRescheduleAppointment(appointment)}
                            onCancel={() => {
                              if (appointment.status !== 'completed' && appointment.status !== 'cancelled') {
                                // For now, just show a simple prompt for reason
                                const reason = prompt("Please provide a reason for cancelling this appointment:");
                                if (reason && reason.trim()) {
                                  handleCancelAppointment(appointment, reason);
                                }
                              } else {
                                toast({
                                  title: "Cannot Cancel",
                                  description: `This appointment cannot be cancelled as it is already ${appointment.status}.`,
                                  variant: "destructive"
                                });
                              }
                            }}
                            onMessage={() => {
                              setSelectedAppointmentForModal(appointment);
                              setShowSendMessageModal(true);
                            }}
                            onViewDetails={() => {
                              setSelectedAppointmentForModal(appointment);
                              setShowViewAppointmentModal(true);
                            }}
                            variant="compact"
                          />
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('appointments')}
                        className="w-full"
                      >
                        View All Appointments
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-5 w-5" />
                    Recent Records
                  </CardTitle>
                  <CardDescription className="text-green-100">Your latest medical records and test results</CardDescription>
                </CardHeader>
                <CardContent>
                  {medicalRecords.length === 0 && labTests.length === 0 && prescriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Yet</h3>
                      <p className="text-gray-600 mb-4">Your medical records will appear here after consultations.</p>
                      <Button onClick={() => navigate('/book-appointment')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Book Consultation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Recent Medical Records */}
                      {medicalRecords.slice(0, 2).map((record: any) => (
                        <div key={record.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{record.appointments?.service_type || 'Medical Consultation'}</h4>
                              <p className="text-xs text-gray-500">Dr. {record.doctors?.users?.name || 'Unknown'} • {new Date(record.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">Record</Badge>
                          </div>
                          {record.diagnosis && (
                            <p className="text-sm text-gray-600 line-clamp-2">{record.diagnosis}</p>
                          )}
                        </div>
                      ))}
                      
                      {/* Recent Lab Tests */}
                      {labTests.slice(0, 2).map((test: any) => (
                        <div key={test.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{test.test_type}</h4>
                              <p className="text-xs text-gray-500">Dr. {test.doctors?.users?.name || 'Unknown'} • {new Date(test.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={test.result ? 'default' : 'secondary'} className="text-xs">
                              {test.result ? 'Complete' : 'Pending'}
                            </Badge>
                          </div>
                          {test.result && (
                            <p className="text-sm text-gray-600 line-clamp-2">{test.result}</p>
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('records')}
                        className="w-full mt-4"
                      >
                        View All Records
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  My Appointments
                </h2>
                <p className="text-gray-600 mt-1">Manage your scheduled consultations and check-ups</p>
              </div>
              <Button onClick={() => navigate('/book-appointment')} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <Plus className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
            </div>

            {appointments.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Appointments Yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                    Book your first appointment to start your healthcare journey with us. 
                    Our doctors are ready to help you with consultations, checkups, and more.
                  </p>
                  <Button 
                    onClick={() => navigate('/book-appointment')} 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-8 py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Book Your First Appointment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Appointment Filter/Sort */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{appointments.length}</span> appointment{appointments.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Sort by:</span>
                    <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white">
                      <option>Date (Newest)</option>
                      <option>Date (Oldest)</option>
                      <option>Status</option>
                    </select>
                  </div>
                </div>

                {/* Appointments Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="h-full">
                      <EnhancedAppointmentCard
                        appointment={appointment}
                        onJoinCall={() => handleAppointmentAction(appointment.id, 'join-call')}
                        onReschedule={() => handleRescheduleAppointment(appointment)}
                        onCancel={() => {
                          if (appointment.status !== 'completed' && appointment.status !== 'cancelled') {
                            // For now, just show a simple prompt for reason
                            const reason = prompt("Please provide a reason for cancelling this appointment:");
                            if (reason && reason.trim()) {
                              handleCancelAppointment(appointment, reason);
                            }
                          } else {
                            toast({
                              title: "Cannot Cancel",
                              description: `This appointment cannot be cancelled as it is already ${appointment.status}.`,
                              variant: "destructive"
                            });
                          }
                        }}
                        onMessage={() => {
                          setSelectedAppointmentForModal(appointment);
                          setShowSendMessageModal(true);
                        }}
                        onViewDetails={() => {
                          setSelectedAppointmentForModal(appointment);
                          setShowViewAppointmentModal(true);
                        }}
                        variant="detailed"
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination if needed */}
                {appointments.length > 6 && (
                  <div className="flex justify-center pt-6">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Previous
                      </Button>
                      <span className="px-3 py-1 bg-blue-500 text-white rounded">1</span>
                      <Button variant="outline" size="sm" disabled>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="records" className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Health Records
                </h2>
                <p className="text-gray-600 mt-1">Your complete medical history and test results</p>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 px-3 py-1">
                  {medicalRecords.length} records
                </Badge>
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-1">
                  {labTests.length} lab tests
                </Badge>
                <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 px-3 py-1">
                  {prescriptions.length} prescriptions
                </Badge>
              </div>
            </div>

            {medicalRecords.length === 0 && labTests.length === 0 && prescriptions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Health Records</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Your medical records, lab tests, and prescriptions from consultations will appear here 
                    after your appointments with our doctors.
                  </p>
                  <Button onClick={() => navigate('/book-appointment')} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Book Consultation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Medical Records Section */}
                {medicalRecords.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Medical Records ({medicalRecords.length})
                    </h3>
                    <div className="space-y-4">
                      {medicalRecords.map((record: any) => (
                        <Card key={record.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  {record.appointments?.service_type || 'Medical Consultation'}
                                </CardTitle>
                                <CardDescription>
                                  Dr. {record.doctors?.users?.name || 'Unknown'} • {record.doctors?.specialty}
                                  {record.appointments?.appointment_date && ` • ${new Date(record.appointments.appointment_date).toLocaleDateString()}`}
                                </CardDescription>
                              </div>
                              <Badge variant="outline">
                                {new Date(record.created_at).toLocaleDateString()}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {record.diagnosis && (
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700">Diagnosis</h4>
                                  <p className="text-sm">{record.diagnosis}</p>
                                </div>
                              )}
                              {record.notes && (
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700">Doctor's Notes</h4>
                                  <p className="text-sm text-gray-600">{record.notes}</p>
                                </div>
                              )}
                              {record.prescriptions && record.prescriptions.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700">Prescriptions</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                    {record.prescriptions.map((prescription: any) => (
                                      <div key={prescription.id} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                        <p className="font-medium">{prescription.medication_name}</p>
                                        {prescription.dosage && <p className="text-gray-600">Dosage: {prescription.dosage}</p>}
                                        {prescription.instructions && <p className="text-gray-600">{prescription.instructions}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="pt-4 border-t border-gray-200">
                                <div className="flex gap-2">
                                  <ViewMedicalRecordButton 
                                    recordId={record.id} 
                                    onViewRecord={handleViewMedicalRecord}
                                  />
                                  {record.prescriptions?.map((prescription: any) => (
                                    <ViewPrescriptionButton 
                                      key={prescription.id} 
                                      prescriptionId={prescription.id} 
                                      onViewPrescription={handleViewPrescription}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab Tests Section */}
                {labTests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-red-600" />
                      Lab Tests ({labTests.length})
                    </h3>
                    <div className="space-y-4">
                      {labTests.map((test: any) => (
                        <Card key={test.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{test.test_type}</CardTitle>
                                <CardDescription>
                                  Dr. {test.doctors?.users?.name || 'Unknown'} • {test.doctors?.specialty}
                                  {test.appointments?.appointment_date && ` • ${new Date(test.appointments.appointment_date).toLocaleDateString()}`}
                                </CardDescription>
                              </div>
                              <Badge variant={test.result ? "default" : "secondary"}>
                                {test.result ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700">Test Date</h4>
                                <p className="text-sm">{new Date(test.created_at).toLocaleDateString()}</p>
                              </div>
                              {test.result ? (
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700">Results</h4>
                                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <p className="text-sm">{test.result}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <p className="text-sm text-yellow-800">Test results are pending. You will be notified when results are available.</p>
                                </div>
                              )}
                              
                              {/* Lab Test Action Buttons */}
                              <div className="pt-4 border-t border-gray-200">
                                <ViewLabTestButton 
                                  testId={test.id} 
                                  onViewTest={handleViewLabTest}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescriptions Section */}
                {prescriptions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-purple-600" />
                      Active Prescriptions ({prescriptions.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prescriptions.map((prescription: any) => (
                        <Card key={prescription.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">{prescription.medication_name}</CardTitle>
                            <CardDescription>
                              Prescribed by Dr. {prescription.medical_records?.doctors?.users?.name || 'Unknown'}
                              • {new Date(prescription.created_at).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {prescription.dosage && (
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700">Dosage</h4>
                                  <p className="text-sm">{prescription.dosage}</p>
                                </div>
                              )}
                              {prescription.instructions && (
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700">Instructions</h4>
                                  <p className="text-sm text-gray-600">{prescription.instructions}</p>
                                </div>
                              )}
                              {prescription.medical_records?.diagnosis && (
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700">Related Diagnosis</h4>
                                  <p className="text-xs text-gray-500">{prescription.medical_records.diagnosis}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Payment History
                </h2>
                <p className="text-gray-600 mt-1">Track your healthcare expenses and payment records</p>
              </div>
              <div className="text-right bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-600 font-medium">Total Paid</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ₱{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-purple-500">{payments.length} transactions</p>
              </div>
            </div>

            {payments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Payment History</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Your payment history will appear here after you make payments for 
                    consultations, procedures, and lab tests.
                  </p>
                  <Button onClick={() => navigate('/book-appointment')} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Book Service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Payment Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-green-600 font-medium">Paid</p>
                        <p className="text-2xl font-bold text-green-700">
                          ₱{payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">{payments.filter(p => p.status === 'paid').length} transactions</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-yellow-600 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          ₱{payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-yellow-600">{payments.filter(p => p.status === 'pending').length} transactions</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-red-600 font-medium">Failed</p>
                        <p className="text-2xl font-bold text-red-700">
                          ₱{payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-red-600">{payments.filter(p => p.status === 'failed').length} transactions</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Transactions */}
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <Card key={payment.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">
                                {payment.appointmentDetails?.serviceType || payment.description || payment.payment_type}
                              </h3>
                              <Badge variant={
                                payment.status === 'paid' ? 'default' : 
                                payment.status === 'pending' ? 'secondary' : 
                                'destructive'
                              }>
                                {payment.status}
                              </Badge>
                            </div>
                            
                            {payment.appointmentDetails && (
                              <div className="text-sm text-gray-600">
                                <p>Doctor: {payment.appointmentDetails.doctorName} ({payment.appointmentDetails.specialty})</p>
                                <p>Appointment: {new Date(payment.appointmentDetails.date).toLocaleDateString()}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="capitalize">{payment.payment_method}</span>
                              <span>•</span>
                              <span>Created: {new Date(payment.created_at).toLocaleDateString()}</span>
                              {payment.provider && (
                                <>
                                  <span>•</span>
                                  <span>{payment.provider}</span>
                                </>
                              )}
                            </div>
                            
                            {payment.transaction_ref && (
                              <p className="text-xs text-gray-500">Transaction ID: {payment.transaction_ref}</p>
                            )}
                          </div>
                          
                          <div className="text-right ml-4 space-y-2">
                            <p className="text-xl font-bold">₱{payment.amount?.toLocaleString()}</p>
                            {payment.payment_date && (
                              <p className="text-sm text-gray-500">
                                Paid: {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                            )}
                            <PaymentActionButtons
                              payment={payment}
                              onDataRefresh={refreshDashboardData}
                              onViewPayment={handleViewPayment}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <SendMessageModal 
        appointment={selectedAppointmentForModal}
        isOpen={showSendMessageModal}
        onClose={() => {
          setShowSendMessageModal(false);
          setSelectedAppointmentForModal(null);
        }}
      />
      
      <ViewAppointmentModal 
        appointment={selectedAppointmentForModal}
        isOpen={showViewAppointmentModal}
        onClose={() => {
          setShowViewAppointmentModal(false);
          setSelectedAppointmentForModal(null);
        }}
      />
      
      <RescheduleAppointmentModal
        appointment={selectedAppointmentForModal}
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          setSelectedAppointmentForModal(null);
        }}
        onRescheduled={() => {
          setShowRescheduleModal(false);
          setSelectedAppointmentForModal(null);
          refreshDashboardData(); // Refresh to show updated appointment
        }}
      />
      
      {/* CancelAppointmentModal is managed through button trigger, not state */}

      {/* Records Modals */}
      <ViewMedicalRecordModal
        record={selectedMedicalRecord}
        isOpen={showMedicalRecordModal}
        onClose={() => {
          setShowMedicalRecordModal(false);
          setSelectedMedicalRecord(null);
        }}
      />

      <ViewLabTestModal
        test={selectedLabTest}
        isOpen={showLabTestModal}
        onClose={() => {
          setShowLabTestModal(false);
          setSelectedLabTest(null);
        }}
      />

      <ViewPrescriptionModal
        prescription={selectedPrescription}
        isOpen={showPrescriptionModal}
        onClose={() => {
          setShowPrescriptionModal(false);
          setSelectedPrescription(null);
        }}
      />

      <ViewPaymentModal
        payment={selectedPayment}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
      />
    </div>
  );
};

export default PatientDashboardEnhanced;