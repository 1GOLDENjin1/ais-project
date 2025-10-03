import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  TestTube, 
  Pill, 
  Calendar, 
  Stethoscope,
  Heart,
  Activity
} from 'lucide-react';

interface WorkflowNavigationProps {
  userRole: 'patient' | 'doctor' | 'staff';
}

const WorkflowNavigation: React.FC<WorkflowNavigationProps> = ({ userRole }) => {
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  if (userRole === 'patient') {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>My Health Records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              variant="outline"
              onClick={() => navigateTo('/patient/medical-history')}
            >
              <FileText className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Medical Records</span>
              <span className="text-xs text-gray-500">View consultations</span>
            </Button>
            
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              variant="outline"
              onClick={() => navigateTo('/patient/prescriptions')}
            >
              <Pill className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Prescriptions</span>
              <span className="text-xs text-gray-500">Medications</span>
            </Button>
            
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
              variant="outline"
              onClick={() => navigateTo('/patient/lab-results')}
            >
              <TestTube className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Lab Results</span>
              <span className="text-xs text-gray-500">Test reports</span>
            </Button>
            
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
              variant="outline"
              onClick={() => navigateTo('/patient/appointments')}
            >
              <Calendar className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Appointments</span>
              <span className="text-xs text-gray-500">Schedule & history</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userRole === 'doctor') {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-blue-500" />
            <span>Doctor Tools</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              variant="outline"
              onClick={() => navigateTo('/doctor/appointments')}
            >
              <Calendar className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Appointments</span>
              <span className="text-xs text-gray-500">Manage schedule</span>
            </Button>
            
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              variant="outline"
              onClick={() => navigateTo('/doctor/consultations')}
            >
              <Stethoscope className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Consultations</span>
              <span className="text-xs text-gray-500">Complete visits</span>
            </Button>
            
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
              variant="outline"
              onClick={() => navigateTo('/doctor/lab-results')}
            >
              <TestTube className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Lab Results</span>
              <span className="text-xs text-gray-500">Manage tests</span>
            </Button>
            
            <Button 
              className="flex flex-col items-center p-6 h-auto bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
              variant="outline"
              onClick={() => navigateTo('/doctor/patients')}
            >
              <Activity className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Patients</span>
              <span className="text-xs text-gray-500">Patient list</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default WorkflowNavigation;