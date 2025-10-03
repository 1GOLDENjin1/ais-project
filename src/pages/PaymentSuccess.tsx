import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, User, MapPin, Video, Phone } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import type { Appointment, Payment } from '@/lib/db';

const PaymentSuccess = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  
  const reference = searchParams.get('reference');
  const appointmentId = searchParams.get('appointmentId');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown + auto redirect
    let remaining = 3;
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        navigate('/dashboard');
      }
    }, 1000);

    const updatePaymentStatus = async () => {
      if (!reference && !appointmentId) {
        setLoading(false);
        return;
      }

      try {
        // Primary lookup: by reference
        let foundPayment = reference ? db.getPaymentById(reference) : undefined;
        // Fallback: by appointment id
        if (!foundPayment && appointmentId) {
          const related = db.getPaymentsByAppointmentId(appointmentId);
            if (related.length) {
              related.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
              foundPayment = related[0];
            }
        }
        if (foundPayment) {
          // Update payment status to completed
          const updatedPayment = db.updatePayment(foundPayment.id, {
            status: 'completed'
          });
          
          if (updatedPayment && updatedPayment.appointment_id) {
            // Update appointment status to confirmed
            const updatedAppointment = db.updateAppointmentStatus(updatedPayment.appointment_id, 'confirmed');
            
            // Create confirmation notification
            if (updatedAppointment && user) {
              await db.createNotification({
                userId: user.id,
                title: "Appointment Confirmed!",
                message: `Payment received! Your appointment for ${new Date(updatedAppointment.appointmentDate).toLocaleDateString()} at ${updatedAppointment.appointmentTime} has been confirmed.`,
                type: 'appointment',
                priority: 'high',
                isRead: false,
                relatedAppointmentId: updatedAppointment.id
              });
            }
            
            setPayment(updatedPayment);
            setAppointment(updatedAppointment || null);
          }
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    updatePaymentStatus();

    // Clean up timer on component unmount
    return () => {
      clearInterval(interval);
    };
  }, [reference, appointmentId, navigate]);

  const getConsultationIcon = (type?: string) => {
    switch (type) {
      case 'video-call': return Video;
      case 'phone': return Phone;
      default: return MapPin;
    }
  };

  const getConsultationText = (type?: string) => {
    switch (type) {
      case 'video-call': return 'Online Video Consultation';
      case 'phone': return 'Phone Consultation';
      default: return 'Physical Visit';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary"></div>
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
                      Appointment Automatically Confirmed!
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
                  Appointment Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Appointment Date & Time */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {appointment.appointmentTime}
                    </p>
                  </div>
                </div>

                {/* Doctor */}
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p className="text-sm text-muted-foreground">
                      Dr. {appointment.doctorId} {/* This should be doctor name from lookup */}
                    </p>
                  </div>
                </div>

                {/* Consultation Type */}
                <div className="flex items-center gap-3">
                  {React.createElement(getConsultationIcon(appointment.consultationType), {
                    className: "h-5 w-5 text-primary"
                  })}
                  <div>
                    <p className="font-medium">Consultation Type</p>
                    <p className="text-sm text-muted-foreground">
                      {getConsultationText(appointment.consultationType)}
                    </p>
                  </div>
                </div>

                {/* Appointment Type */}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Service Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {appointment.appointmentType}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Status: Confirmed
                    </span>
                  </div>
                </div>

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
                  <span className="text-sm font-mono">{payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Amount:</span>
                  <span className="text-sm font-semibold">₱{payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Payment Date:</span>
                  <span className="text-sm">
                    {payment.updatedAt ? new Date(payment.updatedAt).toLocaleString() : 'Just now'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <span className="text-sm text-green-600 font-medium">Paid</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Appointment Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive a confirmation email and SMS (if provided) with your appointment details.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Prepare for Your Visit</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment?.consultationType === 'video-call' 
                      ? 'Make sure you have a stable internet connection and a quiet space for your video consultation.'
                      : 'Arrive 15 minutes early and bring a valid ID and any relevant medical documents.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Track Your Appointment</p>
                  <p className="text-sm text-muted-foreground">
                    Check your patient dashboard for updates and appointment reminders.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
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
              Book Another Appointment
            </Button>
          </div>

          {/* Auto-redirect countdown */}
          <div className="text-center text-sm text-muted-foreground mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p>🚀 Automatically redirecting to your dashboard in {Math.max(countdown, 0)} second{countdown === 1 ? '' : 's'}...</p>
            <p className="mt-1 text-xs flex flex-col gap-0.5">
              <span>Reference: <span className="font-mono">{reference || 'N/A'}</span></span>
              {appointmentId && <span>Appointment: <span className="font-mono">{appointmentId}</span></span>}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;