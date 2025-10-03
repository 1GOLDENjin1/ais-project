import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CreditCard, Smartphone, Banknote, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PAYMONGO_BASE_URL = 
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PAYMONGO_BASE_URL
    ? (import.meta as any).env.VITE_PAYMONGO_BASE_URL
    : 'http://localhost:8787';type ConsultationType = 'in-person' | 'video-call' | 'phone';

export interface PayMongoAppointmentData {
  id: string;
  doctorName?: string;
  specialty?: string;
  serviceType?: string;
  date?: string;
  time?: string;
  fee?: number;
  amount?: number;
  description?: string;
  consultationType?: ConsultationType;
  paymentMethod?: string;
  patientDetails?: Record<string, unknown>;
}

interface PayMongoPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData: PayMongoAppointmentData;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentComplete?: (success: boolean, transactionRef?: string) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processing: string;
}

const PayMongoPopupModal: React.FC<PayMongoPopupModalProps> = ({
  isOpen,
  onClose,
  appointmentData,
  onPaymentSuccess,
  onPaymentComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [paymentIframe, setPaymentIframe] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (appointmentData.paymentMethod) {
      setSelectedMethod(appointmentData.paymentMethod);
    }
  }, [appointmentData.paymentMethod]);

  const amountInPesos = appointmentData.fee ?? appointmentData.amount ?? 0;
  const appointmentDescription = appointmentData.description 
    ?? `${appointmentData.serviceType || 'Healthcare Service'}${appointmentData.doctorName ? ` - ${appointmentData.doctorName}` : ''}`;
  const consultationType = appointmentData.consultationType ?? 'in-person';
  const paymentPatientDetails = appointmentData.patientDetails ?? {
    doctorName: appointmentData.doctorName,
    specialty: appointmentData.specialty,
    date: appointmentData.date,
    time: appointmentData.time,
    consultationType
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Visa, Mastercard, JCB',
      processing: 'Instant processing'
    },
    {
      id: 'gcash',
      name: 'GCash',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Pay with GCash wallet',
      processing: 'Instant processing'
    },
    {
      id: 'paymaya',
      name: 'PayMaya',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Pay with PayMaya wallet',
      processing: 'Instant processing'
    },
    {
      id: 'installment',
      name: 'Installment',
      icon: <Banknote className="h-5 w-5" />,
      description: '0% interest available',
      processing: 'Subject to approval'
    }
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log('🔄 Creating PayMongo payment...');
      
      // Create payment session with PayMongo
      const amountInCentavos = Math.round(Number(amountInPesos) * 100);
      if (!Number.isFinite(amountInCentavos) || amountInCentavos <= 0) {
        throw new Error('Invalid payment amount.');
      }

      const response = await fetch(`${PAYMONGO_BASE_URL}/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCentavos,
          description: appointmentDescription,
          appointmentId: appointmentData.id,
          patientDetails: paymentPatientDetails,
          paymentMethod: appointmentData.paymentMethod || selectedMethod
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const paymentData = await response.json();
      
      if (paymentData.checkout_url) {
        // Instead of redirecting, embed in iframe
        setPaymentIframe(paymentData.checkout_url);
        
        // Listen for payment completion
        const checkPaymentStatus = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${PAYMONGO_BASE_URL}/payment-status/${appointmentData.id}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.status === 'paid') {
                clearInterval(checkPaymentStatus);
                setPaymentIframe(null);
                onPaymentSuccess?.(statusData);
                onPaymentComplete?.(true, statusData?.transaction_ref || statusData?.id);
                onClose();
                
                toast({
                  title: "Payment Successful!",
                  description: appointmentData.doctorName
                    ? `Your appointment with ${appointmentData.doctorName} has been confirmed.`
                    : 'Your payment has been confirmed.',
                  variant: "default",
                });
              }
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        }, 3000); // Check every 3 seconds

        // Clear interval after 10 minutes
        setTimeout(() => {
          clearInterval(checkPaymentStatus);
        }, 600000);
        
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseIframe = () => {
    setPaymentIframe(null);
    toast({
      title: "Payment Cancelled",
      description: "You can try again or choose a different payment method.",
      variant: "destructive",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {paymentIframe ? (
          // Payment iframe view
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Complete Your Payment</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseIframe}
                  className="p-1 h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    Secure Payment Processing
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Your payment is protected by PayMongo's secure encryption
                </p>
              </div>
              
              <iframe
                src={paymentIframe}
                className="w-full h-[500px] border rounded-lg"
                title="PayMongo Checkout"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
              
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={handleCloseIframe}
                  className="text-sm"
                >
                  Cancel Payment
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Payment selection view
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Payment Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1 h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Appointment Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Appointment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Doctor:</span>
                    <span className="text-sm font-medium">{appointmentData.doctorName || 'Assigned Doctor'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Specialty:</span>
                    <span className="text-sm">{appointmentData.specialty || 'Healthcare Specialist'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Service:</span>
                    <span className="text-sm">{appointmentData.serviceType || appointmentDescription}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date & Time:</span>
                    <span className="text-sm">
                      {appointmentData.date ? `${appointmentData.date}` : 'Schedule pending'}
                      {appointmentData.time ? ` at ${appointmentData.time}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <Badge variant="outline">
                      {consultationType}
                    </Badge>
                  </div>
                  <div className="border-t my-3" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(amountInPesos)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <div>
                <h3 className="font-medium mb-3">Select Payment Method</h3>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                            {method.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{method.name}</h4>
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                selectedMethod === method.id
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground/30'
                              }`}>
                                {selectedMethod === method.id && (
                                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                            <p className="text-xs text-green-600">{method.processing}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Secure & Protected</h4>
                    <p className="text-xs text-green-600">
                      All payments are processed securely through PayMongo's encrypted platform.
                      Your card details are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatCurrency(appointmentData.fee)}`
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayMongoPopupModal;