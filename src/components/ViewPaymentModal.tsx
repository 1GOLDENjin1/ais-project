import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CreditCard, 
  User, 
  Calendar, 
  Clock,
  FileText,
  Download,
  Printer,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Receipt,
  Building,
  Hash
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  payment_method: string;
  payment_type?: string;
  description?: string;
  transaction_ref?: string;
  provider?: string;
  created_at: string;
  payment_date?: string;
  updated_at?: string;
  appointmentDetails?: {
    id: string;
    serviceType: string;
    doctorName: string;
    specialty: string;
    date: string;
    time?: string;
  };
  appointment_id?: string;
  patient_id?: string;
}

interface ViewPaymentModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewPaymentModal: React.FC<ViewPaymentModalProps> = ({
  payment,
  isOpen,
  onClose
}) => {
  if (!payment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // Create a detailed receipt
    const receiptData = `
PAYMENT RECEIPT
===============

Receipt ID: ${payment.id}
Date: ${new Date(payment.created_at).toLocaleDateString()}
Status: ${payment.status.toUpperCase()}

PAYMENT INFORMATION:
Amount: ₱${payment.amount.toLocaleString()}
Payment Method: ${payment.payment_method}
${payment.provider ? `Provider: ${payment.provider}` : ''}
${payment.transaction_ref ? `Transaction Reference: ${payment.transaction_ref}` : ''}
${payment.payment_date ? `Payment Date: ${new Date(payment.payment_date).toLocaleDateString()}` : ''}

SERVICE DETAILS:
${payment.appointmentDetails?.serviceType || payment.description || payment.payment_type || 'Healthcare Service'}
${payment.appointmentDetails?.doctorName ? `Doctor: ${payment.appointmentDetails.doctorName}` : ''}
${payment.appointmentDetails?.specialty ? `Specialty: ${payment.appointmentDetails.specialty}` : ''}
${payment.appointmentDetails?.date ? `Appointment Date: ${new Date(payment.appointmentDetails.date).toLocaleDateString()}` : ''}

---
Thank you for your payment!
Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-receipt-${payment.id}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Payment Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete payment transaction information and receipt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Header */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(payment.status)} flex items-center space-x-2 px-3 py-1`}>
              {getStatusIcon(payment.status)}
              <span className="font-medium capitalize">{payment.status}</span>
            </Badge>
            <span className="text-sm text-gray-500">Payment ID: {payment.id}</span>
          </div>

          {/* Payment Amount */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <Label className="text-lg font-semibold text-green-800">Total Amount</Label>
                </div>
                <div className="text-4xl font-bold text-green-700">
                  ₱{payment.amount.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-2">
                  {payment.status === 'paid' ? 'Payment Completed' : 
                   payment.status === 'pending' ? 'Payment Processing' :
                   payment.status === 'failed' ? 'Payment Failed' : 'Payment Cancelled'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Information */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <Label className="font-semibold">Payment Information</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Method:</span>
                    <span className="ml-2 capitalize">{payment.payment_method}</span>
                  </div>
                  {payment.provider && (
                    <div>
                      <span className="font-medium">Provider:</span>
                      <span className="ml-2">{payment.provider}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span>
                    <span className="ml-2">{new Date(payment.created_at).toLocaleDateString()}</span>
                  </div>
                  {payment.payment_date && (
                    <div>
                      <span className="font-medium">Paid:</span>
                      <span className="ml-2">{new Date(payment.payment_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {payment.transaction_ref && (
                    <div>
                      <span className="font-medium">Reference:</span>
                      <span className="ml-2 font-mono text-xs">{payment.transaction_ref}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card className="bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Building className="h-4 w-4 text-purple-600" />
                  <Label className="font-semibold">Service Details</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Service:</span>
                    <span className="ml-2">
                      {payment.appointmentDetails?.serviceType || 
                       payment.description || 
                       payment.payment_type || 
                       'Healthcare Service'}
                    </span>
                  </div>
                  {payment.appointmentDetails?.doctorName && (
                    <div>
                      <span className="font-medium">Doctor:</span>
                      <span className="ml-2">{payment.appointmentDetails.doctorName}</span>
                    </div>
                  )}
                  {payment.appointmentDetails?.specialty && (
                    <div>
                      <span className="font-medium">Specialty:</span>
                      <span className="ml-2">{payment.appointmentDetails.specialty}</span>
                    </div>
                  )}
                  {payment.appointmentDetails?.date && (
                    <div>
                      <span className="font-medium">Appointment:</span>
                      <span className="ml-2">
                        {new Date(payment.appointmentDetails.date).toLocaleDateString()}
                        {payment.appointmentDetails.time && ` at ${payment.appointmentDetails.time}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="h-4 w-4 text-gray-600" />
                <Label className="font-semibold">Transaction Details</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Transaction ID:</span>
                  <div className="mt-1 font-mono text-xs bg-gray-100 p-2 rounded">
                    {payment.id}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Payment Type:</span>
                  <div className="mt-1 capitalize">{payment.payment_type || 'Standard Payment'}</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="mt-1">
                    <Badge className={getStatusColor(payment.status)}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Timeline */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="h-4 w-4 text-gray-600" />
                <Label className="font-semibold">Payment Timeline</Label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div className="text-sm">
                    <span className="font-medium">Payment Created:</span>
                    <span className="ml-2">{new Date(payment.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {payment.payment_date && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div className="text-sm">
                      <span className="font-medium">Payment Completed:</span>
                      <span className="ml-2">{new Date(payment.payment_date).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {payment.updated_at && payment.updated_at !== payment.created_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                    <div className="text-sm">
                      <span className="font-medium">Last Updated:</span>
                      <span className="ml-2">{new Date(payment.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <Label className="font-semibold">Payment Summary</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    ₱{payment.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Amount</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {payment.status === 'paid' ? '✓' : '○'}
                  </div>
                  <div className="text-xs text-gray-600">Paid</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600 capitalize">
                    {payment.payment_method}
                  </div>
                  <div className="text-xs text-gray-600">Method</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">Date</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="flex items-center space-x-1"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadReceipt}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download Receipt</span>
            </Button>
          </div>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};