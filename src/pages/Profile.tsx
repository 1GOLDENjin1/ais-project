import Navigation from "@/components/Navigation";
import { User, Mail, Phone, MapPin, Calendar, Edit, Receipt, Download, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  // Patient data
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  insurance_provider?: string;
  insurance_number?: string;
}

interface Appointment {
  id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  fee?: number;
  doctor?: {
    name: string;
    specialty: string;
  };
}

interface HealthMetric {
  id: string;
  metric_type: string;
  value: string;
  recorded_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadAppointments();
      loadHealthMetrics();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          patients (
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            blood_type,
            allergies,
            medical_history,
            insurance_provider,
            insurance_number
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const patientData = data.patients?.[0];
      const profile: UserProfile = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        created_at: data.created_at,
        date_of_birth: patientData?.date_of_birth,
        gender: patientData?.gender,
        address: patientData?.address,
        emergency_contact_name: patientData?.emergency_contact_name,
        emergency_contact_phone: patientData?.emergency_contact_phone,
        blood_type: patientData?.blood_type,
        allergies: patientData?.allergies,
        medical_history: patientData?.medical_history,
        insurance_provider: patientData?.insurance_provider,
        insurance_number: patientData?.insurance_number,
      };

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    }
  };

  const loadAppointments = async () => {
    if (!user?.id) return;

    try {
      // First get appointments for the patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError || !patientData) {
        console.error('No patient record found');
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          service_type,
          appointment_date,
          appointment_time,
          status,
          fee,
          doctor_id,
          doctors!appointments_doctor_id_fkey (
            specialty,
            users!doctors_user_id_fkey (
              name
            )
          )
        `)
        .eq('patient_id', patientData.id)
        .order('appointment_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedAppointments: Appointment[] = (data || []).map(apt => {
        const doctor = apt.doctors as any;
        return {
          id: apt.id,
          service_type: apt.service_type,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          status: apt.status,
          fee: apt.fee,
          doctor: {
            name: doctor?.users?.name || 'Unknown Doctor',
            specialty: doctor?.specialty || 'General Medicine'
          }
        };
      });

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadHealthMetrics = async () => {
    if (!user?.id) return;

    try {
      // Get patient ID first
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError || !patientData) {
        setHealthMetrics([]);
        return;
      }

      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setHealthMetrics(data || []);
    } catch (error) {
      console.error('Error loading health metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditFormData(userProfile || {});
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !editFormData) return;

    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: editFormData.name,
          phone: editFormData.phone
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Check if patient record exists
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const patientData = {
        date_of_birth: editFormData.date_of_birth,
        gender: editFormData.gender,
        address: editFormData.address,
        emergency_contact_name: editFormData.emergency_contact_name,
        emergency_contact_phone: editFormData.emergency_contact_phone,
        blood_type: editFormData.blood_type,
        allergies: editFormData.allergies,
        medical_history: editFormData.medical_history,
        insurance_provider: editFormData.insurance_provider,
        insurance_number: editFormData.insurance_number,
        updated_at: new Date().toISOString()
      };

      if (existingPatient) {
        // Update existing patient record
        const { error: patientError } = await supabase
          .from('patients')
          .update(patientData)
          .eq('user_id', user.id);

        if (patientError) throw patientError;
      } else {
        // Create new patient record
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            ...patientData
          });

        if (patientError) throw patientError;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
      loadUserProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEmergencyContact = async () => {
    if (!user?.id) return;

    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError) throw patientError;

      const { error } = await supabase
        .from('patients')
        .update({
          emergency_contact_name: editFormData.emergency_contact_name || userProfile?.emergency_contact_name,
          emergency_contact_phone: editFormData.emergency_contact_phone || userProfile?.emergency_contact_phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Emergency Contact Updated",
        description: "Emergency contact information has been updated.",
      });

      loadUserProfile();
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to update emergency contact.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = () => {
    toast({
      title: "Change Password",
      description: "Password change functionality will be available soon.",
    });
  };

  const handleDownloadMedicalRecords = async () => {
    toast({
      title: "Downloading Records",
      description: "Your medical records are being prepared for download.",
    });
    
    // In a real app, this would generate and download a PDF
    setTimeout(() => {
      toast({
        title: "Download Ready",
        description: "Medical records download completed.",
      });
    }, 2000);
  };

  const handlePrivacySettings = () => {
    toast({
      title: "Privacy Settings",
      description: "Privacy settings panel will be available soon.",
    });
  };

  const handleViewReceipt = (booking: any) => {
    setSelectedReceipt(booking);
    setShowReceipt(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getHealthMetricsDisplay = () => {
    const metricsMap = healthMetrics.reduce((acc, metric) => {
      acc[metric.metric_type] = metric.value;
      return acc;
    }, {} as Record<string, string>);

    return [
      { label: "Height", value: metricsMap.height || "Not recorded", icon: User },
      { label: "Weight", value: metricsMap.weight || "Not recorded", icon: User },
      { label: "Blood Pressure", value: metricsMap.blood_pressure || "Not recorded", icon: User },
      { label: "Heart Rate", value: metricsMap.heart_rate || "Not recorded", icon: User }
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">Unable to load your profile information.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and health data</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Personal Information
                  <Button variant="outline" size="sm" onClick={handleEditProfile}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" alt={userProfile.name} />
                    <AvatarFallback>{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{userProfile.name}</h3>
                    <p className="text-muted-foreground">Patient ID: {userProfile.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{userProfile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{userProfile.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{userProfile.address || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Birthdate</p>
                      <p className="font-medium">{userProfile.date_of_birth ? format(new Date(userProfile.date_of_birth), 'PPP') : 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {healthMetrics.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No health metrics recorded</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({
                        title: "Add Health Metrics",
                        description: "Health metrics tracking will be available soon through your doctor visits.",
                      })}
                    >
                      Add Metrics
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {getHealthMetricsDisplay().map((metric, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <metric.icon className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                          <p className="font-semibold">{metric.value}</p>
                        </div>
                      </div>
                    ))}
                    <div className="col-span-full text-center pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast({
                          title: "Update Metrics",
                          description: "Health metrics are typically updated during medical appointments.",
                        })}
                      >
                        Update Metrics
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Booking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No appointments found</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{appointment.service_type}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Date: {format(new Date(appointment.appointment_date), 'PPP')} at {appointment.appointment_time}</p>
                            <p>Doctor: {appointment.doctor?.name}</p>
                            {appointment.fee && <p>Fee: ₱{appointment.fee}</p>}
                            <div className="flex items-center gap-2">
                              <Badge variant={appointment.status === 'confirmed' ? 'default' : appointment.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
                                {appointment.status}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {appointment.doctor?.specialty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(appointment)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 5 && (
                      <p className="text-center text-sm text-muted-foreground">
                        Showing latest 5 appointments
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">{format(new Date(userProfile.created_at), 'yyyy-MM-dd')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Blood Type</span>
                  <Badge variant="secondary">{userProfile.blood_type || 'O+'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {userProfile.emergency_contact_name && userProfile.emergency_contact_phone
                    ? `${userProfile.emergency_contact_name} - ${userProfile.emergency_contact_phone}`
                    : 'No emergency contact set'}
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleEditProfile}>
                  <Edit className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleChangePassword}>
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleDownloadMedicalRecords}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Medical Records
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handlePrivacySettings}>
                  Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your personal and medical information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-birthdate">Date of Birth</Label>
                  <Input
                    id="edit-birthdate"
                    type="date"
                    value={editFormData.date_of_birth || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select
                    value={editFormData.gender || ''}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-blood-type">Blood Type</Label>
                  <Select
                    value={editFormData.blood_type || ''}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, blood_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergency-name">Emergency Contact Name</Label>
                  <Input
                    id="edit-emergency-name"
                    value={editFormData.emergency_contact_name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergency-phone">Emergency Contact Phone</Label>
                  <Input
                    id="edit-emergency-phone"
                    value={editFormData.emergency_contact_phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-allergies">Allergies</Label>
                <Textarea
                  id="edit-allergies"
                  value={editFormData.allergies || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-medical-history">Medical History</Label>
                <Textarea
                  id="edit-medical-history"
                  value={editFormData.medical_history || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, medical_history: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Modal */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt
              </DialogTitle>
              <DialogDescription>
                Booking confirmation and payment details
              </DialogDescription>
            </DialogHeader>
            
            {selectedReceipt && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="font-semibold text-lg">HealthCare Clinic</h3>
                  <p className="text-sm text-muted-foreground">Official Receipt</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction ID:</span>
                    <span className="text-sm font-mono">{selectedReceipt.transactionId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date Booked:</span>
                    <span className="text-sm">{formatDate(selectedReceipt.bookingDate)}</span>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-medium mb-2">Service Details</h4>
                    <div className="flex justify-between">
                      <span className="text-sm">{selectedReceipt.serviceName}</span>
                      <span className="text-sm font-medium">{selectedReceipt.servicePrice}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-medium mb-2">Booking Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{selectedReceipt.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedReceipt.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{formatDate(selectedReceipt.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span>{formatTime(selectedReceipt.time)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-lg text-primary">{selectedReceipt.servicePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span>{selectedReceipt.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default" className="text-xs">Paid</Badge>
                    </div>
                  </div>

                  {selectedReceipt.notes && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-1">Notes:</h4>
                      <p className="text-sm text-muted-foreground">{selectedReceipt.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    onClick={() => setShowReceipt(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Profile;