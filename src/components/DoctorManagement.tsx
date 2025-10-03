import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  UserPlus, 
  Clock, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Badge,
  Search,
  Filter,
  FileText,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge as UIBadge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import StaffManagementService, { StaffDoctor } from '@/services/staffDatabaseService';

interface DoctorManagementProps {
  doctors?: StaffDoctor[];
  onRefresh?: () => void;
}

const DoctorManagement: React.FC<DoctorManagementProps> = ({ 
  doctors: propDoctors,
  onRefresh 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [doctors, setDoctors] = useState<StaffDoctor[]>(propDoctors || []);
  const [loading, setLoading] = useState(!propDoctors);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<StaffDoctor | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);

  // Form state for adding/editing doctors
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    license_number: '',
    years_of_experience: '',
    consultation_fee: '',
    room_number: '',
    availability_status: 'available' as const,
    bio: '',
    qualifications: ''
  });

  // Load doctors if not provided via props
  useEffect(() => {
    if (!propDoctors) {
      loadDoctors();
    }

    // Set up realtime subscription for doctors
    const doctorSubscription = StaffManagementService.subscribeToDoctors((payload) => {
      console.log('Real-time doctor update:', payload);
      
      // Reload doctors when changes occur
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
        loadDoctors();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      StaffManagementService.unsubscribe(doctorSubscription);
    };
  }, [propDoctors]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await StaffManagementService.getAllDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load doctors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorSchedules = async (doctorId: string) => {
    try {
      const schedules = await StaffManagementService.getDoctorSchedules(doctorId);
      setDoctorSchedules(schedules);
    } catch (error) {
      console.error('Error loading doctor schedules:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load doctor schedules.",
        variant: "destructive"
      });
    }
  };

  // Handler functions
  const handleViewSchedule = async (doctor: StaffDoctor) => {
    setSelectedDoctor(doctor);
    setShowScheduleDialog(true);
    await loadDoctorSchedules(doctor.id);
  };

  const handleEditDoctor = (doctor: StaffDoctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.users?.name || '',
      email: doctor.users?.email || '',
      phone: doctor.users?.phone || '',
      specialty: doctor.specialty || '',
      license_number: doctor.license_number || '',
      years_of_experience: doctor.years_of_experience?.toString() || '',
      consultation_fee: doctor.consultation_fee?.toString() || '',
      room_number: doctor.room_number || '',
      availability_status: doctor.availability_status || 'available',
      bio: doctor.bio || '',
      qualifications: doctor.qualifications || ''
    });
    setShowEditDialog(true);
  };

  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      license_number: '',
      years_of_experience: '',
      consultation_fee: '',
      room_number: '',
      availability_status: 'available',
      bio: '',
      qualifications: ''
    });
    setShowAddDialog(true);
  };

  const saveDoctor = async () => {
    try {
      // Validation
      if (!formData.name || !formData.email || !formData.specialty) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (name, email, specialty).",
          variant: "destructive"
        });
        return;
      }

      let success = false;
      if (selectedDoctor) {
        // Update existing doctor
        success = await StaffManagementService.updateDoctor(selectedDoctor.id, {
          specialty: formData.specialty,
          license_number: formData.license_number,
          years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : undefined,
          consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined,
          room_number: formData.room_number,
          availability_status: formData.availability_status,
          bio: formData.bio,
          qualifications: formData.qualifications
        });
      } else {
        // Add new doctor
        success = await StaffManagementService.addDoctor({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialty: formData.specialty,
          license_number: formData.license_number,
          years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : undefined,
          consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined,
          room_number: formData.room_number,
          availability_status: formData.availability_status,
          bio: formData.bio,
          qualifications: formData.qualifications
        });
      }

      if (success) {
        toast({
          title: "Success",
          description: `Doctor ${selectedDoctor ? 'updated' : 'added'} successfully.`,
        });
        
        // Reload doctors
        await loadDoctors();
        if (onRefresh) onRefresh();

        // Close dialogs
        setShowAddDialog(false);
        setShowEditDialog(false);
      } else {
        throw new Error(`Failed to ${selectedDoctor ? 'update' : 'add'} doctor`);
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast({
        title: "Save Failed",
        description: `Failed to ${selectedDoctor ? 'update' : 'add'} doctor. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const suggestScheduleUpdate = async (doctorId: string, suggestion: string) => {
    try {
      const success = await StaffManagementService.suggestScheduleUpdate(doctorId, {
        available_date: new Date().toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "17:00",
        reason: suggestion
      });
      if (success) {
        toast({
          title: "Success",
          description: "Schedule update suggestion sent to doctor.",
        });
      }
    } catch (error) {
      console.error('Error sending schedule suggestion:', error);
      toast({
        title: "Failed",
        description: "Failed to send schedule suggestion.",
        variant: "destructive"
      });
    }
  };

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = !searchTerm || 
      doctor.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.license_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = specialtyFilter === 'all' || 
      doctor.specialty?.toLowerCase() === specialtyFilter.toLowerCase();

    const matchesAvailability = availabilityFilter === 'all' || 
      doctor.availability_status === availabilityFilter;

    return matchesSearch && matchesSpecialty && matchesAvailability;
  });

  // Get unique specialties for filter
  const specialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'busy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Stethoscope className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2 text-lg">Loading doctors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Doctor Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
          <p className="text-gray-600">Manage doctor profiles, schedules, and availability</p>
        </div>
        <Button onClick={handleAddDoctor} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Doctor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Search Doctors</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name, specialty, or license..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Label>Specialty</Label>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty || ''}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label>Availability</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="break">On Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span>Doctors ({filteredDoctors.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {doctor.users?.name?.split(' ').map(n => n[0]).join('') || 'D'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doctor.users?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{doctor.users?.email}</p>
                          {doctor.users?.phone && (
                            <p className="text-xs text-gray-400 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {doctor.users.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-600">{doctor.specialty || 'General'}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-mono text-sm">
                      {doctor.license_number || 'N/A'}
                    </TableCell>
                    
                    <TableCell>
                      {doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'N/A'}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{doctor.room_number || 'Not assigned'}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <UIBadge className={getAvailabilityColor(doctor.availability_status || 'available')}>
                        {(doctor.availability_status || 'available').charAt(0).toUpperCase() + 
                         (doctor.availability_status || 'available').slice(1)}
                      </UIBadge>
                    </TableCell>
                    
                    <TableCell className="font-semibold">
                      {doctor.consultation_fee ? `₱${doctor.consultation_fee}` : 'Not set'}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewSchedule(doctor)}
                          className="hover:bg-blue-50"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditDoctor(doctor)}
                          className="hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || specialtyFilter !== 'all' || availabilityFilter !== 'all' 
                    ? 'No doctors match your search criteria.' 
                    : 'No doctors found.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Doctor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>
              Create a new doctor profile in the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Dr. John Smith"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john.smith@hospital.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+63 912 345 6789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-specialty">Specialty *</Label>
              <Input
                id="add-specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                placeholder="Cardiology"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-license">License Number</Label>
              <Input
                id="add-license"
                value={formData.license_number}
                onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                placeholder="PRC-12345678"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-experience">Years of Experience</Label>
              <Input
                id="add-experience"
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({...formData, years_of_experience: e.target.value})}
                placeholder="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-fee">Consultation Fee (₱)</Label>
              <Input
                id="add-fee"
                type="number"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({...formData, consultation_fee: e.target.value})}
                placeholder="1500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-room">Room Number</Label>
              <Input
                id="add-room"
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                placeholder="Room 201"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="add-qualifications">Qualifications</Label>
              <Textarea
                id="add-qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                placeholder="MD, Fellowship in Cardiology, Board Certified..."
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="add-bio">Bio</Label>
              <Textarea
                id="add-bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Dr. Smith is an experienced cardiologist..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveDoctor}>
              <Save className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Doctor Profile</DialogTitle>
            <DialogDescription>
              Update doctor information and settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Name cannot be changed here</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-specialty">Specialty *</Label>
              <Input
                id="edit-specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                placeholder="Cardiology"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-license">License Number</Label>
              <Input
                id="edit-license"
                value={formData.license_number}
                onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                placeholder="PRC-12345678"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Years of Experience</Label>
              <Input
                id="edit-experience"
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({...formData, years_of_experience: e.target.value})}
                placeholder="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-fee">Consultation Fee (₱)</Label>
              <Input
                id="edit-fee"
                type="number"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({...formData, consultation_fee: e.target.value})}
                placeholder="1500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-room">Room Number</Label>
              <Input
                id="edit-room"
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                placeholder="Room 201"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-availability">Availability Status</Label>
              <Select value={formData.availability_status} onValueChange={(value) => setFormData({...formData, availability_status: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="break">On Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-qualifications">Qualifications</Label>
              <Textarea
                id="edit-qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                placeholder="MD, Fellowship in Cardiology, Board Certified..."
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Dr. Smith is an experienced cardiologist..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveDoctor}>
              <Save className="h-4 w-4 mr-2" />
              Update Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctor Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Doctor Schedule - {selectedDoctor?.users?.name}</DialogTitle>
            <DialogDescription>
              View and manage doctor availability and appointments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {doctorSchedules.length > 0 ? (
              <div className="space-y-4">
                {doctorSchedules.map((schedule, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{schedule.day_of_week}</p>
                        <p className="text-sm text-gray-600">
                          {schedule.start_time} - {schedule.end_time}
                        </p>
                        {schedule.break_start && schedule.break_end && (
                          <p className="text-xs text-orange-600">
                            Break: {schedule.break_start} - {schedule.break_end}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => suggestScheduleUpdate(selectedDoctor?.id || '', `Suggest update for ${schedule.day_of_week}`)}
                      >
                        Suggest Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No schedule information available.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowScheduleDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorManagement;