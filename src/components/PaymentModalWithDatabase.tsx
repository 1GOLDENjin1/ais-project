import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Check, Loader2, Calendar, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { rlsDataService } from "@/lib/rls-data-service";
import { db } from "@/lib/db";  

import type { FormEvent } from "react"; 
  
const PAYMONGO_BASE_URL =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PAYMONGO_BASE_URL
    ? (import.meta as any).env.VITE_PAYMONGO_BASE_URL
    : 'http://localhost:8787';


interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  servicePrice: string;
  serviceType: "package" | "service";
}

const PaymentModal = ({ isOpen, onClose, serviceName, servicePrice, serviceType }: PaymentModalProps) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    fullName: "Juan Dela Cruz",
    phone: "+63 912 345 6789",
    email: "juan.delacruz@email.com",
    date: "",
    time: "",
    notes: ""
  });
  const { toast } = useToast();

  const handlePayment = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // First, create the PayMongo payment link
      const amount = parseFloat(servicePrice.replace(/[^\d.]/g, ''));
      const reference = `MDC-${Date.now()}`;
      
      // Create PayMongo checkout session
  const paymongoResponse = await fetch(`${PAYMONGO_BASE_URL}/api/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: `Payment for ${serviceName}`,
          email: bookingDetails.email,
          reference: reference
        })
      });

      if (!paymongoResponse.ok) {
        throw new Error('Failed to create PayMongo checkout session');
      }

      const paymongoData = await paymongoResponse.json();
      
      // For demo purposes, simulate successful payment instead of redirecting
      // In real implementation, you would redirect to paymongoData.url
      console.log('PayMongo checkout URL:', paymongoData.url);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create appointment first if it's a service booking
      let appointmentId = null;
      
      if (serviceType === "service" && user && bookingDetails.date && bookingDetails.time) {
        // Get a default doctor for the appointment (in real app, would be selected)
        const doctors = await db.getAllDoctorsWithUsers();
        if (doctors.length > 0) {
          const appointment = await db.createAppointment({
            patientId: user.id,
            doctorId: doctors[0].id, // Using first available doctor
            appointmentDate: bookingDetails.date,
            appointmentTime: bookingDetails.time,
            appointmentType: 'consultation',
            status: 'pending',
            consultationType: 'in-person',
            durationMinutes: 60,
            reason: `${serviceName} - ${bookingDetails.notes || 'No additional notes'}`,
            fee: amount
          });
          
          if (appointment) {
            appointmentId = appointment.id;
          }
        }
      }

      // Create payment record with PayMongo reference
      const paymentData = {
        patient_id: user?.id || 'anonymous',
        appointment_id: appointmentId,
        amount: amount,
        payment_type: serviceType === 'package' ? 'procedure' as const : 'consultation' as const,
        payment_method: 'online' as const,
        status: 'completed' as const,
        description: `Payment for ${serviceName}`,
        transaction_ref: reference,
        payment_date: new Date().toISOString()
      };

      const paymentResult = await db.createPayment(paymentData);

      if (paymentResult) {
        // Save booking details to localStorage as backup
        const booking = {
          id: paymentResult.id,
          serviceName,
          servicePrice,
          serviceType,
          ...bookingDetails,
          bookingDate: new Date().toISOString(),
          status: "confirmed",
          paymentMethod: "PayMongo Online Payment",
          transactionId: reference,
          appointmentId
        };

        const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        existingBookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(existingBookings));

        setIsSuccess(true);
        toast({
          title: "Payment Successful! 💳",
          description: `Your ${serviceType} payment has been processed via PayMongo. Reference: ${reference}`,
        });

        // Create notification for the user
        if (user) {
          await db.createNotification({
            userId: user.id,
            title: "Payment Confirmed",
            message: `Your payment for ${serviceName} has been processed successfully via PayMongo. ${appointmentId ? 'Appointment has been scheduled.' : ''}`,
            type: 'general',
            priority: 'medium',
            isRead: false
          });
        }
        
        // Close modal after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
          // Reset form
          setBookingDetails({
            fullName: "Juan Dela Cruz",
            phone: "+63 912 345 6789",
            email: "juan.delacruz@email.com",
            date: "",
            time: "",
            notes: ""
          });
          onClose();
        }, 3000);
      } else {
        throw new Error('Failed to save payment to database');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please check if PayMongo server is running and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {isSuccess ? "Payment Successful!" : "Complete Payment"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? `Your ${serviceType} booking has been confirmed and saved to database.`
              : `Complete your payment for ${serviceName}`
            }
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center py-6">
            <div className="bg-success/10 rounded-full p-3 mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-center text-muted-foreground">
              Payment has been saved to database. You will receive a confirmation email shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{serviceName}</span>
                  <span className="text-lg font-bold text-primary">{servicePrice}</span>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Booking Details
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={bookingDetails.fullName}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={isProcessing}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={bookingDetails.phone}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={isProcessing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={bookingDetails.email}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isProcessing}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={bookingDetails.date}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, date: e.target.value }))}
                      disabled={isProcessing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Preferred Time</Label>
                    <Input 
                      id="time" 
                      type="time"
                      value={bookingDetails.time}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, time: e.target.value }))}
                      disabled={isProcessing}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any special requirements or notes..."
                    value={bookingDetails.notes}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={isProcessing}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </h3>
              
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input 
                  id="cardNumber" 
                  placeholder="1234 5678 9012 3456" 
                  defaultValue="4111 1111 1111 1111"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input 
                    id="expiry" 
                    placeholder="MM/YY" 
                    defaultValue="12/25"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123" 
                    defaultValue="123"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input 
                  id="cardholderName" 
                  placeholder="John Doe" 
                  defaultValue="John Doe"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${servicePrice}`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;