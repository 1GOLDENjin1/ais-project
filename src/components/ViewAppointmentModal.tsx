import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Appointment {
  id: string;
  patient_name?: string;
  doctor?: {
    id: string;
    name: string;
    specialty: string;
    email: string;
    phone: string;
  };
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  appointment_type?: string;
  consultation_type?: string;
  duration_minutes?: number;
  fee?: number;
  notes?: string;
  reason?: string;
}

interface ViewAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewAppointmentModal: React.FC<ViewAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose
}) => {
  if (!appointment) return null;

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

  const getStatusIcon = (status: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Appointment Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information for this appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(appointment.status)} flex items-center space-x-2 px-3 py-1`}>
              {getStatusIcon(appointment.status)}
              <span className="capitalize font-medium">{appointment.status}</span>
            </Badge>
            <span className="text-sm text-gray-500">ID: {appointment.id}</span>
          </div>

          {/* Main Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <Label className="font-semibold">Patient Information</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>
                    <span className="ml-2">{appointment.patient_name || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Information */}
            {appointment.doctor && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <Label className="font-semibold">Doctor Information</Label>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <span className="ml-2">{appointment.doctor.name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Specialty:</span>
                      <span className="ml-2">{appointment.doctor.specialty}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-gray-500" />
                      <span>{appointment.doctor.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3 text-gray-500" />
                      <span>{appointment.doctor.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Appointment Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-green-600" />
                <Label className="font-semibold">Appointment Details</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Service:</span>
                  <div className="mt-1">{appointment.service_type}</div>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <div className="mt-1 flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Time:</span>
                  <div className="mt-1 flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span>{appointment.appointment_time}</span>
                  </div>
                </div>
                {appointment.duration_minutes && (
                  <div>
                    <span className="font-medium">Duration:</span>
                    <div className="mt-1">{appointment.duration_minutes} minutes</div>
                  </div>
                )}
                {appointment.appointment_type && (
                  <div>
                    <span className="font-medium">Type:</span>
                    <div className="mt-1 capitalize">{appointment.appointment_type}</div>
                  </div>
                )}
                {appointment.consultation_type && (
                  <div>
                    <span className="font-medium">Consultation:</span>
                    <div className="mt-1 capitalize">{appointment.consultation_type}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fee Information */}
          {appointment.fee && (
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <Label className="font-semibold">Fee Information</Label>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₱{appointment.fee.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(appointment.notes || appointment.reason) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <Label className="font-semibold">Notes</Label>
                </div>
                <div className="space-y-2 text-sm">
                  {appointment.reason && (
                    <div>
                      <span className="font-medium">Reason:</span>
                      <div className="mt-1 p-2 bg-gray-50 rounded">{appointment.reason}</div>
                    </div>
                  )}
                  {appointment.notes && (
                    <div>
                      <span className="font-medium">Additional Notes:</span>
                      <div className="mt-1 p-2 bg-gray-50 rounded">{appointment.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          <Card className="bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-purple-600" />
                <Label className="font-semibold">Location</Label>
              </div>
              <div className="text-sm">
                <div>Medical Center Clinic</div>
                <div className="text-gray-600">123 Healthcare Ave, Medical District</div>
                <div className="text-gray-600">Please arrive 15 minutes early for check-in</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};