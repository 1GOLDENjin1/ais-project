import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import type { Appointment, Payment } from '@/lib/db';

const PaymentFailed = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  
  const reference = searchParams.get('reference');

  useEffect(() => {
    // Auto-redirect to dashboard after 10 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/dashboard');
    }, 10000);

    const updatePaymentStatus = async () => {
      if (!reference) {
        setLoading(false);
        return;
      }

      try {
        // Find the payment by reference ID
        const foundPayment = db.getPaymentById(reference);
        if (foundPayment) {
          // Update payment status to failed
          const updatedPayment = db.updatePayment(reference, {
            status: 'failed'
          });
          
          if (updatedPayment && updatedPayment.appointment_id) {
            // Get appointment details
            const foundAppointment = db.getAppointmentById(updatedPayment.appointment_id);
            setAppointment(foundAppointment || null);
          }
          
          setPayment(updatedPayment);
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
      clearTimeout(redirectTimer);
    };
  }, [reference, navigate]);

  const handleRetryPayment = () => {
    if (appointment) {
      // Navigate back to the booking page with the appointment data
      navigate('/book-appointment', { 
        state: { 
          retryAppointment: appointment,
          paymentReference: reference 
        } 
      });
    } else {
      navigate('/book-appointment');
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
          
          {/* Failed Header */}
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-red-800 mb-2">
                  Payment Failed
                </h1>
                <p className="text-red-700">
                  We couldn't process your payment. Your appointment is still available for booking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          {payment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Payment Reference:</span>
                  <span className="text-sm font-mono">{payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Amount:</span>
                  <span className="text-sm font-semibold">₱{payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <span className="text-sm text-red-600 font-medium">Failed</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Details (if available) */}
          {appointment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Appointment Details (Pending Payment)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Date & Time:</span>
                  <span className="text-sm">
                    {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Doctor:</span>
                  <span className="text-sm">Dr. {appointment.doctorId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Service:</span>
                  <span className="text-sm capitalize">{appointment.appointmentType}</span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Status: Payment Required
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Common Payment Issues */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Why payments fail:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Insufficient funds in your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Card expired or blocked by your bank</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Internet connection issues during payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Payment timeout or browser issues</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">What to try:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Check your account balance and card status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Try a different payment method or card</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Ensure stable internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    <span>Contact your bank if the issue persists</span>
                  </li>
                </ul>
              </div>

            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            
            {/* Primary Actions */}
            <div className="flex gap-4">
              <Button 
                onClick={handleRetryPayment}
                className="flex-1 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Payment
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/services')}
                className="flex-1"
              >
                Book New Appointment
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Homepage
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                My Dashboard
              </Button>
            </div>

          </div>

          {/* Help Section */}
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <HelpCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium text-blue-800 mb-1">Need Help?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  If you continue to experience issues with payment, please contact our support team.
                </p>
                <div className="space-y-1 text-xs text-blue-600">
                  <p>📞 Phone: (02) 8123-4567</p>
                  <p>✉️ Email: support@mendozadiagnostic.com</p>
                  <p>⏰ Hours: Monday - Saturday, 8:00 AM - 6:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;