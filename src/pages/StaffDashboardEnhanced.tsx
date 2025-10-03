import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  MessageSquare, 
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  RefreshCw,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  DollarSign,
  Receipt,
  CreditCard,
  RefreshCcw,
  Bell,
  Save,
  Trash2,
  Settings,
  UserCheck,
  Stethoscope,
  Wrench,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AppointmentService } from '@/services/databaseService';
import StaffManagementService, { 
  type StaffAppointment, 
  type StaffMedicalRecord, 
  type StaffPayment 
} from '@/services/staffDatabaseService';

type TabType = 'overview' | 'appointments' | 'records' | 'payments' | 'management';



const StaffDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<StaffMedicalRecord[]>([]);
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  // Dialog states
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteRecordDialog, setShowDeleteRecordDialog] = useState(false);
  const [showEditRecordDialog, setShowEditRecordDialog] = useState(false);
  const [showProcessPaymentDialog, setShowProcessPaymentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showPrintRecordDialog, setShowPrintRecordDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<string>("");
  
  // Selected items
  const [selectedAppointment, setSelectedAppointment] = useState<StaffAppointment | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<StaffMedicalRecord | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<StaffPayment | null>(null);
  
  // Form states
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  // Appointment handlers
  const handleSendMessage = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setMessageSubject(`Regarding your appointment on ${appointment.appointment_date}`);
    setMessageBody("");
    setShowMessageDialog(true);
  };

  const handleReschedule = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setDialogAction("reschedule");
    setShowRescheduleDialog(true);
  };

  const handleCancel = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;

    // Get cancellation reason from user
    const reason = prompt("Please provide a reason for cancelling this appointment:");
    if (!reason || reason.trim() === '') {
      toast({
        title: 'Cancellation Required',
        description: 'A reason is required to cancel the appointment.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Use AppointmentService.cancel for proper handling
      const result = await AppointmentService.cancel(selectedAppointment.id, reason);
      
      if (result.success) {
        // Update local state
        const updatedAppointments = appointments.map(apt =>
          apt.id === selectedAppointment.id ? { ...apt, status: 'cancelled' as const } : apt
        );
        setAppointments(updatedAppointments);
        
        toast({
          title: 'Appointment Cancelled',
          description: `Appointment for ${selectedAppointment.patient?.users?.name || 'patient'} has been cancelled.`,
        });

        // Send notification to patient
        if (selectedAppointment.patient_id) {
          await StaffManagementService.sendNotification(
            selectedAppointment.patient_id,
            'Appointment Cancelled',
            `Your appointment on ${new Date(selectedAppointment.appointment_date).toLocaleDateString()} has been cancelled. Reason: ${reason}`,
            'appointment',
            'high'
          );
        }
      } else {
        throw new Error(result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: 'Cancellation Failed',
        description: error instanceof Error ? error.message : 'Failed to cancel appointment. Please try again.',
        variant: 'destructive'
      });
    }
    
    setShowCancelDialog(false);
    setSelectedAppointment(null);
  };

  const handleMarkComplete = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setDialogAction("complete");
    setShowCompleteDialog(true);
  };

  const handleSendReminder = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setDialogAction("reminder");
    setShowReminderDialog(true);
  };

  const handleViewAppointment = (appointment: StaffAppointment) => {
    setSelectedAppointment(appointment);
    setDialogAction("view");
    setShowViewDialog(true);
  };

  const handleCreateAppointment = () => {
    setShowCreateDialog(true);
  };

  // Records handlers
  const handleViewRecord = (record: StaffMedicalRecord) => {
    navigate('/update-record', { state: { record } });
  };

  const handleEditRecord = (record: StaffMedicalRecord) => {
    setSelectedRecord(record);
    setShowEditRecordDialog(true);
  };

  const handleDownloadRecord = (record: StaffMedicalRecord) => {
    setSelectedRecord(record);
    setShowDownloadDialog(true);
  };

  const handlePrintRecord = (record: StaffMedicalRecord) => {
    setSelectedRecord(record);
    setShowPrintRecordDialog(true);
  };

  const handleDeleteRecord = (record: StaffMedicalRecord) => {
    setSelectedRecord(record);
    setShowDeleteRecordDialog(true);
  };

  // Payment handlers
  const handleProcessPayment = (payment: StaffPayment) => {
    setSelectedPayment(payment);
    setShowProcessPaymentDialog(true);
  };

  const handleRefundPayment = (payment: StaffPayment) => {
    setSelectedPayment(payment);
    setShowRefundDialog(true);
  };

  const handleSendInvoice = (payment: StaffPayment) => {
    setSelectedPayment(payment);
    setShowInvoiceDialog(true);
  };

  const handleViewPayment = (payment: StaffPayment) => {
    setSelectedPayment(payment);
    setShowViewPaymentDialog(true);
  };

  // Lab test handlers
  const handleCompleteLabTest = (testType: string) => {
    toast({
      title: "Lab Test Completed",
      description: `${testType} test has been marked as completed.`,
    });
  };

  const confirmSendMessage = () => {
    if (!selectedAppointment || !messageSubject.trim() || !messageBody.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Message Sent",
      description: `Message sent successfully to ${selectedAppointment.patient?.users?.name || 'patient'}`,
    });
    setShowMessageDialog(false);
    setMessageSubject("");
    setMessageBody("");
    setSelectedAppointment(null);
  };

  const confirmComplete = async () => {
    if (!selectedAppointment) return;
    
    const success = await StaffManagementService.updateAppointmentStatus(
      selectedAppointment.id,
      'completed',
      'Marked complete from staff dashboard'
    );

    if (success) {
      const updatedAppointments = appointments.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, status: 'completed' as const } : apt
      );
      setAppointments(updatedAppointments);
      
      toast({
        title: "Appointment Completed",
        description: `Appointment for ${selectedAppointment.patient?.users?.name || 'patient'} marked as completed.`,
      });

      // Send notification to patient
      if (selectedAppointment.patient_id) {
        await StaffManagementService.sendNotification(
          selectedAppointment.patient_id,
          'Appointment Completed',
          `Your appointment on ${new Date(selectedAppointment.appointment_date).toLocaleDateString()} has been completed.`,
          'appointment',
          'medium'
        );
      }
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to mark appointment as completed. Please try again.",
        variant: "destructive"
      });
    }
    
    setShowCompleteDialog(false);
    setSelectedAppointment(null);
  };

  const confirmReminder = () => {
    if (!selectedAppointment) return;
    
    toast({
      title: "Reminder Sent",
      description: `Appointment reminder sent to ${selectedAppointment.patient?.users?.name || 'patient'}.`,
    });
    setShowReminderDialog(false);
    setSelectedAppointment(null);
  };

  const confirmReschedule = async () => {
    if (!selectedAppointment) return;
    
    // For now, just navigate to the manage appointment page where they can reschedule
    // TODO: Implement inline reschedule with date/time picker
    setShowRescheduleDialog(false);
    setSelectedAppointment(null);
    navigate('/manage-appointment', { state: { appointment: selectedAppointment } });
  };

  const confirmRefresh = async () => {
    setLoading(true);
    try {
      const [appointmentsData, recordsData, paymentsData, statsData] = await Promise.all([
        StaffManagementService.getAllAppointments(),
        StaffManagementService.getAllMedicalRecords(),
        StaffManagementService.getAllPayments(),
        StaffManagementService.getDashboardStats()
      ]);

      setAppointments(appointmentsData);
      setMedicalRecords(recordsData);
      setPayments(paymentsData);
      setDashboardStats(statsData);

      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated successfully.",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
    setShowRefreshDialog(false);
  };

  const confirmExport = () => {
    toast({
      title: "Export Started",
      description: "Your data export has been initiated. You'll receive a download link soon.",
    });
    setShowExportDialog(false);
    // Add actual export logic here
  };

  const confirmPrint = () => {
    toast({
      title: "Print Job Started",
      description: "Your report is being prepared for printing.",
    });
    setShowPrintDialog(false);
    // Add actual print logic here
    window.print();
  };

  const confirmCreate = () => {
    setShowCreateDialog(false);
    navigate('/manage-appointment');
  };

  const confirmEditRecord = () => {
    if (!selectedRecord) return;
    
    setShowEditRecordDialog(false);
    navigate('/update-record', { state: { record: selectedRecord } });
    setSelectedRecord(null);
  };

  const confirmDeleteRecord = async () => {
    if (!selectedRecord) return;
    
    const success = await StaffManagementService.deleteMedicalRecord(selectedRecord.id);

    if (success) {
      const updatedRecords = medicalRecords.filter(r => r.id !== selectedRecord.id);
      setMedicalRecords(updatedRecords);
      
      toast({
        title: "Record Deleted",
        description: `Medical record for ${selectedRecord.patient?.users?.name || 'patient'} has been deleted.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete medical record. Please try again.",
        variant: "destructive"
      });
    }
    
    setShowDeleteRecordDialog(false);
    setSelectedRecord(null);
  };

  const confirmProcessPayment = () => {
    if (!selectedPayment) return;
    
    setShowProcessPaymentDialog(false);
    navigate('/process-payment', { state: { payment: selectedPayment } });
    setSelectedPayment(null);
  };

  const confirmRefund = async () => {
    if (!selectedPayment) return;
    
    const success = await StaffManagementService.updatePaymentStatus(
      selectedPayment.id,
      'refunded',
      `REFUND_${Date.now()}`,
      'refund'
    );

    if (success) {
      const updatedPayments = payments.map(p => 
        p.id === selectedPayment.id ? { ...p, status: 'refunded' as const } : p
      );
      setPayments(updatedPayments);
      
      toast({
        title: "Payment Refunded",
        description: `Refund of ₱${selectedPayment.amount} for ${selectedPayment.patient?.users?.name || 'patient'} has been processed.`,
      });

      // Send notification to patient
      if (selectedPayment.patient_id) {
        await StaffManagementService.sendNotification(
          selectedPayment.patient_id,
          'Payment Refunded',
          `Your payment of ₱${selectedPayment.amount} has been refunded successfully.`,
          'payment',
          'medium'
        );
      }
    } else {
      toast({
        title: "Refund Failed",
        description: "Failed to process refund. Please try again.",
        variant: "destructive"
      });
    }
    
    setShowRefundDialog(false);
    setSelectedPayment(null);
  };

  const confirmDownload = () => {
    if (!selectedRecord) return;
    
    toast({
      title: "Download Started",
      description: `Medical record for ${selectedRecord.patient?.users?.name || 'patient'} is being downloaded.`,
    });
    setShowDownloadDialog(false);
    setSelectedRecord(null);
    // Add actual download logic here
  };

  const confirmPrintRecord = () => {
    if (!selectedRecord) return;
    
    toast({
      title: "Print Started",
      description: `Printing medical record for ${selectedRecord.patient?.users?.name || 'patient'}.`,
    });
    setShowPrintRecordDialog(false);
    setSelectedRecord(null);
    // Add actual print logic here
    window.print();
  };

  const confirmSendInvoice = () => {
    if (!selectedPayment) return;
    
    toast({
      title: "Invoice Sent",
      description: `Invoice for $${selectedPayment.amount} sent to ${selectedPayment.patient?.users?.name || 'patient'}.`,
    });
    setShowInvoiceDialog(false);
    setSelectedPayment(null);
  };

  const confirmViewPayment = () => {
    if (!selectedPayment) return;
    
    setShowViewPaymentDialog(false);
    navigate('/process-payment', { state: { payment: selectedPayment } });
    setSelectedPayment(null);
  };

  const refreshData = () => {
    setShowRefreshDialog(true);
  };

  const exportData = () => {
    setShowExportDialog(true);
  };

  const printReport = () => {
    setShowPrintDialog(true);
  };

  const getStatusColor = (status: StaffAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: StaffAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Load data from database
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [appointmentsData, recordsData, paymentsData, statsData] = await Promise.all([
          StaffManagementService.getAllAppointments(),
          StaffManagementService.getAllMedicalRecords(),
          StaffManagementService.getAllPayments(),
          StaffManagementService.getDashboardStats()
        ]);

        setAppointments(appointmentsData);
        setMedicalRecords(recordsData);
        setPayments(paymentsData);
        setDashboardStats(statsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Data Loading Failed",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // Get dashboard statistics
  const stats = dashboardStats || {
    totalAppointments: appointments.length,
    confirmedAppointments: appointments.filter(apt => apt.status === 'confirmed').length,
    pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
    completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Practitioner Dashboard
            </h1>
            <p className="text-gray-600">Manage appointments, records, and payments</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCreateAppointment}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>


          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Loading dashboard data...</span>
          </div>
        ) : (
          <>
            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Appointments</span>
                </TabsTrigger>
                <TabsTrigger value="records" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Records</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Payments</span>
                </TabsTrigger>
                <TabsTrigger value="management" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Management</span>
                </TabsTrigger>
              </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Appointments */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Calendar className="h-5 w-5" />
                    <span>Recent Appointments</span>
                  </CardTitle>
                  <p className="text-blue-100 text-sm">Your latest appointments and consultations</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appointments.slice(0, 2).map((appointment) => (
                    <div key={appointment.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                          {appointment.patient?.users?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white">{appointment.patient?.users?.name || 'Unknown Patient'}</h3>
                            <Badge 
                              variant="secondary"
                              className={`${
                                appointment.status === 'pending' 
                                  ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30' 
                                  : 'bg-green-500/20 text-green-200 border-green-400/30'
                              }`}
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-blue-100 text-sm">{appointment.service_type} • {appointment.doctor?.users?.name || 'Dr. Unknown'}</p>
                          <p className="text-white/80 text-xs mt-1">{appointment.notes}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-blue-100">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{appointment.appointment_time}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>{appointment.duration_minutes || 30} mins</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>₱{appointment.fee || 0}</span>
                            </span>
                          </div>
                          <div className="text-xs text-blue-100 mt-1">
                            📍 {appointment.consultation_type || 'In Person'} • {appointment.doctor?.specialty || 'General'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons (standard outline styling) */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendMessage(appointment)}
                          className="text-white border-white/40 hover:bg-white/10"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message Doctor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReschedule(appointment)}
                          className="text-white border-white/40 hover:bg-white/10"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Reschedule
                        </Button>
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(appointment)}
                            className="text-red-100 border-red-300 hover:bg-red-500/20"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAppointment(appointment)}
                          className="text-white border-white/40 hover:bg-white/10"
                        >
                          View Details →
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-white/20">
                    <Button 
                      variant="secondary"
                      onClick={() => setActiveTab('appointments')}
                      className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30"
                    >
                      View All Appointments
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Records */}
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <FileText className="h-5 w-5" />
                    <span>Recent Records</span>
                  </CardTitle>
                  <p className="text-green-100 text-sm">Your latest medical records and test results</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medicalRecords.slice(0, 3).map((record, index) => (
                    <div key={record.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white">{record.diagnosis || 'Medical Record'}</h3>
                            <Button 
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewRecord(record)}
                              className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs"
                            >
                              Record
                            </Button>
                          </div>
                          <p className="text-green-100 text-sm">{record.doctor?.users?.name || 'Dr. Unknown'} • {new Date(record.created_at).toLocaleDateString()}</p>
                          <p className="text-white/80 text-xs mt-1">{record.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Lab Test Results */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">Complete Blood Count (CBC)</h3>
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteLabTest('CBC')}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                          >
                            Complete
                          </Button>
                        </div>
                        <p className="text-green-100 text-sm">Dr. Dr. Robert Tan • 9/30/2025</p>
                        <p className="text-white/80 text-xs mt-1">
                          WBC: 7.2 K/μL (Normal), RBC: 4.8 M/μL (Normal), Hgb: 14.5 g/dL (Normal), Hct: 43.2% (Normal), Platelets: 285 K/μL (Normal)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">Lipid Profile</h3>
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteLabTest('Lipid')}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                          >
                            Complete
                          </Button>
                        </div>
                        <p className="text-green-100 text-sm">Dr. Dr. Robert Tan • 9/30/2025</p>
                        <p className="text-white/80 text-xs mt-1">
                          Total Cholesterol: 195 mg/dL (Borderline High), LDL: 125 mg/dL (Borderline High), HDL: 45 mg/dL (Low), Triglycerides: 150 mg/dL (Normal)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/20">
                    <Button 
                      variant="secondary"
                      onClick={() => setActiveTab('records')}
                      className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30"
                    >
                      View All Records
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>All Appointments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-semibold text-gray-900">{appointment.patient?.users?.name || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-600">
                              {appointment.service_type} • {appointment.appointment_time} • {new Date(appointment.appointment_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-blue-600">
                              Dr. {appointment.doctor?.users?.name || 'Unknown'} • {appointment.doctor?.specialty || 'General'}
                            </p>
                            {appointment.notes && (
                              <p className="text-xs text-gray-500 mt-1">{appointment.notes}</p>
                            )}
                            {appointment.fee && (
                              <p className="text-xs text-green-600 font-medium">₱{appointment.fee}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={`${getStatusColor(appointment.status)} flex items-center space-x-1`}
                        >
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status}</span>
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewAppointment(appointment)}
                            className="hover:bg-gray-50 hover:border-gray-300 border-gray-200 text-gray-600 font-medium"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendMessage(appointment)}
                            className="hover:bg-blue-50 hover:border-blue-300 border-blue-200 text-blue-600 font-medium"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message Doctor
                          </Button>

                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendReminder(appointment)}
                            className="hover:bg-orange-50 hover:border-orange-300 border-orange-200 text-orange-600 font-medium"
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            Send Reminder
                          </Button>
                          
                          {appointment.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkComplete(appointment)}
                              className="hover:bg-green-50 hover:border-green-300 border-green-200 text-green-600 font-medium"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Complete
                            </Button>
                          )}

                          {appointment.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReschedule(appointment)}
                              className="hover:bg-yellow-50 hover:border-yellow-300 border-yellow-200 text-yellow-600 font-medium"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Reschedule
                            </Button>
                          )}
                          
                          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCancel(appointment)}
                              className="hover:bg-red-50 hover:border-red-300 border-red-200 text-red-600 font-medium"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Medical Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalRecords.map((record) => (
                    <div 
                      key={record.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-semibold text-gray-900">{record.patient?.users?.name || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-600">
                              {record.diagnosis || 'Medical Record'} • {record.doctor?.users?.name || 'Dr. Unknown'}
                            </p>
                            <p className="text-xs text-blue-600">{record.doctor?.specialty || 'General'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(record.created_at).toLocaleDateString()} • 
                              {record.prescriptions?.length || 0} prescriptions • 
                              {record.lab_tests?.length || 0} lab tests
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewRecord(record)}
                          className="hover:bg-blue-50 hover:border-blue-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditRecord(record)}
                          className="hover:bg-yellow-50 hover:border-yellow-200"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadRecord(record)}
                          className="hover:bg-green-50 hover:border-green-200"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePrintRecord(record)}
                          className="hover:bg-purple-50 hover:border-purple-200"
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteRecord(record)}
                          className="hover:bg-red-50 hover:border-red-200 text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>Payment Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-semibold text-gray-900">{payment.patient?.users?.name || 'Unknown Patient'}</p>
                            <p className="text-sm text-gray-600">
                              {payment.description || payment.appointment?.service_type || 'Payment'} • ₱{payment.amount}
                            </p>
                            <p className="text-xs text-blue-600">
                              {payment.appointment?.doctor?.users?.name || 'Service Payment'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {payment.payment_method?.replace('_', ' ') || 'Unknown method'} • 
                              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'Not paid'} •
                              {payment.transaction_ref || 'No ref'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={`flex items-center space-x-1 ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          <span className="capitalize">{payment.status}</span>
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewPayment(payment)}
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {payment.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleProcessPayment(payment)}
                              className="hover:bg-green-50 hover:border-green-200 text-green-600"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Process
                            </Button>
                          )}

                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendInvoice(payment)}
                            className="hover:bg-purple-50 hover:border-purple-200"
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>

                          {payment.status === 'paid' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRefundPayment(payment)}
                              className="hover:bg-orange-50 hover:border-orange-200 text-orange-600"
                            >
                              <RefreshCcw className="h-4 w-4 mr-1" />
                              Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Management Tab - New comprehensive management interface */}
          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Staff Management Card */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-blue-600">
                    <UserCheck className="h-5 w-5" />
                    <span>Staff Management</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">Manage staff members, roles, and permissions</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-800">Total Staff</div>
                      <div className="text-2xl font-bold text-blue-600">{dashboardStats?.totalStaff || 0}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold text-green-800">Active</div>
                      <div className="text-2xl font-bold text-green-600">{dashboardStats?.activeStaff || 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate('/signup', { state: { role: 'staff' } })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff Member
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Staff Management",
                          description: "Staff management interface will open here.",
                        });
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View All Staff
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Management Card */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-green-600">
                    <Stethoscope className="h-5 w-5" />
                    <span>Doctor Management</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">Manage doctors, schedules, and specialties</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold text-green-800">Total Doctors</div>
                      <div className="text-2xl font-bold text-green-600">{dashboardStats?.totalDoctors || 0}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-800">Available Today</div>
                      <div className="text-2xl font-bold text-blue-600">{dashboardStats?.availableDoctors || 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => navigate('/signup', { state: { role: 'doctor' } })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Doctor
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/doctor-dashboard')}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Doctor Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Services & Equipment Card */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-purple-600">
                    <Wrench className="h-5 w-5" />
                    <span>Services & Equipment</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">Manage services offered and equipment inventory</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-semibold text-purple-800">Active Services</div>
                      <div className="text-2xl font-bold text-purple-600">{dashboardStats?.activeServices || 0}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="font-semibold text-orange-800">Equipment</div>
                      <div className="text-2xl font-bold text-orange-600">{dashboardStats?.totalEquipment || 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => navigate('/services')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Manage Services
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Equipment Management",
                          description: "Equipment inventory interface will open here.",
                        });
                      }}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Equipment Status
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Management Card */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-indigo-600">
                    <Users className="h-5 w-5" />
                    <span>Patient Management</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">Manage patient records and information</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="font-semibold text-indigo-800">Total Patients</div>
                      <div className="text-2xl font-bold text-indigo-600">{dashboardStats?.totalPatients || 0}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="font-semibold text-yellow-800">New This Month</div>
                      <div className="text-2xl font-bold text-yellow-600">{dashboardStats?.newPatientsThisMonth || 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => navigate('/signup', { state: { role: 'patient' } })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Register Patient
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Patient Search",
                          description: "Patient search interface will open here.",
                        });
                      }}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Find Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Task Management Card */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-orange-600">
                    <ClipboardList className="h-5 w-5" />
                    <span>Task Management</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">Assign and track tasks for staff members</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="font-semibold text-orange-800">Pending Tasks</div>
                      <div className="text-2xl font-bold text-orange-600">{dashboardStats?.pendingTasks || 0}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold text-green-800">Completed</div>
                      <div className="text-2xl font-bold text-green-600">{dashboardStats?.completedTasks || 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      size="sm" 
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        toast({
                          title: "Task Creation",
                          description: "Task creation interface will open here.",
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Task Management",
                          description: "Task management interface will open here.",
                        });
                      }}
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      View All Tasks
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Administration Card */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <Settings className="h-5 w-5" />
                    <span>System Admin</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">System settings, backups, and reports</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-semibold text-gray-800">System Status</div>
                      <div className="text-sm font-medium text-green-600">All Systems Operational</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      System Settings
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
        </>
        )}

        {/* Message Dialog */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedAppointment?.patient?.users?.name || 'patient'}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message-to" className="text-right">
                  To
                </Label>
                <Input 
                  id="message-to" 
                  value={selectedAppointment?.patient?.users?.name || ""} 
                  className="col-span-3" 
                  disabled 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message-subject" className="text-right">
                  Subject
                </Label>
                <Input 
                  id="message-subject" 
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="col-span-3" 
                  placeholder="Enter subject"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message-body" className="text-right">
                  Message
                </Label>
                <Textarea 
                  id="message-body" 
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="col-span-3" 
                  placeholder="Type your message here..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={confirmSendMessage}>Send Message</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record View Dialog */}
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Medical Record Details</DialogTitle>
              <DialogDescription>
                Medical record for {selectedRecord?.patient?.users?.name || 'patient'}
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Patient</Label>
                  <div className="col-span-3">{selectedRecord.patient?.users?.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Doctor</Label>
                  <div className="col-span-3">{selectedRecord.doctor?.users?.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Date</Label>
                  <div className="col-span-3">{new Date(selectedRecord.created_at).toLocaleDateString()}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Diagnosis</Label>
                  <div className="col-span-3">{selectedRecord.diagnosis}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Notes</Label>
                  <div className="col-span-3">{selectedRecord.notes}</div>
                </div>
                {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right font-semibold">Prescriptions</Label>
                    <div className="col-span-3">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedRecord.prescriptions.map((prescription, index) => (
                          <li key={index} className="text-sm">{prescription.medication_name} - {prescription.dosage}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {selectedRecord.lab_tests && selectedRecord.lab_tests.length > 0 && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right font-semibold">Lab Tests</Label>
                    <div className="col-span-3">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedRecord.lab_tests.map((test, index) => (
                          <li key={index} className="text-sm">{test.test_type}: {test.result || 'Pending'}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRecordDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment View Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Payment information for {selectedPayment?.patient?.users?.name || 'patient'}
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Patient</Label>
                  <div className="col-span-3">{selectedPayment.patient?.users?.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Amount</Label>
                  <div className="col-span-3 font-bold text-green-600">${selectedPayment.amount}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Status</Label>
                  <div className="col-span-3">
                    <Badge className={`${
                      selectedPayment.status === 'paid' ? 'bg-green-100 text-green-800' :
                      selectedPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPayment.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Method</Label>
                  <div className="col-span-3 capitalize">{selectedPayment.payment_method.replace('_', ' ')}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-semibold">Description</Label>
                  <div className="col-span-3">{selectedPayment.description}</div>
                </div>
                {selectedPayment.payment_date && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">Paid Date</Label>
                    <div className="col-span-3">{new Date(selectedPayment.payment_date).toLocaleDateString()}</div>
                  </div>
                )}
                {selectedPayment.transaction_ref && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">Transaction Ref</Label>
                    <div className="col-span-3 font-mono text-sm">{selectedPayment.transaction_ref}</div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this appointment for {selectedAppointment?.patient?.users?.name || 'this patient'}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Patient:</span>
                    <span>{selectedAppointment.patient?.users?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Service:</span>
                    <span>{selectedAppointment.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date & Time:</span>
                    <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Appointment
              </Button>
              <Button variant="destructive" onClick={confirmCancel}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Appointment Details Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                Complete information for this appointment.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Patient Name</Label>
                    <div className="mt-1">{selectedAppointment.patient?.users?.name}</div>
                  </div>
                  <div>
                    <Label className="font-semibold">Service</Label>
                    <div className="mt-1">{selectedAppointment.service_type}</div>
                  </div>
                  <div>
                    <Label className="font-semibold">Date</Label>
                    <div className="mt-1">{selectedAppointment.appointment_date}</div>
                  </div>
                  <div>
                    <Label className="font-semibold">Time</Label>
                    <div className="mt-1">{selectedAppointment.appointment_time}</div>
                  </div>
                  <div>
                    <Label className="font-semibold">Status</Label>
                    <div className="mt-1">
                      <Badge className={`${
                        selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        selectedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedAppointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedAppointment.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Fee</Label>
                    <div className="mt-1">${selectedAppointment.fee || 'N/A'}</div>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <Label className="font-semibold">Notes</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded">{selectedAppointment.notes}</div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Confirmation Dialog */}
        <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
              <DialogDescription>
                Proceed to reschedule this appointment for {selectedAppointment?.patient?.users?.name || 'this patient'}?
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4">
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Current Date:</span>
                    <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Current Time:</span>
                    <span>{selectedAppointment.appointment_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Service:</span>
                    <span>{selectedAppointment.service_type}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmReschedule}>
                <Calendar className="h-4 w-4 mr-2" />
                Continue to Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Appointment Confirmation Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Completed</DialogTitle>
              <DialogDescription>
                Mark this appointment as completed for {selectedAppointment?.patient?.users?.name || 'this patient'}?
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4">
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Patient:</span>
                    <span>{selectedAppointment.patient?.users?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Service:</span>
                    <span>{selectedAppointment.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date & Time:</span>
                    <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Completed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Reminder Confirmation Dialog */}
        <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Reminder</DialogTitle>
              <DialogDescription>
                Send appointment reminder to {selectedAppointment?.patient?.users?.name || 'this patient'}?
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="py-4">
                <div className="p-4 bg-orange-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Patient:</span>
                    <span>{selectedAppointment.patient?.users?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Appointment:</span>
                    <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Service:</span>
                    <span>{selectedAppointment.service_type}</span>
                  </div>
                  {selectedAppointment.patient?.users?.phone && (
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{selectedAppointment.patient?.users?.phone}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Reminder will be sent via SMS and email (if available).
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmReminder}>
                <Bell className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refresh Data Confirmation Dialog */}
        <Dialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refresh Data</DialogTitle>
              <DialogDescription>
                This will refresh all dashboard data and may take a few moments.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Data Refresh</span>
                </div>
                <p className="text-sm text-gray-600">
                  This will reload:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Appointment schedules</li>
                  <li>• Medical records</li>
                  <li>• Payment information</li>
                  <li>• Dashboard statistics</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRefreshDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Data Confirmation Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Data</DialogTitle>
              <DialogDescription>
                Export all dashboard data to a downloadable file.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-green-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Data Export</span>
                </div>
                <p className="text-sm text-gray-600">
                  Export will include:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• All appointment data</li>
                  <li>• Medical records summary</li>
                  <li>• Payment transactions</li>
                  <li>• Patient information</li>
                </ul>
                <div className="text-xs text-gray-500 mt-2">
                  File format: Excel (.xlsx) • Estimated size: 2-5 MB
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmExport}>
                <Download className="h-4 w-4 mr-2" />
                Start Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Print Report Confirmation Dialog */}
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Print Report</DialogTitle>
              <DialogDescription>
                Generate a printable report of current dashboard data.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Printer className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Print Report</span>
                </div>
                <p className="text-sm text-gray-600">
                  Report will include:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Today's appointments</li>
                  <li>• Recent medical records</li>
                  <li>• Payment summaries</li>
                  <li>• System statistics</li>
                </ul>
                <div className="text-xs text-gray-500 mt-2">
                  Format: PDF • Pages: 3-5 • Make sure your printer is ready
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Appointment Confirmation Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Appointment</DialogTitle>
              <DialogDescription>
                Navigate to the appointment creation form to schedule a new patient appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-indigo-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium">New Appointment</span>
                </div>
                <p className="text-sm text-gray-600">
                  You will be able to:
                </p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Select patient information</li>
                  <li>• Choose available time slots</li>
                  <li>• Set appointment services</li>
                  <li>• Configure consultation type</li>
                </ul>
                <div className="text-xs text-gray-500 mt-2">
                  This will take you to the appointment management page
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Continue to Form
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Record Confirmation Dialog */}
        <Dialog open={showEditRecordDialog} onOpenChange={setShowEditRecordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Medical Record</DialogTitle>
              <DialogDescription>
                Navigate to the record editor to modify this medical record.
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="py-4">
                <div className="p-4 bg-indigo-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Edit className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">Edit Record</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span>
                      <div>{selectedRecord.patient?.users?.name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Doctor:</span>
                      <div>{selectedRecord.doctor?.users?.name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Diagnosis:</span>
                      <div>{selectedRecord.diagnosis}</div>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>
                      <div>{new Date(selectedRecord.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditRecordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmEditRecord}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Record Confirmation Dialog */}
        <Dialog open={showDeleteRecordDialog} onOpenChange={setShowDeleteRecordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Medical Record</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete this medical record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="py-4">
                <div className="p-4 bg-red-50 rounded-lg space-y-2 border border-red-200">
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Permanent Deletion</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span> {selectedRecord.patient?.users?.name}
                    </div>
                    <div>
                      <span className="font-medium">Diagnosis:</span> {selectedRecord.diagnosis}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(selectedRecord.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-red-600 mt-2 font-medium">
                    ⚠️ This will permanently remove all associated data including prescriptions and lab tests.
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteRecordDialog(false)}>
                Keep Record
              </Button>
              <Button variant="destructive" onClick={confirmDeleteRecord}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Process Payment Confirmation Dialog */}
        <Dialog open={showProcessPaymentDialog} onOpenChange={setShowProcessPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>
                Navigate to payment processing to handle this transaction.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="py-4">
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Payment Processing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span>
                      <div>{selectedPayment.patient?.users?.name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>
                      <div className="font-bold text-green-600">${selectedPayment.amount}</div>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div>
                        <Badge className={`${
                          selectedPayment.status === 'paid' ? 'bg-green-100 text-green-800' :
                          selectedPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedPayment.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Method:</span>
                      <div className="capitalize">{selectedPayment.payment_method.replace('_', ' ')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProcessPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmProcessPayment}>
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Payment Confirmation Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to process a refund for this payment? This action will reverse the transaction.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="py-4">
                <div className="p-4 bg-orange-50 rounded-lg space-y-2 border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <RefreshCcw className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Payment Refund</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span> {selectedPayment.patient?.users?.name}
                    </div>
                    <div>
                      <span className="font-medium">Refund Amount:</span> 
                      <span className="font-bold text-orange-600 ml-1">${selectedPayment.amount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Original Method:</span> {selectedPayment.payment_method.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {selectedPayment.description}
                    </div>
                  </div>
                  <div className="text-xs text-orange-600 mt-2">
                    Refund will be processed to the original payment method within 3-5 business days.
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                Cancel Refund
              </Button>
              <Button variant="destructive" onClick={confirmRefund}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Process Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Download Record Confirmation Dialog */}
        <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Download Medical Record</DialogTitle>
              <DialogDescription>
                Download the medical record as a PDF file for external use.
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="py-4">
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Download className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Download Record</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span> {selectedRecord.patient?.users?.name}
                    </div>
                    <div>
                      <span className="font-medium">Diagnosis:</span> {selectedRecord.diagnosis}
                    </div>
                    <div>
                      <span className="font-medium">Doctor:</span> {selectedRecord.doctor?.users?.name}
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    File will be saved as: {selectedRecord.patient?.users?.name?.replace(' ', '_') || 'patient'}_medical_record.pdf
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Print Record Confirmation Dialog */}
        <Dialog open={showPrintRecordDialog} onOpenChange={setShowPrintRecordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Print Medical Record</DialogTitle>
              <DialogDescription>
                Send the medical record to your printer for physical documentation.
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="py-4">
                <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Printer className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Print Record</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span> {selectedRecord.patient?.users?.name}
                    </div>
                    <div>
                      <span className="font-medium">Diagnosis:</span> {selectedRecord.diagnosis}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(selectedRecord.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-purple-600 mt-2">
                    Make sure your printer is ready and has enough paper.
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrintRecordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPrintRecord}>
                <Printer className="h-4 w-4 mr-2" />
                Print Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Invoice Confirmation Dialog */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invoice</DialogTitle>
              <DialogDescription>
                Send a payment invoice to the patient via email.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="py-4">
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Email Invoice</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span> {selectedPayment.patient?.users?.name}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> 
                      <span className="font-bold text-green-600 ml-1">${selectedPayment.amount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {selectedPayment.status}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {selectedPayment.description}
                    </div>
                  </div>
                  <div className="text-xs text-green-600 mt-2">
                    Invoice will be sent to the patient's registered email address.
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmSendInvoice}>
                <Receipt className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Payment Confirmation Dialog */}
        <Dialog open={showViewPaymentDialog} onOpenChange={setShowViewPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Payment Details</DialogTitle>
              <DialogDescription>
                Navigate to the payment processing page to view complete transaction details.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="py-4">
                <div className="p-4 bg-indigo-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">Payment Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Patient:</span>
                      <div>{selectedPayment.patient?.users?.name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>
                      <div className="font-bold text-indigo-600">${selectedPayment.amount}</div>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div>
                        <Badge className={`${
                          selectedPayment.status === 'paid' ? 'bg-green-100 text-green-800' :
                          selectedPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedPayment.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Method:</span>
                      <div className="capitalize">{selectedPayment.payment_method.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="text-xs text-indigo-600 mt-2">
                    This will open the full payment processing interface.
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmViewPayment}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffDashboard;
