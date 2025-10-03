import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rlsDataService } from '@/lib/rls-data-service';
import { db } from '@/lib/db';
import { User, UserCheck, UserPlus, AlertCircle } from 'lucide-react';

interface UserWithProfile {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'staff' | 'patient' | 'admin';
  phone?: string;
  profile?: any;
}

export const SystemUsersDisplay: React.FC = () => {
  const [users, setUsers] = useState<{
    doctors: UserWithProfile[];
    staff: UserWithProfile[];
    patients: UserWithProfile[];
    admin: UserWithProfile[];
  }>({
    doctors: [],
    staff: [],
    patients: [],
    admin: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      
      // Load users by role
      const [doctors, staff, patients, admin] = await Promise.all([
        db.getUsersByRole('doctor'),
        db.getUsersByRole('staff'), 
        db.getUsersByRole('patient'),
        db.getUsersByRole('admin')
      ]);

      // Load detailed profiles for doctors
      const doctorsWithProfiles = await Promise.all(
        doctors.map(async (user) => {
          const doctorProfile = await db.getDoctorByUserId(user.id);
          return { ...user, profile: doctorProfile };
        })
      );

      // Load detailed profiles for staff
      const staffWithProfiles = await Promise.all(
        staff.map(async (user) => {
          const staffProfile = await db.getStaffByUserId(user.id);
          return { ...user, profile: staffProfile };
        })
      );

      // Load detailed profiles for patients
      const patientsWithProfiles = await Promise.all(
        patients.map(async (user) => {
          const patientProfile = await db.getPatientByUserId(user.id);
          return { ...user, profile: patientProfile };
        })
      );

      setUsers({
        doctors: doctorsWithProfiles,
        staff: staffWithProfiles,
        patients: patientsWithProfiles,
        admin: admin
      });
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const UserCard: React.FC<{ user: UserWithProfile }> = ({ user }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{user.name}</CardTitle>
          <Badge variant={
            user.role === 'doctor' ? 'default' :
            user.role === 'staff' ? 'secondary' :
            user.role === 'patient' ? 'outline' : 'destructive'
          }>
            {user.role.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {user.phone && (
            <p className="text-sm text-muted-foreground">📞 {user.phone}</p>
          )}
          
          {user.role === 'doctor' && user.profile && (
            <div className="space-y-1">
              <p className="text-sm"><strong>Specialty:</strong> {user.profile.specialty}</p>
              <p className="text-sm"><strong>Fee:</strong> ₱{user.profile.consultation_fee?.toLocaleString()}</p>
              <p className="text-sm"><strong>Rating:</strong> ⭐ {user.profile.rating}/5.0</p>
              {user.profile.license_number && (
                <p className="text-sm"><strong>License:</strong> {user.profile.license_number}</p>
              )}
            </div>
          )}
          
          {user.role === 'staff' && user.profile && (
            <div className="space-y-1">
              <p className="text-sm"><strong>Position:</strong> {user.profile.position}</p>
              <p className="text-sm"><strong>Department:</strong> {user.profile.department}</p>
              {user.profile.hire_date && (
                <p className="text-sm"><strong>Hire Date:</strong> {new Date(user.profile.hire_date).toLocaleDateString()}</p>
              )}
            </div>
          )}
          
          {user.role === 'patient' && user.profile && (
            <div className="space-y-1">
              {user.profile.date_of_birth && (
                <p className="text-sm"><strong>DOB:</strong> {new Date(user.profile.date_of_birth).toLocaleDateString()}</p>
              )}
              {user.profile.gender && (
                <p className="text-sm"><strong>Gender:</strong> {user.profile.gender}</p>
              )}
              {user.profile.blood_type && (
                <p className="text-sm"><strong>Blood Type:</strong> {user.profile.blood_type}</p>
              )}
              {user.profile.insurance_provider && (
                <p className="text-sm"><strong>Insurance:</strong> {user.profile.insurance_provider}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <User className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading system users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button onClick={loadAllUsers} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = users.doctors.length + users.staff.length + users.patients.length + users.admin.length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Users</h1>
        <p className="text-muted-foreground">
          Overview of all users in the healthcare management system ({totalUsers} total users)
        </p>
      </div>

      <Tabs defaultValue="doctors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="doctors" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Doctors ({users.doctors.length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Staff ({users.staff.length})
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Patients ({users.patients.length})
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Admin ({users.admin.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.doctors.length > 0 ? (
              users.doctors.map(user => <UserCard key={user.id} user={user} />)
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No doctors found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run the database seeder to create test doctor accounts
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.staff.length > 0 ? (
              users.staff.map(user => <UserCard key={user.id} user={user} />)
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No staff members found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run the database seeder to create test staff accounts
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="patients" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.patients.length > 0 ? (
              users.patients.map(user => <UserCard key={user.id} user={user} />)
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No patients found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run the database seeder to create test patient accounts
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.admin.length > 0 ? (
              users.admin.map(user => <UserCard key={user.id} user={user} />)
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No admin users found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run the database seeder to create test admin accounts
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Test Credentials
          </CardTitle>
          <CardDescription>
            Use these credentials to test the appointment booking system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Default Test Accounts:</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>Doctor:</strong> doctor@mendoza-clinic.com / password123</li>
                <li><strong>Staff:</strong> staff@mendoza-clinic.com / password123</li>
                <li><strong>Patient:</strong> patient@test.com / password123</li>
                <li><strong>Custom Patient:</strong> paenggineda471+1@gmail.com / qwertyu</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Testing Flow:</h4>
              <ol className="space-y-1 text-sm">
                <li>1. Login as patient to book appointments</li>
                <li>2. Select doctor from dropdown</li>
                <li>3. Fill appointment form completely</li>
                <li>4. Login as doctor to view appointments</li>
                <li>5. Login as staff to manage scheduling</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemUsersDisplay;