import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Phone, Mail, User, Heart, Shield, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/services/auth-service';
import { db } from '@/lib/db';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  policyHolderName: string;
  policyHolderRelationship: string;
  copayAmount: string;
  deductibleAmount: string;
}

interface MedicalHistory {
  allergies: string[];
  currentMedications: string[];
  chronicConditions: string[];
  surgicalHistory: string[];
  familyMedicalHistory: string[];
  bloodType: string;
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  dietaryRestrictions: string[];
}

interface EnhancedPatientRegistrationData {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  
  // Medical History
  medicalHistory: MedicalHistory;
  
  // Emergency Contacts
  emergencyContacts: EmergencyContact[];
  
  // Insurance Information
  hasInsurance: boolean;
  insurance: InsuranceInfo;
  
  // Preferences
  preferredLanguage: string;
  communicationMethod: string;
  appointmentReminders: boolean;
}

interface EnhancedPatientRegistrationProps {
  onRegistrationSuccess: (user: any) => void;
  onSwitchToLogin: () => void;
}

export const EnhancedPatientRegistration: React.FC<EnhancedPatientRegistrationProps> = ({
  onRegistrationSuccess,
  onSwitchToLogin
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EnhancedPatientRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    medicalHistory: {
      allergies: [],
      currentMedications: [],
      chronicConditions: [],
      surgicalHistory: [],
      familyMedicalHistory: [],
      bloodType: '',
      smokingStatus: '',
      alcoholConsumption: '',
      exerciseFrequency: '',
      dietaryRestrictions: []
    },
    emergencyContacts: [{
      name: '',
      relationship: '',
      phone: '',
      email: '',
      isPrimary: true
    }],
    hasInsurance: false,
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      policyHolderName: '',
      policyHolderRelationship: '',
      copayAmount: '',
      deductibleAmount: ''
    },
    preferredLanguage: 'en',
    communicationMethod: 'sms',
    appointmentReminders: true
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newDietaryRestriction, setNewDietaryRestriction] = useState('');

  const steps = [
    { number: 1, title: 'Basic Information', icon: User },
    { number: 2, title: 'Medical History', icon: Heart },
    { number: 3, title: 'Emergency Contacts', icon: Phone },
    { number: 4, title: 'Insurance & Preferences', icon: Shield }
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || 
            !formData.password || !formData.phone || !formData.dateOfBirth) {
          toast({ title: "Please fill in all basic information fields", variant: "destructive" });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Passwords don't match", variant: "destructive" });
          return false;
        }
        break;
      case 2:
        // Medical history is optional but we should validate blood type if provided
        break;
      case 3:
        const primaryContact = formData.emergencyContacts.find(c => c.isPrimary);
        if (!primaryContact?.name || !primaryContact?.phone) {
          toast({ title: "Please provide at least one emergency contact with name and phone", variant: "destructive" });
          return false;
        }
        break;
      case 4:
        if (formData.hasInsurance && (!formData.insurance.provider || !formData.insurance.policyNumber)) {
          toast({ title: "Please complete insurance information or uncheck 'Has Insurance'", variant: "destructive" });
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addItem = (field: keyof MedicalHistory, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          [field]: [...(prev.medicalHistory[field] as string[]), value.trim()]
        }
      }));
      setter('');
    }
  };

  const removeItem = (field: keyof MedicalHistory, index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [field]: (prev.medicalHistory[field] as string[]).filter((_, i) => i !== index)
      }
    }));
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, {
        name: '',
        relationship: '',
        phone: '',
        email: '',
        isPrimary: false
      }]
    }));
  };

  const removeEmergencyContact = (index: number) => {
    if (formData.emergencyContacts.length > 1) {
      setFormData(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
      }));
    }
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: any) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);
    try {
      // Create user account
      const signupData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'patient' as const,
        profileData: {}
      };

      const authResponse = await authService.signup(signupData);
      if (!authResponse || !authResponse.user) {
        throw new Error('Registration failed');
      }

      // Create enhanced patient profile
      const patientData = {
        userId: authResponse.user.id,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        emergencyContactName: formData.emergencyContacts[0]?.name,
        emergencyContactPhone: formData.emergencyContacts[0]?.phone,
        bloodType: formData.medicalHistory.bloodType,
        allergies: formData.medicalHistory.allergies.join(', '),
        medicalHistory: [
          ...formData.medicalHistory.chronicConditions,
          ...formData.medicalHistory.surgicalHistory,
          ...formData.medicalHistory.familyMedicalHistory
        ].join('; '),
        insuranceProvider: formData.hasInsurance ? formData.insurance.provider : null,
        insuranceNumber: formData.hasInsurance ? formData.insurance.policyNumber : null
      };

      const patient = await db.createPatient(patientData);
      
      if (!patient) {
        throw new Error('Failed to create patient profile');
      }

      // Create notification preferences
      await db.createNotification({
        userId: authResponse.user.id,
        title: "Welcome to Mendoza Diagnostic Center!",
        message: "Your account has been created successfully. You can now book appointments and access our services.",
        type: 'general',
        priority: 'medium',
        isRead: false
      });

      toast({
        title: "Registration Successful! 🎉",
        description: "Your account has been created. You can now book appointments and access our services.",
      });

      onRegistrationSuccess(authResponse.user);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter your first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter your email address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Create a secure password"
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirm your password"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+63 9XX XXX XXXX"
          />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
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
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Enter your complete address"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Allergies</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="Add an allergy (e.g., Penicillin, Peanuts)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem('allergies', newAllergy, setNewAllergy);
              }
            }}
          />
          <Button
            type="button"
            onClick={() => addItem('allergies', newAllergy, setNewAllergy)}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.medicalHistory.allergies.map((allergy, index) => (
            <div key={index}>
              <Badge variant="secondary" className="flex items-center gap-1">
                {allergy}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem('allergies', index)}
                />
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">Current Medications</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            placeholder="Add a medication (e.g., Aspirin 81mg daily)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem('currentMedications', newMedication, setNewMedication);
              }
            }}
          />
          <Button
            type="button"
            onClick={() => addItem('currentMedications', newMedication, setNewMedication)}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.medicalHistory.currentMedications.map((medication, index) => (
            <div key={index}>
              <Badge variant="secondary" className="flex items-center gap-1">
                {medication}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem('currentMedications', index)}
                />
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">Chronic Conditions</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            placeholder="Add a condition (e.g., Diabetes, Hypertension)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem('chronicConditions', newCondition, setNewCondition);
              }
            }}
          />
          <Button
            type="button"
            onClick={() => addItem('chronicConditions', newCondition, setNewCondition)}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.medicalHistory.chronicConditions.map((condition, index) => (
            <div key={index}>
              <Badge variant="secondary" className="flex items-center gap-1">
                {condition}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem('chronicConditions', index)}
                />
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bloodType">Blood Type</Label>
          <Select onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            medicalHistory: { ...prev.medicalHistory, bloodType: value }
          }))}>
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
        <div>
          <Label htmlFor="smokingStatus">Smoking Status</Label>
          <Select onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            medicalHistory: { ...prev.medicalHistory, smokingStatus: value }
          }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select smoking status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="former">Former smoker</SelectItem>
              <SelectItem value="current">Current smoker</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Emergency Contacts</Label>
        <Button type="button" onClick={addEmergencyContact} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      </div>

      {formData.emergencyContacts.map((contact, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">
                Contact {index + 1} {contact.isPrimary && "(Primary)"}
              </CardTitle>
              {formData.emergencyContacts.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeEmergencyContact(index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={contact.name}
                  onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label>Relationship *</Label>
                <Input
                  value={contact.relationship}
                  onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={contact.phone}
                  onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={contact.email}
                  onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`primary-${index}`}
                checked={contact.isPrimary}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Make this contact primary and others non-primary
                    setFormData(prev => ({
                      ...prev,
                      emergencyContacts: prev.emergencyContacts.map((c, i) => ({
                        ...c,
                        isPrimary: i === index
                      }))
                    }));
                  }
                }}
              />
              <Label htmlFor={`primary-${index}`}>Primary emergency contact</Label>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="hasInsurance"
            checked={formData.hasInsurance}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasInsurance: !!checked }))}
          />
          <Label htmlFor="hasInsurance" className="text-base font-semibold">I have health insurance</Label>
        </div>

        {formData.hasInsurance && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Insurance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Insurance Provider *</Label>
                  <Input
                    value={formData.insurance.provider}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insurance: { ...prev.insurance, provider: e.target.value }
                    }))}
                    placeholder="e.g., PhilHealth, Maxicare"
                  />
                </div>
                <div>
                  <Label>Policy Number *</Label>
                  <Input
                    value={formData.insurance.policyNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insurance: { ...prev.insurance, policyNumber: e.target.value }
                    }))}
                    placeholder="Policy/Member number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Group Number</Label>
                  <Input
                    value={formData.insurance.groupNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insurance: { ...prev.insurance, groupNumber: e.target.value }
                    }))}
                    placeholder="Group number (if applicable)"
                  />
                </div>
                <div>
                  <Label>Policy Holder Relationship</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    insurance: { ...prev.insurance, policyHolderRelationship: value }
                  }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Relationship to policy holder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Communication Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preferred Communication Method</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, communicationMethod: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="How would you like to receive updates?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="appointmentReminders"
              checked={formData.appointmentReminders}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, appointmentReminders: !!checked }))}
            />
            <Label htmlFor="appointmentReminders">Send me appointment reminders</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Join Mendoza Diagnostic Center</h2>
          <p className="text-lg text-gray-600 mt-2">Complete your patient registration to get started</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                        isActive ? 'bg-blue-600 border-blue-600 text-white' : 
                        'bg-gray-200 border-gray-300 text-gray-500'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <Button onClick={prevStep} variant="outline">
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onSwitchToLogin} variant="ghost">
              Already have an account? Sign In
            </Button>
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Complete Registration'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};