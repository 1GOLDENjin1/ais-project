import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock, 
  User, 
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Bell,
  DollarSign,
  MapPin,
  Video,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AppointmentService } from '@/services/databaseService';
import StaffManagementService, { type Doctor } from '@/services/staffDatabaseService';

interface Appointment {
  id: string;
  patient_name?: string;
  service?: string;
  date?: string;
  time?: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  patient_phone?: string;
  patient_email?: string;
  notes?: string;
  patient_id?: string;
  doctor_id?: string;
  fee?: number;
  // Additional fields for StaffAppointment compatibility
  service_type?: string;
  appointment_date?: string;
  appointment_time?: string;
  consultation_type?: string;
  duration_minutes?: number;
  patient?: {
    id: string;
    users?: {
      name: string;
      email: string;
      phone?: string;
    };
  };
}

interface AppointmentForm {
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  service: string;
  date: string;
  time: string;
  consultation_type: 'in-person' | 'video-call' | 'phone';
  fee: number;
  notes: string;
  doctor_id: string;
}

const ManageAppointment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();
  
  // Get appointment ID from URL params, navigation state, or appointment data
  const appointmentId = params.appointmentId || location.state?.appointmentId || location.state?.appointment?.id;
  const appointmentData = location.state?.appointment as Appointment | undefined;
  const isEditing = !!(appointmentId || appointmentData);
  
  // Form states
  const [form, setForm] = useState<AppointmentForm>({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    consultation_type: 'in-person',
    fee: 150,
    notes: '',
    doctor_id: ''
  });
  
  // Loading states
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState<'pending' | 'confirmed' | 'cancelled' | 'completed'>('pending');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Available time slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sample data
  const services = [
    'General Consultation',
    'Dental Cleaning',
    'Physical Therapy',
    'Cardiology Consultation',
    'Dermatology Consultation',
    'Pediatric Checkup',
    'Orthopedic Consultation',
    'Mental Health Counseling',
    'Nutrition Consultation',
    'X-Ray Examination'
  ];

  // Fetch appointment data if editing
  useEffect(() => {
    const fetchAppointmentData = async () => {
      console.log('useEffect triggered:', { appointmentId, appointmentData });
      
      if (appointmentId) {
        // Always fetch from database if we have an ID
        setLoadingAppointment(true);
        try {
          const { appointment, error } = await AppointmentService.getAppointmentById(appointmentId);
          
          if (error) {
            toast({
              title: "Error",
              description: error,
              variant: "destructive"
            });
            navigate('/staff-dashboard');
            return;
          }
          
          if (appointment) {
            console.log('Received appointment data:', appointment);
            console.log('Patient data:', appointment.patients);
            console.log('Doctor data:', appointment.doctors);
            
            // Map database appointment to form structure
            setForm({
              patient_name: appointment.patients?.users?.name || '',
              patient_phone: appointment.patients?.users?.phone || '',
              patient_email: appointment.patients?.users?.email || '',
              service: appointment.service_type || '',
              date: appointment.appointment_date || '',
              time: appointment.appointment_time || '',
              consultation_type: appointment.consultation_type || 'in-person',
              fee: appointment.fee || 150,
              notes: appointment.notes || '',
              doctor_id: appointment.doctor_id || ''
            });
            
            // Set appointment status
            setAppointmentStatus(appointment.status || 'pending');
          }
        } catch (error) {
          console.error('Error fetching appointment:', error);
          toast({
            title: "Error",
            description: "Failed to load appointment data",
            variant: "destructive"
          });
        } finally {
          setLoadingAppointment(false);
        }
      } else if (appointmentData) {
        // Use data from navigation state if available (StaffAppointment structure)
        console.log('Using navigation state appointment data:', appointmentData);
        setForm({
          patient_name: appointmentData.patient?.users?.name || appointmentData.patient_name || '',
          patient_phone: appointmentData.patient?.users?.phone || appointmentData.patient_phone || '',
          patient_email: appointmentData.patient?.users?.email || appointmentData.patient_email || '',
          service: appointmentData.service_type || appointmentData.service || '',
          date: appointmentData.appointment_date || appointmentData.date || new Date().toISOString().split('T')[0],
          time: appointmentData.appointment_time || appointmentData.time || '09:00',
          consultation_type: (appointmentData.consultation_type as 'in-person' | 'video-call' | 'phone') || 'in-person',
          fee: appointmentData.fee || 150,
          notes: appointmentData.notes || '',
          doctor_id: appointmentData.doctor_id || ''
        });
        
        // Set appointment status
        setAppointmentStatus(appointmentData.status || 'pending');
      }
    };
    
    fetchAppointmentData();
  }, [appointmentId, appointmentData]);

  useEffect(() => {
    // Generate available time slots
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    setAvailableSlots(slots);
  }, []);

  // Fetch doctors from database
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsData = await StaffManagementService.getAllDoctors();
        console.log('Fetched doctors:', doctorsData);
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };

    fetchDoctors();
  }, []);

  const handleInputChange = (field: keyof AppointmentForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!form.patient_name.trim()) {
      newErrors.patient_name = 'Patient name is required';
    }

    if (!form.patient_phone.trim()) {
      newErrors.patient_phone = 'Phone number is required';
    }

    if (!form.patient_email.trim()) {
      newErrors.patient_email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.patient_email)) {
      newErrors.patient_email = 'Please enter a valid email address';
    }

    if (!form.service.trim()) {
      newErrors.service = 'Service selection is required';
    }

    if (!form.date) {
      newErrors.date = 'Appointment date is required';
    } else {
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Appointment date cannot be in the past';
      }
    }

    if (!form.time) {
      newErrors.time = 'Appointment time is required';
    }

    if (!form.doctor_id) {
      newErrors.doctor_id = 'Doctor selection is required';
    }

    if (form.fee <= 0) {
      newErrors.fee = 'Fee must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditing && appointmentId) {
        // Update existing appointment
        const updateData = {
          doctor_id: form.doctor_id,
          service_type: form.service,
          appointment_date: form.date,
          appointment_time: form.time,
          consultation_type: form.consultation_type,
          fee: form.fee,
          notes: form.notes
        };

        const { success, error } = await AppointmentService.updateAppointment(appointmentId, updateData);

        if (success) {
          toast({
            title: "Appointment Updated",
            description: `Appointment for ${form.patient_name} has been successfully updated.`,
          });

          navigate('/staff-dashboard', { 
            state: { 
              tab: 'appointments',
              message: 'Appointment updated successfully' 
            }
          });
        } else {
          throw new Error(error || 'Failed to update appointment');
        }
      } else {
        // Create new appointment
        const appointmentData = {
          patient_id: 'temp-patient-id', // This would need to be resolved from patient name
          doctor_id: form.doctor_id || 'temp-doctor-id',
          service_type: form.service,
          reason: form.notes,
          appointment_date: form.date,
          appointment_time: form.time,
          appointment_type: 'consultation',
          consultation_type: 'in-person',
          fee: form.fee,
          notes: form.notes
        };

        const appointmentId = await AppointmentService.createAppointment(appointmentData);

        if (appointmentId) {
          toast({
            title: "Appointment Created",
            description: `Appointment for ${form.patient_name} has been successfully created.`,
          });

          navigate('/staff-dashboard', { 
            state: { 
              tab: 'appointments',
              message: 'Appointment created successfully' 
            }
          });
        } else {
          throw new Error('Failed to create appointment');
        }
      }
    } catch (error) {
      console.error('Save appointment error:', error);
      toast({
        title: `Error ${isEditing ? 'Updating' : 'Creating'} Appointment`,
        description: error instanceof Error ? error.message : "Failed to save the appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    if (!appointmentId) return;

    setLoading(true);

    try {
      let success = false;
      
      if (newStatus === 'cancelled') {
        const reason = prompt("Please provide a reason for cancelling this appointment:");
        if (!reason || reason.trim() === '') {
          toast({
            title: "Cancellation Required",
            description: "A reason is required to cancel the appointment.",
            variant: "destructive"
          });
          return;
        }
        const result = await AppointmentService.cancel(appointmentId, reason);
        success = result.success;
      } else {
        // For confirmed and completed statuses
        success = await AppointmentService.updateAppointmentStatus(appointmentId, newStatus as any);
      }

      if (success) {
        toast({
          title: "Status Updated",
          description: `Appointment status has been changed to ${newStatus}.`,
        });

        navigate('/staff-dashboard', { 
          state: { 
            tab: 'appointments',
            message: 'Status updated successfully' 
          }
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: "Error Updating Status",
        description: error instanceof Error ? error.message : "Failed to update appointment status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!appointmentId) return;

    try {
      toast({
        title: "Reminder Sent",
        description: `Appointment reminder has been sent to ${form.patient_name}.`,
      });
    } catch (error) {
      toast({
        title: "Error Sending Reminder",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate('/staff-dashboard', { state: { tab: 'appointments' } });
  };

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

  // Show loading state while fetching appointment data
  if (loadingAppointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading appointment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {isEditing ? 'Manage Appointment' : 'Create New Appointment'}
              </h1>
              <p className="text-gray-600">
                {isEditing ? `Managing appointment for ${form.patient_name || 'undefined'}` : 'Schedule a new patient appointment'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            {isEditing && appointmentStatus === 'confirmed' && (
              <Button 
                variant="outline"
                onClick={handleSendReminder}
                disabled={loading}
                className="text-orange-600 hover:bg-orange-50"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Appointment' : 'Create Appointment'}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status and Actions (for editing) */}
          {isEditing && appointmentData && (
            <div className="lg:col-span-1">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Appointment Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Current Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(appointmentStatus)}>
                        {appointmentStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Appointment ID</Label>
                    <p className="text-sm text-gray-600 font-mono">{appointmentData.id}</p>
                  </div>
                  
                  {/* Status Update Actions */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-sm font-medium text-gray-700">Quick Actions</Label>
                    
                    {appointmentStatus === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusUpdate('confirmed')}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Appointment
                      </Button>
                    )}
                    
                    {appointmentStatus === 'confirmed' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    
                    {appointmentStatus !== 'cancelled' && appointmentStatus !== 'completed' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate('cancelled')}
                        disabled={loading}
                        className="w-full text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Appointment
                      </Button>
                    )}
                  </div>


                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Form */}
          <div className={`${isEditing ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {/* Patient Information */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Patient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Patient Name</Label>
                  <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                    {form.patient_name || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                    {form.patient_phone || 'Not specified'}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                    {form.patient_email || 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Appointment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Service</Label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                      {form.service || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="doctor_id">Attending Doctor *</Label>
                    <select 
                      id="doctor_id"
                      value={form.doctor_id}
                      onChange={(e) => handleInputChange('doctor_id', e.target.value)}
                      className={`w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.doctor_id ? 'border-red-500' : ''}`}
                    >
                      {!form.doctor_id && <option value="">Select a doctor...</option>}
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.users?.name || 'Unknown Doctor'} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                    {errors.doctor_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.doctor_id}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Appointment Date</Label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                      {form.date || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Appointment Time</Label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                      {form.time || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Consultation Type</Label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                      {form.consultation_type === 'in-person' ? 'In-Person Visit' : 
                       form.consultation_type === 'video-call' ? 'Video Call' : 
                       form.consultation_type === 'phone' ? 'Phone Consultation' : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Consultation Fee</Label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md border">
                      ₱{form.fee || '0.00'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes & Special Instructions</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions or notes for this appointment..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons for Mobile */}
        <div className="lg:hidden flex space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageAppointment;