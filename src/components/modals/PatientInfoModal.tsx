import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Heart,
  Activity,
  FileText
} from 'lucide-react';

interface PatientInfo {
  id?: string;
  name: string;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface PatientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientInfo | null;
}

const PatientInfoModal: React.FC<PatientInfoModalProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Patient Information</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto md:mx-0">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                {patient.age && (
                  <p className="text-gray-600">{patient.age} years old</p>
                )}
                {patient.gender && (
                  <Badge variant="secondary" className="mt-1">
                    {patient.gender}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {patient.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{patient.email}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Born: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{patient.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          {(patient.bloodType || patient.allergies || patient.medicalHistory) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                Medical Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.bloodType && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Blood Type</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.bloodType}</p>
                  </div>
                )}
                
                {patient.allergies && patient.allergies.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Allergies</label>
                    <div className="mt-1 space-y-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="mr-1 mb-1">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Medical History
                  </label>
                  <ul className="mt-2 space-y-1">
                    {patient.medicalHistory.map((condition, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <Activity className="h-3 w-3 mr-2 text-gray-400" />
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Phone className="h-5 w-5 text-orange-500 mr-2" />
                Emergency Contact
              </h3>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.emergencyContact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.emergencyContact.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Relationship</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientInfoModal;