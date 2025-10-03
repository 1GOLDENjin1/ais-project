import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth-service';
import { PatientRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  TestTube2,
  Heart,
  Waves,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Home,
  Briefcase,
  Users,
  Shield,
  ArrowRight,
  User,
  Settings,
  LogOut,
  Monitor
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  icon: React.ReactElement;
  description: string;
  category: string;
}

const MendozaPatientPortal = () => {
  const [user, setUser] = useState<any>(null);

  const mendozaServices: Service[] = [
    {
      id: 'lab-test',
      name: 'Complete Laboratory Test',
      icon: <TestTube2 className="h-8 w-8" />,
      description: 'Comprehensive blood work and lab analysis',
      category: 'diagnostic'
    },
    {
      id: 'xray',
      name: 'X-Ray',
      icon: <Monitor className="h-8 w-8" />,
      description: 'Digital X-ray imaging services',
      category: 'imaging'
    },
    {
      id: 'ecg',
      name: 'ECG',
      icon: <Heart className="h-8 w-8" />,
      description: 'Electrocardiogram heart monitoring',
      category: 'diagnostic'
    },
    {
      id: 'ultrasound',
      name: 'Ultrasound',
      icon: <Waves className="h-8 w-8" />,
      description: 'Ultrasound imaging and diagnostics',
      category: 'imaging'
    },
    {
      id: 'drug-test',
      name: 'Drug Test',
      icon: <ShieldCheck className="h-8 w-8" />,
      description: 'Employment and legal drug screening',
      category: 'screening'
    },
    {
      id: 'medical-clinic',
      name: 'Medical Clinic',
      icon: <Stethoscope className="h-8 w-8" />,
      description: 'General consultation and medical care',
      category: 'consultation'
    },
    {
      id: 'vaccination',
      name: 'Vaccination',
      icon: <Syringe className="h-8 w-8" />,
      description: 'Immunization and vaccination services',
      category: 'prevention'
    },
    {
      id: 'home-service',
      name: 'Home Service',
      icon: <Home className="h-8 w-8" />,
      description: 'Medical services at your convenience',
      category: 'special'
    },
    {
      id: 'pre-employment',
      name: 'Pre-Employment Examination',
      icon: <Briefcase className="h-8 w-8" />,
      description: 'Complete medical examination for employment',
      category: 'employment'
    },
    {
      id: 'annual-physical',
      name: 'Onsite Annual Physical Examination',
      icon: <Users className="h-8 w-8" />,
      description: 'Company-wide health examinations',
      category: 'employment'
    },
    {
      id: 'covid-test',
      name: 'RT-PCR / COVID-19 Antigen Test',
      icon: <Shield className="h-8 w-8" />,
      description: 'COVID-19 testing and health screening',
      category: 'screening'
    }
  ];

  useEffect(() => {
    const currentContext = authService.getCurrentContext();
    if (currentContext && currentContext.user.role === 'patient') {
      setUser(currentContext.user);
    }
  }, []);

  const handleServiceSelect = (service: Service) => {
    // Store selected service and navigate to booking
    localStorage.setItem('selectedService', JSON.stringify(service));
    window.location.href = '/patient/book-appointment';
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <PatientRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Mendoza Diagnostic Center</h1>
                  <p className="text-sm text-gray-600">Patient Portal</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name || 'Patient'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/patient/dashboard'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Mendoza Diagnostic Center
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                Your trusted healthcare partner in Pulilan. We provide comprehensive medical services 
                with compassionate quality care, making healthcare accessible and reliable for all.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
                <div className="text-sm text-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Our Mission</h3>
                      <p className="text-xs leading-relaxed">
                        To guarantee the accuracy and effectiveness of all Medical Technologists. 
                        Secure quality services through proper monitoring of staff, machines, and reagents.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Our Vision</h3>
                      <p className="text-xs leading-relaxed">
                        To deliver accurate results and quality processes to the best of our ability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Selection */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Select a Service to Book Your Appointment
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mendozaServices.map((service) => (
                  <Card 
                    key={service.id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        {service.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm leading-tight">
                        {service.name}
                      </h4>
                      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
                        <span>Book Now</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Set an Appointment</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Schedule your visit at your convenience
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => handleServiceSelect(mendozaServices[0])}>
                    Book Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6 text-center">
                  <Monitor className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Online Consultation</h3>
                  <p className="text-green-100 text-sm mb-4">
                    Connect with doctors remotely
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => window.location.href = '/patient/dashboard'}>
                    View Options
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6 text-center">
                  <TestTube2 className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your Records</h3>
                  <p className="text-purple-100 text-sm mb-4">
                    Access your medical history
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => window.location.href = '/patient/dashboard'}>
                    View Records
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="mt-12 text-center">
              <Card className="bg-gray-50">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Need Help?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Contact Mendoza Diagnostic Center for any questions or concerns
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    <span>📍 Pulilan, Bulacan</span>
                    <span>📞 Contact for appointments</span>
                    <span>🕒 Clinic Hours Available</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PatientRoute>
  );
};

export default MendozaPatientPortal;