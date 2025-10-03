import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download,
  Video,
  MessageSquare,
  Star,
  MapPin,
  Phone,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AppointmentDetailsModalProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onJoinCall?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onMessage?: () => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onJoinCall,
  onReschedule,
  onCancel,
  onMessage
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDownloadReceipt = () => {
    toast({
      title: "Receipt Downloaded",
      description: `Receipt for appointment with Dr. ${appointment?.doctor?.name} has been downloaded.`,
    });
  };

  const handleViewMedicalRecord = () => {
    if (appointment?.medical_record_id) {
      navigate(`/medical-record/${appointment.medical_record_id}`);
    } else {
      toast({
        title: "No Medical Record",
        description: "Medical record will be available after the appointment is completed.",
        variant: "default",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = () => {
    if (!appointment?.date || !appointment?.time) return false;
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    return appointmentDateTime > new Date() && appointment.status !== 'completed';
  };

  const canJoinCall = () => {
    if (!appointment?.date || !appointment?.time) return false;
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const timeDiff = appointmentDateTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    return appointment.consultationType === 'video-call' && 
           appointment.status === 'confirmed' && 
           minutesDiff <= 15 && minutesDiff >= -60;
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Appointment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Doctor Info Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                  {appointment.doctor?.name?.split(' ').map((n: string) => n[0]).join('') || 'DR'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                      </h3>
                      <p className="text-blue-600 font-medium">{appointment.doctor?.specialty || 'General Medicine'}</p>
                      {appointment.doctor?.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {appointment.doctor.rating} ({appointment.doctor.total_reviews || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                  
                  {appointment.reason && (
                    <div className="mt-3">
                      <p className="text-gray-700">
                        <span className="font-medium">Reason for visit: </span>
                        {appointment.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="font-semibold">{format(new Date(appointment.date), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-600">Date</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">{appointment.time}</p>
                <p className="text-sm text-gray-600">Time</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                {appointment.consultationType === 'video-call' ? (
                  <Video className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                ) : appointment.consultationType === 'phone' ? (
                  <Phone className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                ) : (
                  <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
                )}
                <p className="font-semibold capitalize">
                  {appointment.consultationType?.replace('-', ' ') || 'In-person'}
                </p>
                <p className="text-sm text-gray-600">Type</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <CreditCard className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">₱{appointment.fee?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600">Fee</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          {(appointment.notes || appointment.location || appointment.duration_minutes) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">Additional Information</h4>
                <div className="space-y-2">
                  {appointment.duration_minutes && (
                    <p><span className="font-medium">Duration:</span> {appointment.duration_minutes} minutes</p>
                  )}
                  {appointment.location && (
                    <p><span className="font-medium">Location:</span> {appointment.location}</p>
                  )}
                  {appointment.notes && (
                    <p><span className="font-medium">Notes:</span> {appointment.notes}</p>
                  )}
                  {appointment.special_requirements && (
                    <p><span className="font-medium">Special Requirements:</span> {appointment.special_requirements}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {/* Join Call - only for video appointments that are starting soon */}
            {canJoinCall() && (
              <Button 
                onClick={onJoinCall}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Video Call
              </Button>
            )}

            {/* Message Doctor */}
            <Button 
              variant="outline" 
              onClick={onMessage}
              className="border-blue-200 hover:bg-blue-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Doctor
            </Button>

            {/* Reschedule - only for upcoming appointments */}
            {isUpcoming() && appointment.status !== 'cancelled' && (
              <Button 
                variant="outline" 
                onClick={onReschedule}
                className="border-green-200 hover:bg-green-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            )}

            {/* Cancel - only for upcoming appointments */}
            {isUpcoming() && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="border-red-200 hover:bg-red-50 text-red-600"
              >
                Cancel Appointment
              </Button>
            )}

            {/* View Medical Record - for completed appointments */}
            {appointment.status === 'completed' && (
              <Button 
                variant="outline" 
                onClick={handleViewMedicalRecord}
                className="border-gray-200 hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Medical Record
              </Button>
            )}

            {/* Download Receipt */}
            <Button 
              variant="outline" 
              onClick={handleDownloadReceipt}
              className="border-gray-200 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;