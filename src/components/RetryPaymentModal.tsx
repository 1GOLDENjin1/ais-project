import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Smartphone } from 'lucide-react';
import { PaymentService } from '../services/databaseService';
import PayMongoPopupModal, { PayMongoAppointmentData } from './PayMongoPopupModal';

interface RetryPaymentModalProps {
  paymentId: string;
  amount: number;
  description: string;
  appointmentId?: string;
  onPaymentSuccess: () => void;
  children: React.ReactNode;
}

export const RetryPaymentModal: React.FC<RetryPaymentModalProps> = ({
  paymentId,
  amount,
  description,
  appointmentId,
  onPaymentSuccess,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPayMongo, setShowPayMongo] = useState(false);
  const [modalAppointmentData, setModalAppointmentData] = useState<PayMongoAppointmentData | null>(null);
  const { toast } = useToast();

  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'gcash', label: 'GCash', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'grabpay', label: 'GrabPay', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'paymaya', label: 'PayMaya', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'bank_transfer', label: 'Online Banking', icon: <CreditCard className="h-4 w-4" /> },
  ];

  const handleRetryPayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Reset the payment status to pending for retry
      const success = await PaymentService.retryPayment(paymentId);

      if (success) {
        // Fetch payment + appointment details for the PayMongo modal
        const paymentDetails = await PaymentService.getPaymentDetails(paymentId);

        const mappedData: PayMongoAppointmentData = {
          id: appointmentId || paymentDetails?.appointment_id || paymentId,
          doctorName: paymentDetails?.appointments?.doctors?.users?.name || undefined,
          specialty: paymentDetails?.appointments?.doctors?.specialty || undefined,
          serviceType: paymentDetails?.appointments?.service_type || description,
          date: paymentDetails?.appointments?.appointment_date || undefined,
          time: paymentDetails?.appointments?.appointment_time || undefined,
          fee: Number(paymentDetails?.amount ?? amount) || amount,
          amount: Number(paymentDetails?.amount ?? amount) || amount,
          description,
          consultationType: paymentDetails?.appointments?.consultation_type || 'in-person',
          paymentMethod,
          patientDetails: paymentDetails ? {
            appointmentId: paymentDetails.appointment_id,
            patientId: paymentDetails.patient_id,
            paymentId: paymentDetails.id
          } : undefined
        };

        setModalAppointmentData(mappedData);
        // Show PayMongo modal for actual payment processing
        setShowPayMongo(true);
      } else {
        throw new Error('Failed to retry payment');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast({
        title: "Error",
        description: "Failed to retry payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (success: boolean, transactionRef?: string) => {
    if (success && transactionRef) {
      // Mark payment as paid in database
      const updated = await PaymentService.markPaymentPaid(
        paymentId, 
        transactionRef, 
        paymentMethod
      );

      if (updated) {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        setOpen(false);
        setShowPayMongo(false);
        onPaymentSuccess();
      }
    } else {
      toast({
        title: "Payment Failed",
        description: "Payment was not successful. Please try again.",
        variant: "destructive",
      });
      setShowPayMongo(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retry Payment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900">Payment Details</h4>
              <p className="text-sm text-blue-800">Amount: ₱{amount.toLocaleString()}</p>
              <p className="text-sm text-blue-800">Description: {description}</p>
            </div>

            <div className="space-y-3">
              <Label>Select Payment Method</Label>
              <div className="grid gap-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.value}
                    variant={paymentMethod === method.value ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method.value)}
                    className="justify-start h-12"
                  >
                    {method.icon}
                    <span className="ml-2">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRetryPayment}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Retry Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PayMongo Payment Modal */}
      {showPayMongo && appointmentId && modalAppointmentData && (
        <PayMongoPopupModal
          isOpen={showPayMongo}
          onClose={() => setShowPayMongo(false)}
          appointmentData={modalAppointmentData}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </>
  );
};