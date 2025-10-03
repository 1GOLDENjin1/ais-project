import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DoctorManagementService from '@/services/doctorDatabaseService';
import PatientInfoModal from '@/components/modals/PatientInfoModal';
import DoctorInfoModal from '@/components/modals/DoctorInfoModal';

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  chief_complaint?: string;
  location?: string;
  is_video_call?: boolean;
  duration_minutes?: number;
}

const DoctorAppointmentManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState('');
  
  // Modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await DoctorManagementService.getMyAppointments(user.id);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string, notes?: string) => {
    try {
      await DoctorManagementService.updateAppointmentStatus(
        appointmentId, 
        newStatus as any, 
        notes
      );
      
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus as any, notes: notes || apt.notes }
            : apt
        )
      );

      toast({
        title: "Status Updated",
        description: `Appointment marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive"
      });
    }
  };

  const handleAddNotes = async (appointmentId: string, notes: string) => {
    try {
      // Use updateAppointmentStatus with notes parameter
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) return;
      
      await DoctorManagementService.updateAppointmentStatus(
        appointmentId, 
        appointment.status, 
        notes
      );
      
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, notes }
            : apt
        )
      );

      toast({
        title: "Notes Added",
        description: "Appointment notes have been saved.",
      });
      
      setIsNotesOpen(false);
      setAppointmentNotes('');
    } catch (error) {
      console.error('Error adding notes:', error);
      toast({
        title: "Error",
        description: "Failed to add notes.",
        variant: "destructive"
      });
    }
  };

  const handleVideoCall = async (appointmentId: string) => {
    try {
      // For now, just simulate starting a video call
      toast({
        title: "Video Call Started",
        description: "Connecting to patient...",
      });

      // In a real app, you would create and start a video call
      window.open(`/video-call/${appointmentId}`, '_blank');
    } catch (error) {
      console.error('Error starting video call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call.",
        variant: "destructive"
      });
    }
  };

  const handleViewPatient = (appointment: Appointment) => {
    // Create patient info from appointment data
    const patientInfo = {
      id: appointment.id,
      name: appointment.patient_name,
      phone: appointment.patient_phone || 'Not available',
      email: 'Not available' // Not available in this interface
    };
    
    setSelectedPatient(patientInfo);
    setShowPatientModal(true);
  };

  const handleViewDoctor = () => {
    // Since this is the doctor's own interface, show current doctor info
    if (user) {
      const doctorInfo = {
        id: user.id,
        name: user.name || 'Current Doctor',
        specialty: 'General Medicine',
        title: 'Dr.',
        phone: user.phone || 'Not available',
        email: user.email || 'Not available'
      };
      
      setSelectedDoctor(doctorInfo);
      setShowDoctorModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation': return <MessageSquare className="h-4 w-4" />;
      case 'follow-up': return <Clock className="h-4 w-4" />;
      case 'emergency': return <AlertCircle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'today' && 
                        new Date(appointment.appointment_date).toDateString() === new Date().toDateString()) ||
                       (dateFilter === 'week' && 
                        new Date(appointment.appointment_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const todayAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date).toDateString() === new Date().toDateString()
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) > new Date() && apt.status !== 'cancelled'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{todayAppointments.length}</p>
                <p className="text-sm text-gray-600">Today's Appointments</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</p>
                <p className="text-sm text-gray-600">Upcoming Appointments</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Completed This Week</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by patient name or complaint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Appointments List */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4 mt-6">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments found matching your criteria.</p>
                </div>
              ) : (
                filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(appointment.appointment_type)}
                          <div>
                            <h3 
                              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleViewPatient(appointment)}
                            >
                              {appointment.patient_name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(appointment.appointment_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {appointment.appointment_time}
                              </span>
                              {appointment.patient_phone && (
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {appointment.patient_phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {appointment.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {appointment.status === 'confirmed' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Complete
                              </Button>
                              
                              {appointment.is_video_call && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVideoCall(appointment.id)}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  <Video className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setAppointmentNotes(appointment.notes || '');
                              setIsNotesOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {appointment.chief_complaint && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <p className="text-blue-800">
                          <strong>Chief Complaint:</strong> {appointment.chief_complaint}
                        </p>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <p className="text-gray-700">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Calendar view coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View complete appointment information
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient Name</Label>
                  <p className="text-lg">{selectedAppointment.patient_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p>{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <p>{selectedAppointment.appointment_time}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Appointment Type</Label>
                <p>{selectedAppointment.appointment_type}</p>
              </div>

              {selectedAppointment.chief_complaint && (
                <div>
                  <Label className="text-sm font-medium">Chief Complaint</Label>
                  <p className="p-3 bg-blue-50 rounded">{selectedAppointment.chief_complaint}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium">Doctor Notes</Label>
                  <p className="p-3 bg-gray-50 rounded">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add/Edit Appointment Notes</DialogTitle>
            <DialogDescription>
              Add or update notes for this appointment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Appointment Notes</Label>
              <Textarea
                id="notes"
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                placeholder="Enter appointment notes, observations, or follow-up instructions..."
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNotesOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedAppointment && handleAddNotes(selectedAppointment.id, appointmentNotes)}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Information Modal */}
      <PatientInfoModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        patient={selectedPatient}
      />

      {/* Doctor Information Modal */}
      <DoctorInfoModal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        doctor={selectedDoctor}
      />
    </div>
  );
};

export default DoctorAppointmentManagement;