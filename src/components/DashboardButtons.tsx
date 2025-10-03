import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  User, 
  FileText, 
  Heart, 
  CreditCard,
  Video,
  MessageSquare,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

import { AddHealthMetricModal } from './AddHealthMetricModal';
import { RescheduleAppointmentModal } from './RescheduleAppointmentModal';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { RetryPaymentModal } from './RetryPaymentModal';
import { AppointmentService, HealthMetricsService, PaymentService, PatientService } from '@/services/databaseService';

interface ButtonHandlerProps {
  patientId: string;
  onDataRefresh: () => void;
}

// Book Appointment Button
export const BookAppointmentButton: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  
  return (
    <Button onClick={() => navigate('/book-appointment')} className={className}>
      <Plus className="h-4 w-4 mr-2" />
      Book Appointment
    </Button>
  );
};

// Profile Button
export const ViewProfileButton: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  
  return (
    <Button variant="outline" onClick={() => navigate('/profile')} className={className}>
      <User className="h-4 w-4 mr-2" />
      View Profile
    </Button>
  );
};

// Health Metric Add Button
export const AddHealthMetricButton: React.FC<ButtonHandlerProps> = ({ patientId, onDataRefresh }) => {
  const { toast } = useToast();

  const handleMetricAdded = () => {
    onDataRefresh();
    toast({
      title: "Health Metric Added",
      description: "Your health metric has been recorded successfully.",
    });
  };

  return (
    <AddHealthMetricModal patientId={patientId} onMetricAdded={handleMetricAdded}>
      <Button>
        <Heart className="h-4 w-4 mr-2" />
        Add Metric
      </Button>
    </AddHealthMetricModal>
  );
};

// View Health History Button
export const ViewHealthHistoryButton: React.FC<{ patientId: string }> = ({ patientId }) => {
  const navigate = useNavigate();
  
  return (
    <Button variant="outline" onClick={() => navigate(`/health-metrics-history?patientId=${patientId}`)}>
      <Eye className="h-4 w-4 mr-2" />
      View History
    </Button>
  );
};

// Appointment Action Buttons
interface AppointmentButtonsProps {
  appointment: any;
  onDataRefresh: () => void;
}

export const AppointmentActionButtons: React.FC<AppointmentButtonsProps> = ({ appointment, onDataRefresh }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleJoinCall = async () => {
    try {
      const appointmentWithCall = await AppointmentService.getAppointmentWithVideoCall(appointment.id);
      
      if (appointmentWithCall?.video_calls?.[0]) {
        // Join existing call only
        await AppointmentService.startVideoCall(appointment.id);
        window.open(appointmentWithCall.video_calls[0].call_link, '_blank');
      } else {
        // Do not create calls from patient UI
        const navigateToJoin = confirm('No active call yet. Do you have a Meeting ID to join?');
        if (navigateToJoin) {
          navigate('/join-call');
        }
      }
    } catch (error) {
      console.error('Error joining call:', error);
      toast({
        title: "Error",
        description: "Failed to join video call. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMessage = () => {
    navigate(`/send-message?doctorId=${appointment.doctor.id || appointment.doctor_id}&appointmentId=${appointment.id}`);
  };

  const handleRescheduled = () => {
    onDataRefresh();
    toast({
      title: "Appointment Rescheduled",
      description: "Your appointment has been rescheduled successfully.",
    });
  };

  const handleCancelled = () => {
    onDataRefresh();
    toast({
      title: "Appointment Cancelled",
      description: "Your appointment has been cancelled.",
    });
  };

  return (
    <div className="flex gap-2">
      {appointment.consultation_type === 'video-call' && (
        <Button size="sm" onClick={handleJoinCall}>
          <Video className="h-4 w-4 mr-2" />
          Join Call
        </Button>
      )}
      
      <Button size="sm" variant="outline" onClick={handleMessage}>
        <MessageSquare className="h-4 w-4 mr-2" />
        Message
      </Button>

      <RescheduleAppointmentModal
        appointmentId={appointment.id}
        currentDate={appointment.appointment_date || appointment.date}
        currentTime={appointment.appointment_time || appointment.time}
        doctorName={appointment.doctor?.name || appointment.doctor?.users?.name || 'Unknown Doctor'}
        onRescheduled={handleRescheduled}
      >
        <Button size="sm" variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Reschedule
        </Button>
      </RescheduleAppointmentModal>

      <CancelAppointmentModal
        appointmentId={appointment.id}
        appointmentDate={appointment.appointment_date || appointment.date}
        appointmentTime={appointment.appointment_time || appointment.time}
        doctorName={appointment.doctor?.name || appointment.doctor?.users?.name || 'Unknown Doctor'}
        onCancelled={handleCancelled}
      >
        <Button size="sm" variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </CancelAppointmentModal>
    </div>
  );
};

// Medical Records Buttons
export const ViewMedicalRecordButton: React.FC<{ 
  recordId: string;
  onViewRecord?: (recordId: string) => void;
}> = ({ recordId, onViewRecord }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onViewRecord) {
      onViewRecord(recordId);
    } else {
      navigate(`/medical-record/${recordId}`);
    }
  };
  
  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      <Eye className="h-4 w-4 mr-2" />
      View Details
    </Button>
  );
};

