import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  DollarSign,
  ArrowLeft,
  Edit,
  MessageSquare,
  X,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AppointmentService } from '@/services/databaseService';

interface AppointmentDetailsProps {
  appointment?: {
    id: string;
    patient_name: string;
    service: string;
    date: string;
    time: string;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    patient_phone?: string;
    patient_email?: string;
    notes?: string;
    patient_id?: string;
    doctor_id?: string;
    fee?: number;
  };
}

const AppointmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get appointment data from navigation state or use default
  const appointment = location.state?.appointment || {
    id: "APT001",
    patient_name: "Juan Dela Cruz",
    service: "General Consultation",
    date: "Oct 31, 2025",
    time: "17:00:00",
    status: "pending" as const,
    patient_phone: "+63 912 345 6789",
    patient_email: "juan.delacruz@email.com",
    notes: "Digital X-ray appointment | Notes: tryyyyyyyyyyyy | Special...",
    patient_id: "PAT001",
    doctor_id: "DOC001",
    fee: 1500
  };

  const getStatusColor = (status: string) => {
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

  const handleCancel = async () => {
    const reason = prompt("Please provide a reason for cancelling this appointment:");
    if (!reason || reason.trim() === '') {
      toast({
        title: "Cancellation Required",
        description: "A reason is required to cancel the appointment.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await AppointmentService.cancel(appointment.id, reason);
      if (result.success) {
        toast({
          title: "Appointment Cancelled",
          description: `Appointment for ${appointment.patient_name} has been cancelled.`,
        });
        navigate('/staff-dashboard');
      } else {
        throw new Error(result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = () => {
    // For now, navigate to reschedule page
    // TODO: Implement inline reschedule modal
    navigate('/reschedule-appointment', { state: { appointment } });
  };

  const handleMessageDoctor = () => {
    navigate('/message-doctor', { state: { appointment } });
  };

  const handleMarkComplete = async () => {
    try {
      const result = await AppointmentService.updateAppointmentStatus(appointment.id, 'completed', 'Appointment marked as completed');
      if (result) {
        toast({
          title: "Appointment Completed",
          description: `Appointment for ${appointment.patient_name} marked as completed.`,
        });
        navigate('/staff-dashboard');
      } else {
        throw new Error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Mark complete error:', error);
      toast({
        title: "Error",
        description: "Failed to mark appointment as completed. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/staff-dashboard')}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Appointment Details
              </h1>
              <p className="text-gray-600">View and manage appointment information</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Appointment Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Patient Information */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Patient Information</span>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {appointment.patient_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{appointment.patient_name}</h3>
                    <p className="text-gray-600">Patient ID: {appointment.patient_id}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{appointment.patient_phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{appointment.patient_email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Appointment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{appointment.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{appointment.time}</p>
                        <p className="text-xs text-gray-400">Duration: 30 mins</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-medium">{appointment.service}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Fee</p>
                        <p className="font-medium">₱{appointment.fee}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">In Person Consultation • Clinic</p>
                  </div>
                </div>
                
                {appointment.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Notes</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleMessageDoctor}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Doctor
                </Button>
                
                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-yellow-50 hover:border-yellow-200"
                      onClick={handleReschedule}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                    
                    {appointment.status === 'confirmed' && (
                      <Button 
                        variant="outline" 
                        className="w-full hover:bg-green-50 hover:border-green-200 text-green-600"
                        onClick={handleMarkComplete}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-red-50 hover:border-red-200 text-red-600"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Appointment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Appointment Status Timeline */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Status Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Appointment Created</p>
                    <p className="text-xs text-gray-500">System generated</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    appointment.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="font-medium">Pending Confirmation</p>
                    <p className="text-xs text-gray-500">Awaiting confirmation</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    appointment.status === 'confirmed' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="font-medium">Confirmed</p>
                    <p className="text-xs text-gray-500">Ready for consultation</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    appointment.status === 'completed' ? 'bg-purple-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="font-medium">Completed</p>
                    <p className="text-xs text-gray-500">Consultation finished</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;