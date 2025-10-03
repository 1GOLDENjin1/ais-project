// from folder2
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, User, MapPin, Video, Phone, AlertCircle, Home } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { healthcareService } from '@/services/healthcare-service';

interface AppointmentData {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  reason?: string;
  doctors?: {
    users?: {
      name: string;
    };
    specialty: string;
  };
}

interface PaymentData {
  id: string;
  appointment_id: string;
  amount: number;
  status: string;
  provider: string;
  transaction_ref?: string;
  payment_date?: string;
  description?: string;
}

const PaymentSuccess = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const reference = searchParams.get('reference');
  
  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        if (!reference) {
          // Check for pending payment in localStorage
          const pendingPayment = localStorage.getItem('pendingPayment');
          if (!pendingPayment) {
            setError('No payment reference found');
            setLoading(false);
            return;
          }

          const paymentInfo = JSON.parse(pendingPayment);
          
          // Update payment status to paid
          const { data: updatedPayment, error: paymentError } = await supabase
            .from('payments')
            .update({ 
              status: 'paid',
              payment_date: new Date().toISOString(),
              transaction_ref: `paymongo_${Date.now()}`
            })
            .eq('id', paymentInfo.paymentId)
            .select()
            .single();

          if (paymentError || !updatedPayment) {
            console.error('Failed to update payment status:', paymentError);
            setError('Failed to update payment status');
            return;
          }

          // Update appointment status to confirmed
          const { data: updatedAppointment, error: appointmentError } = await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', paymentInfo.appointmentId)
            .select(`
              *,
              doctors!inner(
                users!inner(name),
                specialty
              )
            `)
            .single();

          if (appointmentError || !updatedAppointment) {
            console.error('Failed to update appointment status:', appointmentError);
            setError('Failed to update appointment status');
            return;
          }

          setPayment(updatedPayment);
          setAppointment(updatedAppointment);

          // Clear pending payment data
          localStorage.removeItem('pendingPayment');
          localStorage.removeItem('selectedService');

        } else {
          // Handle payment with reference ID
          const { data: paymentRecord, error: paymentError } = await supabase
            .from('payments')
            .update({ 
              status: 'paid',
              payment_date: new Date().toISOString() 
            })
            .eq('id', reference)
            .select()
            .single();

          if (paymentError || !paymentRecord) {
            setError('Payment record not found');
            return;
          }

          // Update appointment status
          const { data: appointmentRecord, error: appointmentError } = await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', paymentRecord.appointment_id)
            .select(`
              *,
              doctors!inner(
                users!inner(name),
                specialty
              )
            `)
            .single();

          if (appointmentError || !appointmentRecord) {
            setError('Appointment record not found');
            return;
          }

          setPayment(paymentRecord);
          setAppointment(appointmentRecord);
        }

        // Create success notification
        if (user) {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: 'Payment Successful!',
              message: `Your appointment has been confirmed and payment processed successfully.`,
              type: 'appointment',
              priority: 'high',
              is_read: false,
              created_at: new Date().toISOString()
            });
        }

      } catch (error) {
        console.error('Error processing payment return:', error);
        setError('An error occurred while processing your payment');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentReturn();
  }, [reference, user]);

  const getConsultationIcon = (type?: string) => {
    switch (type) {
      case 'video': return Video;
      case 'phone': return Phone;
      default: return MapPin;
    }
  };

  const getConsultationText = (type?: string) => {
    switch (type) {
      case 'video': return 'Online Video Consultation';
      case 'phone': return 'Phone Consultation';
      default: return 'Physical Visit';
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your payment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-red-800 mb-2">
                    Payment Processing Error
                  </h1>
                  <p className="text-red-700 mb-4">{error}</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                      Go to Dashboard
                    </Button>
                    <Button onClick={() => navigate('/book-appointment')} className="bg-gray-600 hover:bg-gray-700">
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Success Header */}
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-green-800 mb-2">
                  Payment Successful!
                </h1>
                <p className="text-green-700 mb-2">
                  Your payment has been processed successfully.
                </p>
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-semibold">
                      Appointment Confirmed!
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          {appointment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Service Type */}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Service</p>
                    <p className="text-sm text-gray-600">
                      {appointment.service_type}
                    </p>
                  </div>
                </div>

                {/* Doctor */}
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p className="text-sm text-gray-600">
                      Dr. {appointment.doctors?.users?.name || 'Unknown Doctor'}
                    </p>
                    {appointment.doctors?.specialty && (
                      <p className="text-xs text-gray-500">
                        {appointment.doctors.specialty}
                      </p>
                    )}
                  </div>
                </div>

                {/* Appointment Date & Time */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {appointment.appointment_time}
                    </p>
                  </div>
                </div>

                {/* Consultation Type */}
                <div className="flex items-center gap-3">
                  {React.createElement(getConsultationIcon(appointment.consultation_type), {
                    className: "h-5 w-5 text-blue-600"
                  })}
                  <div>
                    <p className="font-medium">Consultation Type</p>
                    <p className="text-sm text-gray-600">
                      {getConsultationText(appointment.consultation_type)}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {appointment.reason && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-medium text-blue-800 mb-1">Reason for Visit</p>
                    <p className="text-sm text-blue-700">{appointment.reason}</p>
                  </div>
                )}

              </CardContent>
            </Card>
          )}

          {/* Payment Details */}
          {payment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Payment ID:</span>
                  <span className="text-sm font-mono">{payment.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Amount:</span>
                  <span className="text-sm font-semibold">{formatPrice(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Provider:</span>
                  <span className="text-sm">{payment.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <span className="text-sm text-green-600 font-medium">Paid</span>
                </div>
                {payment.transaction_ref && (
                  <div className="flex justify-between">
                    <span className="text-sm">Transaction:</span>
                    <span className="text-sm font-mono">{payment.transaction_ref}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Appointment Confirmed</p>
                  <p className="text-sm text-gray-600">
                    Your appointment is now confirmed and saved in the system.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Prepare for Your Visit</p>
                  <p className="text-sm text-gray-600">
                    {appointment?.consultation_type === 'video' 
                      ? 'Make sure you have a stable internet connection for your video consultation.'
                      : 'Arrive 15 minutes early and bring a valid ID and any relevant medical documents.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Track Your Appointment</p>
                  <p className="text-sm text-gray-600">
                    Check your patient dashboard for updates and appointment details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/patient/dashboard')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/book-appointment')}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Another
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;