export const DownloadRecordButton: React.FC<{ recordId: string }> = ({ recordId }) => {
  const { toast } = useToast();
  
  const handleDownload = async () => {
    try {
      // Implement PDF generation and download
      toast({
        title: "Download Started",
        description: "Your medical record is being prepared for download.",
      });
      
      // TODO: Implement actual PDF generation and download
      console.log('Downloading record:', recordId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download record. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button size="sm" variant="outline" onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />
      Download PDF
    </Button>
  );
};

// Payment Buttons
interface PaymentButtonsProps {
  payment: any;
  onDataRefresh: () => void;
  onViewPayment?: (paymentId: string) => void;
}

export const PaymentActionButtons: React.FC<PaymentButtonsProps> = ({ payment, onDataRefresh, onViewPayment }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePaymentSuccess = () => {
    onDataRefresh();
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed successfully.",
    });
  };

  const handleViewDetails = () => {
    if (onViewPayment) {
      onViewPayment(payment.id);
    } else {
      navigate(`/payment-details/${payment.id}`);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      toast({
        title: "Download Started",
        description: "Your receipt is being prepared for download.",
      });
      
      // Create a detailed receipt
      const receiptData = `
PAYMENT RECEIPT
===============

Receipt ID: ${payment.id}
Date: ${new Date(payment.created_at).toLocaleDateString()}
Status: ${payment.status.toUpperCase()}

PAYMENT INFORMATION:
Amount: ₱${payment.amount?.toLocaleString() || '0'}
Payment Method: ${payment.payment_method || 'N/A'}
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
      
      toast({
        title: "Receipt Downloaded",
        description: "Your payment receipt has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleViewDetails}>
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </Button>

      {payment.status === 'paid' && (
        <Button size="sm" variant="outline" onClick={handleDownloadReceipt}>
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
      )}

      {payment.status === 'failed' && (
        <RetryPaymentModal
          paymentId={payment.id}
          amount={payment.amount}
          description={payment.description || payment.payment_type}
          appointmentId={payment.appointment_id}
          onPaymentSuccess={handlePaymentSuccess}
        >
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Payment
          </Button>
        </RetryPaymentModal>
      )}
    </div>
  );
};

// Lab Test Buttons
export const ViewLabTestButton: React.FC<{ 
  testId: string;
  onViewTest?: (testId: string) => void;
}> = ({ testId, onViewTest }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onViewTest) {
      onViewTest(testId);
    } else {
      navigate(`/lab-test/${testId}`);
    }
  };
  
  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      <Eye className="h-4 w-4 mr-2" />
      View Results
    </Button>
  );
};

// Prescription Buttons
export const ViewPrescriptionButton: React.FC<{ 
  prescriptionId: string;
  onViewPrescription?: (prescriptionId: string) => void;
}> = ({ prescriptionId, onViewPrescription }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onViewPrescription) {
      onViewPrescription(prescriptionId);
    } else {
      navigate(`/prescription/${prescriptionId}`);
    }
  };
  
  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      <Eye className="h-4 w-4 mr-2" />
      View Details
    </Button>
  );
};

// Refresh Data Button
export const RefreshDataButton: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  return (
    <Button size="sm" variant="outline" onClick={onRefresh}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  );
};