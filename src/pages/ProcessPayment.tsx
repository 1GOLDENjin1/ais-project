import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  CreditCard, 
  DollarSign, 
  Receipt, 
  User, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Banknote,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'online' | 'insurance';
  payment_date?: string;
  transaction_ref?: string;
  description: string;
}

interface PaymentForm {
  amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'online' | 'insurance';
  reference_number: string;
  notes: string;
  receipt_number: string;
}

const ProcessPayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get payment data from navigation state
  const paymentData = location.state?.payment as Payment | undefined;
  
  // Form states
  const [form, setForm] = useState<PaymentForm>({
    amount: paymentData?.amount || 0,
    payment_method: paymentData?.payment_method || 'cash',
    reference_number: '',
    notes: '',
    receipt_number: ''
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!paymentData) {
      toast({
        title: "No Payment Selected",
        description: "Please select a payment to process.",
        variant: "destructive"
      });
      navigate('/staff-dashboard');
      return;
    }

    // Generate automatic receipt number
    const receiptNum = `RCP-${Date.now().toString().slice(-8)}`;
    setForm(prev => ({ ...prev, receipt_number: receiptNum }));
  }, [paymentData, navigate, toast]);

  const handleInputChange = (field: keyof PaymentForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (form.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!form.receipt_number.trim()) {
      newErrors.receipt_number = 'Receipt number is required';
    }

    if (form.payment_method === 'credit_card' || form.payment_method === 'debit_card' || form.payment_method === 'bank_transfer') {
      if (!form.reference_number.trim()) {
        newErrors.reference_number = 'Reference number is required for this payment method';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProcessPayment = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before processing payment.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call to process payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would typically make API calls to:
      // 1. Update payment status to 'paid'
      // 2. Record payment details in database
      // 3. Generate receipt
      // 4. Send confirmation to patient

      toast({
        title: "Payment Processed Successfully",
        description: `Payment of $${form.amount} has been processed for ${paymentData?.patient_name}.`,
      });

      navigate('/staff-dashboard', { 
        state: { 
          tab: 'payments',
          message: 'Payment processed successfully' 
        }
      });
    } catch (error) {
      toast({
        title: "Error Processing Payment",
        description: "Failed to process the payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    setLoading(true);

    try {
      // Simulate API call to process refund
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Refund Processed",
        description: `Refund of $${form.amount} has been processed for ${paymentData?.patient_name}.`,
      });

      navigate('/staff-dashboard', { 
        state: { 
          tab: 'payments',
          message: 'Refund processed successfully' 
        }
      });
    } catch (error) {
      toast({
        title: "Error Processing Refund",
        description: "Failed to process the refund. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/staff-dashboard', { state: { tab: 'payments' } });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />;
      case 'insurance':
        return <Receipt className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Payment Selected</h2>
            <p className="text-gray-600 mb-4">Please select a payment to process from the dashboard.</p>
            <Button onClick={() => navigate('/staff-dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Process Payment
              </h1>
              <p className="text-gray-600">Process payment for {paymentData.patient_name}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            {paymentData.status === 'paid' && (
              <Button 
                variant="outline"
                onClick={handleRefund}
                disabled={loading}
                className="text-orange-600 hover:bg-orange-50"
              >
                Process Refund
              </Button>
            )}
            <Button 
              onClick={handleProcessPayment}
              disabled={loading || paymentData.status === 'paid'}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Information */}
          <div className="space-y-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Patient Name</Label>
                  <p className="text-lg font-semibold">{paymentData.patient_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Payment ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{paymentData.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Appointment ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{paymentData.appointment_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="text-sm">{paymentData.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={getStatusColor(paymentData.status)}>
                    {paymentData.status.toUpperCase()}
                  </Badge>
                </div>
                {paymentData.payment_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment Date</Label>
                    <p className="text-sm">{new Date(paymentData.payment_date).toLocaleDateString()}</p>
                  </div>
                )}
                {paymentData.transaction_ref && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Transaction Reference</Label>
                    <p className="text-sm font-mono">{paymentData.transaction_ref}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Payment Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">${paymentData.amount}</p>
                  <p className="text-gray-600 mt-2">{paymentData.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      value={form.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 h-4 w-4 text-gray-400">
                      {getPaymentMethodIcon(form.payment_method)}
                    </div>
                    <select 
                      id="payment_method"
                      value={form.payment_method}
                      onChange={(e) => handleInputChange('payment_method', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online">Online Payment</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="receipt_number">Receipt Number *</Label>
                  <Input
                    id="receipt_number"
                    value={form.receipt_number}
                    onChange={(e) => handleInputChange('receipt_number', e.target.value)}
                    placeholder="RCP-12345678"
                    className={errors.receipt_number ? 'border-red-500' : ''}
                  />
                  {errors.receipt_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.receipt_number}</p>
                  )}
                </div>

                {(form.payment_method === 'credit_card' || form.payment_method === 'debit_card' || form.payment_method === 'bank_transfer') && (
                  <div>
                    <Label htmlFor="reference_number">
                      {form.payment_method === 'bank_transfer' ? 'Transfer Reference *' : 'Transaction Reference *'}
                    </Label>
                    <Input
                      id="reference_number"
                      value={form.reference_number}
                      onChange={(e) => handleInputChange('reference_number', e.target.value)}
                      placeholder={form.payment_method === 'bank_transfer' ? 'BT-123456789' : 'TXN-123456789'}
                      className={errors.reference_number ? 'border-red-500' : ''}
                    />
                    {errors.reference_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.reference_number}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes about this payment..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">Payment Method Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center space-x-2">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span><strong>Cash:</strong> No additional reference required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span><strong>Card:</strong> Enter card transaction reference</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span><strong>Bank Transfer:</strong> Enter transfer reference number</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4 text-orange-600" />
                  <span><strong>Insurance:</strong> Verify coverage before processing</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons for Mobile */}
        <div className="lg:hidden flex space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          {paymentData.status === 'paid' && (
            <Button 
              variant="outline"
              onClick={handleRefund}
              disabled={loading}
              className="flex-1 text-orange-600 hover:bg-orange-50"
            >
              Refund
            </Button>
          )}
          <Button 
            onClick={handleProcessPayment}
            disabled={loading || paymentData.status === 'paid'}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white"
          >
            {loading ? 'Processing...' : 'Process'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProcessPayment;