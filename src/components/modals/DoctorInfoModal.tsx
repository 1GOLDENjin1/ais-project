import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Stethoscope,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  Clock,
  Star,
  Building,
  Users
} from 'lucide-react';

interface DoctorInfo {
  id?: string;
  name: string;
  specialty: string;
  title?: string;
  phone?: string;
  email?: string;
  address?: string;
  experience?: number;
  education?: string[];
  certifications?: string[];
  hospital?: string;
  department?: string;
  consultationHours?: {
    days: string;
    hours: string;
  };
  rating?: number;
  totalPatients?: number;
  languages?: string[];
  bio?: string;
}

interface DoctorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorInfo | null;
}

const DoctorInfoModal: React.FC<DoctorInfoModalProps> = ({
  isOpen,
  onClose,
  doctor
}) => {
  if (!doctor) return null;

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <span>Doctor Information</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto md:mx-0">
                <Stethoscope className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {doctor.title ? `${doctor.title} ${doctor.name}` : doctor.name}
                </h2>
                <p className="text-lg text-blue-600 font-medium">{doctor.specialty}</p>
                {doctor.experience && (
                  <p className="text-gray-600">{doctor.experience} years of experience</p>
                )}
                {doctor.rating && (
                  <div className="mt-2">
                    {renderStarRating(doctor.rating)}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {doctor.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{doctor.phone}</span>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{doctor.email}</span>
                </div>
              )}
              {doctor.hospital && (
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{doctor.hospital}</span>
                </div>
              )}
              {doctor.department && (
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{doctor.department}</span>
                </div>
              )}
              {doctor.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{doctor.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          {doctor.totalPatients && (
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{doctor.totalPatients}</div>
                  <div className="text-sm text-gray-600">Total Patients</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{doctor.experience || 0}</div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {doctor.certifications?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Certifications</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{doctor.rating || 0}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          )}

          {/* Education & Certifications */}
          {(doctor.education || doctor.certifications) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 text-green-500 mr-2" />
                Education & Certifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctor.education && doctor.education.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Education</label>
                    <ul className="mt-2 space-y-1">
                      {doctor.education.map((edu, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <GraduationCap className="h-3 w-3 mr-2 text-gray-400" />
                          {edu}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {doctor.certifications && doctor.certifications.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Certifications</label>
                    <div className="mt-2 space-y-1">
                      {doctor.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          <Award className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consultation Hours */}
          {doctor.consultationHours && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 text-purple-500 mr-2" />
                Consultation Hours
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Days</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.consultationHours.days}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hours</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.consultationHours.hours}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Languages */}
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map((language, index) => (
                  <Badge key={index} variant="outline">
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {doctor.bio && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Biography</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t pt-6">
            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button variant="outline" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Contact Doctor
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorInfoModal;