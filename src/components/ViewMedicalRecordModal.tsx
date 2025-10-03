import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  User, 
  Calendar, 
  Stethoscope,
  Pill,
  Download,
  Printer,
  Activity,
  Heart
} from 'lucide-react';

interface MedicalRecord {
  id: string;
  diagnosis?: string;
  notes?: string;
  created_at: string;
  appointments?: {
    id: string;
    service_type: string;
    appointment_date: string;
    appointment_time?: string;
  };
  doctors?: {
    id: string;
    specialty: string;
    users?: {
      name: string;
      email?: string;
    };
  };
  prescriptions?: Array<{
    id: string;
    medication_name: string;
    dosage?: string;
    instructions?: string;
    created_at: string;
  }>;
}

interface ViewMedicalRecordModalProps {
  record: MedicalRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewMedicalRecordModal: React.FC<ViewMedicalRecordModalProps> = ({
  record,
  isOpen,
  onClose
}) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple text file with medical record data
    const recordData = `
MEDICAL RECORD
==============

Record ID: ${record.id}
Date: ${new Date(record.created_at).toLocaleDateString()}
Doctor: ${record.doctors?.users?.name || 'Unknown'} (${record.doctors?.specialty || 'N/A'})

APPOINTMENT DETAILS:
Service: ${record.appointments?.service_type || 'N/A'}
Date: ${record.appointments?.appointment_date ? new Date(record.appointments.appointment_date).toLocaleDateString() : 'N/A'}

DIAGNOSIS:
${record.diagnosis || 'No diagnosis recorded'}

DOCTOR'S NOTES:
${record.notes || 'No notes recorded'}

PRESCRIPTIONS:
${record.prescriptions?.map(p => `- ${p.medication_name}${p.dosage ? ` (${p.dosage})` : ''}${p.instructions ? ` - ${p.instructions}` : ''}`).join('\n') || 'No prescriptions'}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([recordData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${record.id}-${new Date().toISOString().split('T')[0]}.txt`;
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
            <FileText className="h-5 w-5 text-green-600" />
            <span>Medical Record Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete medical record from consultation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Record Header */}
          <div className="flex items-center justify-between">
            <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
              Medical Record
            </Badge>
            <span className="text-sm text-gray-500">ID: {record.id}</span>
          </div>

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Information */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <Label className="font-semibold">Doctor Information</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>
                    <span className="ml-2">Dr. {record.doctors?.users?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Specialty:</span>
                    <span className="ml-2">{record.doctors?.specialty || 'N/A'}</span>
                  </div>
                  {record.doctors?.users?.email && (
                    <div>
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{record.doctors.users.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Appointment Information */}
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <Label className="font-semibold">Appointment Details</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Service:</span>
                    <span className="ml-2">{record.appointments?.service_type || 'General Consultation'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <span className="ml-2">
                      {record.appointments?.appointment_date 
                        ? new Date(record.appointments.appointment_date).toLocaleDateString()
                        : new Date(record.created_at).toLocaleDateString()
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Record Date:</span>
                    <span className="ml-2">{new Date(record.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diagnosis */}
          {record.diagnosis && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Stethoscope className="h-4 w-4 text-red-600" />
                  <Label className="font-semibold">Diagnosis</Label>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm">{record.diagnosis}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Doctor's Notes */}
          {record.notes && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <Label className="font-semibold">Doctor's Notes</Label>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm text-gray-700">{record.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prescriptions */}
          {record.prescriptions && record.prescriptions.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Pill className="h-4 w-4 text-purple-600" />
                  <Label className="font-semibold">Prescriptions ({record.prescriptions.length})</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {record.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-3 bg-purple-50 border border-purple-200 rounded">
                      <div className="space-y-1">
                        <h4 className="font-medium text-purple-900">{prescription.medication_name}</h4>
                        {prescription.dosage && (
                          <p className="text-sm text-purple-700">
                            <span className="font-medium">Dosage:</span> {prescription.dosage}
                          </p>
                        )}
                        {prescription.instructions && (
                          <p className="text-sm text-purple-600">{prescription.instructions}</p>
                        )}
                        <p className="text-xs text-purple-500">
                          Prescribed: {new Date(prescription.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Status Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="h-4 w-4 text-green-600" />
                <Label className="font-semibold">Record Summary</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {record.diagnosis ? '✓' : '○'}
                  </div>
                  <div className="text-xs text-gray-600">Diagnosis</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {record.notes ? '✓' : '○'}
                  </div>
                  <div className="text-xs text-gray-600">Notes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {record.prescriptions?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Prescriptions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">
                    <Heart className="h-5 w-5 mx-auto" />
                  </div>
                  <div className="text-xs text-gray-600">Complete</div>
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