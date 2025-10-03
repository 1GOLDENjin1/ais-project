import Navigation from "@/components/Navigation";
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db/supabase-service";

const ProfileEdit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [loading, setLoading] = useState(false);

  // User data
  const [personalData, setPersonalData] = useState({
    name: '',
    phone: '',
  });

  // Patient data
  const [medicalData, setMedicalData] = useState({
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: '',
    allergies: '',
    medical_history: '',
    insurance_provider: '',
    insurance_number: '',
  });

  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      if (!user) return;

      // Load user data
      setPersonalData({
        name: user.name || '',
        phone: user.phone || '',
      });

      // Load patient data if user is a patient
      if (user.role === 'patient') {
        const patientData = await db.getPatientByUserId(user.id);
        if (patientData) {
          setPatient(patientData);
          setMedicalData({
            date_of_birth: patientData.date_of_birth || '',
            gender: (patientData.gender as 'male' | 'female' | 'other') || 'male',
            address: patientData.address || '',
            emergency_contact_name: patientData.emergency_contact_name || '',
            emergency_contact_phone: patientData.emergency_contact_phone || '',
            blood_type: patientData.blood_type || '',
            allergies: patientData.allergies || '',
            medical_history: patientData.medical_history || '',
            insurance_provider: patientData.insurance_provider || '',
            insurance_number: patientData.insurance_number || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    }
  };

  const handleSavePersonal = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await db.updateUser(user.id, personalData);
      setIsEditingPersonal(false);
      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
    } catch (error) {
      console.error('Error updating personal data:', error);
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedical = async () => {
    if (!user || !patient) return;

    setLoading(true);
    try {
      await db.updatePatient(patient.id, medicalData);
      setIsEditingMedical(false);
      toast({
        title: "Success",
        description: "Medical information updated successfully",
      });
    } catch (error) {
      console.error('Error updating medical data:', error);
      toast({
        title: "Error",
        description: "Failed to update medical information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">Update your personal and medical information</p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personal Information
                {!isEditingPersonal ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingPersonal(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingPersonal(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSavePersonal} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{user.name}</h3>
                  <p className="text-muted-foreground">Role: {user.role}</p>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditingPersonal ? (
                    <Input
                      id="name"
                      value={personalData.name}
                      onChange={(e) => setPersonalData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-primary" />
                      <p className="font-medium">{personalData.name}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <p className="font-medium text-muted-foreground">{user.email} (readonly)</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditingPersonal ? (
                    <Input
                      id="phone"
                      value={personalData.phone}
                      onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary" />
                      <p className="font-medium">{personalData.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information - only for patients */}
          {user.role === 'patient' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Medical Information
                  {!isEditingMedical ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingMedical(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingMedical(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveMedical} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    {isEditingMedical ? (
                      <Input
                        id="dob"
                        type="date"
                        value={medicalData.date_of_birth}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="font-medium">{medicalData.date_of_birth || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    {isEditingMedical ? (
                      <Select value={medicalData.gender} onValueChange={(value: 'male' | 'female' | 'other') => 
                        setMedicalData(prev => ({ ...prev, gender: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{medicalData.gender || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blood_type">Blood Type</Label>
                    {isEditingMedical ? (
                      <Input
                        id="blood_type"
                        value={medicalData.blood_type}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, blood_type: e.target.value }))}
                        placeholder="e.g., O+, A-, B+"
                      />
                    ) : (
                      <p className="font-medium">{medicalData.blood_type || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    {isEditingMedical ? (
                      <Input
                        id="emergency_contact_name"
                        value={medicalData.emergency_contact_name}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                        placeholder="Contact person's name"
                      />
                    ) : (
                      <p className="font-medium">{medicalData.emergency_contact_name || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    {isEditingMedical ? (
                      <Input
                        id="emergency_contact_phone"
                        value={medicalData.emergency_contact_phone}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                        placeholder="Contact person's phone number"
                      />
                    ) : (
                      <p className="font-medium">{medicalData.emergency_contact_phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    {isEditingMedical ? (
                      <Textarea
                        id="address"
                        value={medicalData.address}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter your full address"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <p className="font-medium">{medicalData.address || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    {isEditingMedical ? (
                      <Textarea
                        id="allergies"
                        value={medicalData.allergies}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, allergies: e.target.value }))}
                        placeholder="List any allergies or write 'None'"
                      />
                    ) : (
                      <p className="font-medium">{medicalData.allergies || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="medical_history">Medical History</Label>
                    {isEditingMedical ? (
                      <Textarea
                        id="medical_history"
                        value={medicalData.medical_history}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, medical_history: e.target.value }))}
                        placeholder="Describe your medical history"
                      />
                    ) : (
                      <p className="font-medium">{medicalData.medical_history || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_provider">Insurance Provider</Label>
                    {isEditingMedical ? (
                      <Input
                        id="insurance_provider"
                        value={medicalData.insurance_provider}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, insurance_provider: e.target.value }))}
                        placeholder="Insurance company name"
                      />
                    ) : (
                      <p className="font-medium">{medicalData.insurance_provider || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_number">Insurance Number</Label>
                    {isEditingMedical ? (
                      <Input
                        id="insurance_number"
                        value={medicalData.insurance_number}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, insurance_number: e.target.value }))}
                        placeholder="Insurance policy number"
                      />
                    ) : (
                      <p className="font-medium">{medicalData.insurance_number || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfileEdit;