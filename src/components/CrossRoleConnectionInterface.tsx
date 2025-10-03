import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Stethoscope, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Search,
  Plus,
  Eye,
  Edit,
  Send,
  UserCheck,
  Clock,
  Filter,
  ArrowRight,
  Activity,
  Heart,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import StaffManagementService from '@/services/staffDatabaseService';
import CrossRoleConnectionService from '@/services/crossRoleConnectionService';

interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  blood_type?: string;
  allergies?: string;
  users: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  appointments?: any[];
  medical_records?: any[];
  health_metrics?: any[];
}

interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating?: number;
  years_experience?: number;
  is_available?: boolean;
  users: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  appointments?: any[];
  doctor_schedules?: any[];
}

const CrossRoleConnectionInterface: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState<'patients' | 'doctors' | 'messages' | 'search'>('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  
  // Search and message states
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageSubject, setMessageSubject] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [patientsData, doctorsData] = await Promise.all([
        StaffManagementService.getAccessiblePatients(),
        StaffManagementService.getAccessibleDoctors()
      ]);

      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading cross-role data:', error);
      toast({
        title: "Data Loading Failed",
        description: "Failed to load cross-role data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Patient handlers
  const handleViewPatient = async (patient: Patient) => {
    try {
      const fullRecord = await StaffManagementService.getPatientFullRecord(patient.id);
      setSelectedPatient(fullRecord);
      setShowPatientDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patient record",
        variant: "destructive"
      });
    }
  };

  const handleAccessPatientPortal = (patient: Patient) => {
    navigate(`/patient-dashboard?patient_id=${patient.id}`);
  };

  const handleMessagePatient = (patient: Patient) => {
    setSelectedContact({
      id: patient.user_id,
      name: patient.users.name,
      type: 'patient',
      email: patient.users.email
    });
    setMessageSubject(`Healthcare Update for ${patient.users.name}`);
    setShowMessageDialog(true);
  };

  // Doctor handlers
  const handleViewDoctor = async (doctor: Doctor) => {
    try {
      const fullRecord = await StaffManagementService.getDoctorFullRecord(doctor.id);
      setSelectedDoctor(fullRecord);
      setShowDoctorDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load doctor record",
        variant: "destructive"
      });
    }
  };

  const handleAccessDoctorPortal = (doctor: Doctor) => {
    navigate(`/doctor-dashboard?doctor_id=${doctor.id}`);
  };

  const handleMessageDoctor = (doctor: Doctor) => {
    setSelectedContact({
      id: doctor.user_id,
      name: doctor.users.name,
      type: 'doctor',
      email: doctor.users.email,
      specialty: doctor.specialty
    });
    setMessageSubject(`Staff Communication - ${doctor.specialty}`);
    setShowMessageDialog(true);
  };

  // Search handler
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const results = await StaffManagementService.universalSearch(searchTerm);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search records",
        variant: "destructive"
      });
    }
  };

  // Message handler
  const handleSendMessage = async () => {
    if (!selectedContact || !messageText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all message fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await StaffManagementService.sendCrossRoleMessage(
        'current_staff_id', // Should be actual staff ID
        selectedContact.id,
        messageText,
        'text'
      );

      toast({
        title: "Message Sent",
        description: `Message sent successfully to ${selectedContact.name}`,
      });

      setShowMessageDialog(false);
      setMessageText('');
      setMessageSubject('');
      setSelectedContact(null);
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700">Loading Cross-Role Interface</h2>
          <p className="text-gray-500">Please wait while we load all connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cross-Role Connections
            </h1>
            <p className="text-gray-600">Access and manage patient and doctor information</p>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients, doctors, appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 w-80 bg-white shadow-sm"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger value="patients" className="flex items-center space-x-2 rounded-lg">
              <Users className="h-4 w-4" />
              <span>Patients ({patients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center space-x-2 rounded-lg">
              <Stethoscope className="h-4 w-4" />
              <span>Doctors ({doctors.length})</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2 rounded-lg">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center space-x-2 rounded-lg">
              <Search className="h-4 w-4" />
              <span>Search Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6 mt-6">
            <Card className="shadow-xl bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Patient Access & Management</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {patients.length} Patients
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {patients.map((patient) => (
                    <Card key={patient.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {patient.users.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{patient.users.name}</h3>
                            <p className="text-sm text-gray-600">{patient.users.email}</p>
                            <p className="text-xs text-blue-600">{patient.users.phone || 'No phone'}</p>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                              {patient.gender && (
                                <Badge variant="secondary" className="text-xs">
                                  {patient.gender}
                                </Badge>
                              )}
                              {patient.blood_type && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                  {patient.blood_type}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleViewPatient(patient)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Record
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAccessPatientPortal(patient)}
                                className="border-green-200 text-green-700 hover:bg-green-50 text-xs"
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Access Portal
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMessagePatient(patient)}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-6 mt-6">
            <Card className="shadow-xl bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                    <span>Doctor Access & Coordination</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {doctors.length} Doctors
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {doctors.map((doctor) => (
                    <Card key={doctor.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            <Stethoscope className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">Dr. {doctor.users.name}</h3>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            <p className="text-xs text-green-600">{doctor.users.email}</p>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                ₱{doctor.consultation_fee} consultation
                              </Badge>
                              {doctor.is_available && (
                                <Badge className="text-xs bg-green-500 text-white">
                                  Available
                                </Badge>
                              )}
                              {doctor.rating && (
                                <Badge variant="secondary" className="text-xs">
                                  ⭐ {doctor.rating}/5
                                </Badge>
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleViewDoctor(doctor)}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAccessDoctorPortal(doctor)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Access Portal
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMessageDoctor(doctor)}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6 mt-6">
            <Card className="shadow-xl bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <span>Cross-Role Communication</span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setShowMessageDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <MessageSquare className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Cross-Role Messaging</h3>
                  <p className="text-gray-500 mb-6">Send messages to patients and doctors directly from the staff interface</p>
                  <Button onClick={() => setShowMessageDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Results Tab */}
          <TabsContent value="search" className="space-y-6 mt-6">
            <Card className="shadow-xl bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-orange-600" />
                  <span>Search Results for "{searchTerm}"</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {Object.keys(searchResults).length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No search performed</h3>
                    <p className="text-gray-500">Use the search bar above to find patients, doctors, or appointments</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Patients Results */}
                    {searchResults.patients && searchResults.patients.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-blue-600" />
                          Patients ({searchResults.patients.length})
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {searchResults.patients.map((patient: any) => (
                            <Card key={patient.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <h4 className="font-semibold">{patient.users.name}</h4>
                                <p className="text-sm text-gray-600">{patient.users.email}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Doctors Results */}
                    {searchResults.doctors && searchResults.doctors.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                          Doctors ({searchResults.doctors.length})
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {searchResults.doctors.map((doctor: any) => (
                            <Card key={doctor.id} className="border-l-4 border-l-green-500">
                              <CardContent className="p-4">
                                <h4 className="font-semibold">Dr. {doctor.users.name}</h4>
                                <p className="text-sm text-gray-600">{doctor.specialty}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Appointments Results */}
                    {searchResults.appointments && searchResults.appointments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                          Appointments ({searchResults.appointments.length})
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {searchResults.appointments.map((appointment: any) => (
                            <Card key={appointment.id} className="border-l-4 border-l-purple-500">
                              <CardContent className="p-4">
                                <h4 className="font-semibold">{appointment.service_type}</h4>
                                <p className="text-sm text-gray-600">
                                  {appointment.patients?.users?.name} with {appointment.doctors?.users?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {appointment.appointment_date} at {appointment.appointment_time}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Message Dialog */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Cross-Role Message</DialogTitle>
              <DialogDescription>
                {selectedContact 
                  ? `Send a message to ${selectedContact.name} (${selectedContact.type})`
                  : "Send a message to a patient or doctor"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message-to" className="text-right">
                  To
                </Label>
                <Input 
                  id="message-to" 
                  value={selectedContact?.name || ""} 
                  className="col-span-3" 
                  disabled 
                  placeholder="Select a contact first"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message-subject" className="text-right">
                  Subject
                </Label>
                <Input 
                  id="message-subject" 
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="col-span-3" 
                  placeholder="Enter subject"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message-body" className="text-right">
                  Message
                </Label>
                <Textarea 
                  id="message-body" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="col-span-3" 
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default CrossRoleConnectionInterface;