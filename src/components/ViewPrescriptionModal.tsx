import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Pill, 
  User, 
  Calendar, 
  Clock,
  FileText,
  Download,
  Printer,
  Activity,
  Heart,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Prescription {
  id: string;
  medication_name: string;
  dosage?: string;
  instructions?: string;
  created_at: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  refills?: number;
  warnings?: string;
  medical_records?: {
    id: string;
    diagnosis?: string;
    notes?: string;
    doctors?: {
      id: string;
      specialty: string;
      users?: {
        name: string;
        email?: string;
      };
    };
    appointments?: {
      id: string;
      service_type: string;
      appointment_date: string;
      appointment_time?: string;
    };
  };
}

interface ViewPrescriptionModalProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewPrescriptionModal: React.FC<ViewPrescriptionModalProps> = ({
  prescription,
  isOpen,
  onClose
}) => {
  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a detailed prescription report
    const prescriptionReport = `
PRESCRIPTION DETAILS
===================

Prescription ID: ${prescription.id}
Date Prescribed: ${new Date(prescription.created_at).toLocaleDateString()}

MEDICATION INFORMATION:
Medication: ${prescription.medication_name}
${prescription.dosage ? `Dosage: ${prescription.dosage}` : ''}
${prescription.frequency ? `Frequency: ${prescription.frequency}` : ''}
${prescription.duration ? `Duration: ${prescription.duration}` : ''}
${prescription.quantity ? `Quantity: ${prescription.quantity}` : ''}
${prescription.refills ? `Refills: ${prescription.refills}` : ''}

INSTRUCTIONS:
${prescription.instructions || 'No specific instructions provided'}

${prescription.warnings ? `WARNINGS: ${prescription.warnings}` : ''}

PRESCRIBING DOCTOR:
Doctor: ${prescription.medical_records?.doctors?.users?.name || 'Unknown'}
Specialty: ${prescription.medical_records?.doctors?.specialty || 'N/A'}
${prescription.medical_records?.doctors?.users?.email ? `Email: ${prescription.medical_records.doctors.users.email}` : ''}

MEDICAL CONTEXT:
${prescription.medical_records?.diagnosis ? `Diagnosis: ${prescription.medical_records.diagnosis}` : ''}
${prescription.medical_records?.appointments?.service_type ? `Service: ${prescription.medical_records.appointments.service_type}` : ''}
${prescription.medical_records?.appointments?.appointment_date ? `Appointment Date: ${new Date(prescription.medical_records.appointments.appointment_date).toLocaleDateString()}` : ''}

ADDITIONAL NOTES:
${prescription.medical_records?.notes || 'No additional notes from the consultation'}

---
This prescription is valid only when used as directed by the prescribing physician.
Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([prescriptionReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${prescription.id}-${new Date().toISOString().split('T')[0]}.txt`;
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
            <Pill className="h-5 w-5 text-purple-600" />
            <span>Prescription Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete prescription information and usage instructions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prescription Header */}
          <div className="flex items-center justify-between">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
              Active Prescription
            </Badge>
            <span className="text-sm text-gray-500">Rx ID: {prescription.id}</span>
          </div>

          {/* Medication Information */}
          <Card className="bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Pill className="h-4 w-4 text-purple-600" />
                <Label className="font-semibold">Medication Information</Label>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-2xl font-bold text-purple-800">{prescription.medication_name}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {prescription.dosage && (
                    <div>
                      <span className="font-medium text-purple-700">Dosage:</span>
                      <div className="mt-1">{prescription.dosage}</div>
                    </div>
                  )}
                  {prescription.frequency && (
                    <div>
                      <span className="font-medium text-purple-700">Frequency:</span>
                      <div className="mt-1">{prescription.frequency}</div>
                    </div>
                  )}
                  {prescription.duration && (
                    <div>
                      <span className="font-medium text-purple-700">Duration:</span>
                      <div className="mt-1">{prescription.duration}</div>
                    </div>
                  )}
                  {prescription.quantity && (
                    <div>
                      <span className="font-medium text-purple-700">Quantity:</span>
                      <div className="mt-1">{prescription.quantity} units</div>
                    </div>
                  )}
                  {prescription.refills !== undefined && (
                    <div>
                      <span className="font-medium text-purple-700">Refills:</span>
                      <div className="mt-1">{prescription.refills} refills allowed</div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-purple-700">Prescribed:</span>
                    <div className="mt-1">{new Date(prescription.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {prescription.instructions && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="h-4 w-4 text-blue-600" />
                  <Label className="font-semibold">Usage Instructions</Label>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">{prescription.instructions}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {prescription.warnings && (
            <Card className="border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <Label className="font-semibold text-amber-800">Important Warnings</Label>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-800">{prescription.warnings}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prescribing Doctor */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <Label className="font-semibold">Prescribing Doctor</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Doctor:</span>
                    <span className="ml-2">Dr. {prescription.medical_records?.doctors?.users?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Specialty:</span>
                    <span className="ml-2">{prescription.medical_records?.doctors?.specialty || 'N/A'}</span>
                  </div>
                  {prescription.medical_records?.doctors?.users?.email && (
                    <div>
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{prescription.medical_records.doctors.users.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Consultation Information */}
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <Label className="font-semibold">Consultation Details</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Service:</span>
                    <span className="ml-2">{prescription.medical_records?.appointments?.service_type || 'Medical Consultation'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <span className="ml-2">
                      {prescription.medical_records?.appointments?.appointment_date 
                        ? new Date(prescription.medical_records.appointments.appointment_date).toLocaleDateString()
                        : new Date(prescription.created_at).toLocaleDateString()
                      }
                    </span>
                  </div>
                  {prescription.medical_records?.appointments?.appointment_time && (
                    <div>
                      <span className="font-medium">Time:</span>
                      <span className="ml-2">{prescription.medical_records.appointments.appointment_time}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Related Diagnosis */}
          {prescription.medical_records?.diagnosis && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Activity className="h-4 w-4 text-red-600" />
                  <Label className="font-semibold">Related Diagnosis</Label>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">{prescription.medical_records.diagnosis}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          {prescription.medical_records?.notes && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <Label className="font-semibold">Doctor's Notes</Label>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm text-gray-700">{prescription.medical_records.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prescription Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Heart className="h-4 w-4 text-purple-600" />
                <Label className="font-semibold">Prescription Summary</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    <Pill className="h-5 w-5 mx-auto" />
                  </div>
                  <div className="text-xs text-gray-600">Medicine</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {prescription.dosage ? '✓' : '○'}
                  </div>
                  <div className="text-xs text-gray-600">Dosage</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {prescription.instructions ? '✓' : '○'}
                  </div>
                  <div className="text-xs text-gray-600">Instructions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {prescription.refills || 0}
                  </div>
                  <div className="text-xs text-gray-600">Refills</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <Label className="font-semibold text-blue-800">Important Notice</Label>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Take this medication exactly as prescribed by your doctor.</p>
                <p>• Do not share this medication with others, even if they have similar symptoms.</p>
                <p>• Contact your doctor if you experience any unexpected side effects.</p>
                <p>• Keep this medication out of reach of children.</p>
                <p>• Store according to the package instructions.</p>
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
              <span>Print</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
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