import React, { useState, useEffect } from 'react';
import { 
  DollarSign,
  Search,
  Filter,
  Eye,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PatientInfoModal from '@/components/modals/PatientInfoModal';
import DoctorInfoModal from '@/components/modals/DoctorInfoModal';
import StaffManagementService, { type StaffPayment } from '@/services/staffDatabaseService';

// Using database interface
type PaymentRecord = StaffPayment;

const PaymentManagement: React.FC = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Load payments from database
  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await StaffManagementService.getAllPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load payments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter payments based on search and status
  const filteredPayments = payments.filter(payment => {
    const patientName = payment.patient?.users?.name || '';
    const doctorName = payment.appointment?.doctor?.users?.name || '';
    const service = payment.appointment?.service_type || payment.description || '';
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleProcessPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'paid' as const, paymentMethod: 'Credit Card' }
          : payment
      ));
      
      toast({
        title: "Payment Processed",
        description: "Payment has been successfully processed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = (payment: PaymentRecord) => {
    const patientInfo = {
      id: payment.patient_id,
      name: payment.patient?.users?.name || 'Unknown Patient',
      phone: 'Not available', // Not available in current StaffPayment interface
      email: payment.patient?.users?.email || 'Not available'
    };
    setSelectedPatient(patientInfo);
    setShowPatientModal(true);
  };

  const handleViewDoctor = (payment: PaymentRecord) => {
    const doctorInfo = {
      id: payment.appointment?.doctor?.users?.name || payment.id,
      name: payment.appointment?.doctor?.users?.name || 'Unknown Doctor',
      specialty: 'General Consultation', // Not available in current interface
      phone: 'Not available',
      email: 'Not available'
    };
    setSelectedDoctor(doctorInfo);
    setShowDoctorModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Clock className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg">Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-purple-600" />
              <span>Payment Management</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => toast({ title: "Filter", description: "Filter options opened" })}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4 flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search patients, doctors, or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Payment List */}
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div 
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      ₱
                    </div>
                    <div>
                      <p 
                        className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleViewPatient(payment)}
                      >
                        {payment.patient?.users?.name || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-purple-600">
                        {payment.appointment?.service_type || payment.description || 'Payment'} • ₱{payment.amount.toLocaleString()}
                      </p>
                      <p 
                        className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800 transition-colors"
                        onClick={() => handleViewDoctor(payment)}
                      >
                        {payment.appointment?.doctor?.users?.name || 'Unknown Doctor'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'No date'} • {payment.status}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.status)}
                    {getStatusBadge(payment.status)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      onClick={() => handleViewPatient(payment)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Patient
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => handleProcessPayment(payment.id)}
                      disabled={loading || payment.status === 'paid'}
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payments found matching your search.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Information Modal */}
      <PatientInfoModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        patient={selectedPatient}
      />

      {/* Doctor Information Modal */}
      <DoctorInfoModal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        doctor={selectedDoctor}
      />
    </div>
  );
};

export default PaymentManagement;