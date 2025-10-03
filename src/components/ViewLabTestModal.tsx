import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TestTube, 
  User, 
  Calendar, 
  Clock,
  FileText,
  Download,
  Printer,
  Activity,
  CheckCircle,
  AlertCircle,
  FlaskConical
} from 'lucide-react';

interface LabTest {
  id: string;
  test_type: string;
  result?: string;
  created_at: string;
  test_date?: string;
  status?: 'pending' | 'completed' | 'processing';
  normal_range?: string;
  unit?: string;
  notes?: string;
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
}

interface ViewLabTestModalProps {
  test: LabTest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewLabTestModal: React.FC<ViewLabTestModalProps> = ({
  test,
  isOpen,
  onClose
}) => {
  if (!test) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return test.result ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return test.result ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status?: string) => {
    if (status) return status.charAt(0).toUpperCase() + status.slice(1);
    return test.result ? 'Completed' : 'Pending';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a detailed lab test report
    const testReport = `
LAB TEST REPORT
===============

Test ID: ${test.id}
Test Type: ${test.test_type}
Status: ${getStatusText(test.status)}
Date Ordered: ${new Date(test.created_at).toLocaleDateString()}
${test.test_date ? `Test Date: ${new Date(test.test_date).toLocaleDateString()}` : ''}

DOCTOR INFORMATION:
Doctor: ${test.doctors?.users?.name || 'Unknown'}
Specialty: ${test.doctors?.specialty || 'N/A'}
${test.doctors?.users?.email ? `Email: ${test.doctors.users.email}` : ''}

APPOINTMENT DETAILS:
Service: ${test.appointments?.service_type || 'N/A'}
Date: ${test.appointments?.appointment_date ? new Date(test.appointments.appointment_date).toLocaleDateString() : 'N/A'}

TEST RESULTS:
${test.result || 'Results pending - will be available once the laboratory completes the analysis'}

${test.normal_range ? `Normal Range: ${test.normal_range}` : ''}
${test.unit ? `Unit: ${test.unit}` : ''}

ADDITIONAL NOTES:
${test.notes || 'No additional notes'}

---
This is a computer-generated report.
Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([testReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-test-${test.id}-${new Date().toISOString().split('T')[0]}.txt`;
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
            <TestTube className="h-5 w-5 text-red-600" />
            <span>Lab Test Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete laboratory test information and results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Header */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(test.status)} flex items-center space-x-2 px-3 py-1`}>
              {getStatusIcon(test.status)}
              <span className="font-medium">{getStatusText(test.status)}</span>
            </Badge>
            <span className="text-sm text-gray-500">Test ID: {test.id}</span>
          </div>

          {/* Test Information */}
          <Card className="bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FlaskConical className="h-4 w-4 text-red-600" />
                <Label className="font-semibold">Test Information</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Test Type:</span>
                  <div className="mt-1 text-lg font-semibold text-red-700">{test.test_type}</div>
                </div>
                <div>
                  <span className="font-medium">Date Ordered:</span>
                  <div className="mt-1">{new Date(test.created_at).toLocaleDateString()}</div>
                </div>
                {test.test_date && (
                  <div>
                    <span className="font-medium">Test Date:</span>
                    <div className="mt-1">{new Date(test.test_date).toLocaleDateString()}</div>
                  </div>
                )}
                {test.unit && (
                  <div>
                    <span className="font-medium">Unit:</span>
                    <div className="mt-1">{test.unit}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Information */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <Label className="font-semibold">Ordered By</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Doctor:</span>
                    <span className="ml-2">Dr. {test.doctors?.users?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Specialty:</span>
                    <span className="ml-2">{test.doctors?.specialty || 'N/A'}</span>
                  </div>
                  {test.doctors?.users?.email && (
                    <div>
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{test.doctors.users.email}</span>
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
                    <span className="ml-2">{test.appointments?.service_type || 'Laboratory Test'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <span className="ml-2">
                      {test.appointments?.appointment_date 
                        ? new Date(test.appointments.appointment_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  {test.appointments?.appointment_time && (
                    <div>
                      <span className="font-medium">Time:</span>
                      <span className="ml-2">{test.appointments.appointment_time}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="h-4 w-4 text-green-600" />
                <Label className="font-semibold">Test Results</Label>
              </div>
              {test.result ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <h4 className="font-medium text-green-800 mb-2">Results Available</h4>
                    <p className="text-sm text-green-700">{test.result}</p>
                  </div>
                  {test.normal_range && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="font-medium text-blue-800 text-sm">Normal Range:</h5>
                      <p className="text-sm text-blue-700">{test.normal_range}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Results Pending</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    Test results are being processed by the laboratory. You will be notified when results are available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {test.notes && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <Label className="font-semibold">Additional Notes</Label>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm text-gray-700">{test.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Status Summary */}
          <Card className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TestTube className="h-4 w-4 text-red-600" />
                <Label className="font-semibold">Test Summary</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-red-600">
                    <TestTube className="h-5 w-5 mx-auto" />
                  </div>
                  <div className="text-xs text-gray-600">Lab Test</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {test.result ? '✓' : '⏳'}
                  </div>
                  <div className="text-xs text-gray-600">Results</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {test.doctors?.users?.name ? '✓' : '○'}
                  </div>
                  <div className="text-xs text-gray-600">Doctor</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {new Date(test.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">Ordered</div>
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