// Database seeding utility to create test users for all roles
import { db } from './supabase-service';
import bcrypt from 'bcryptjs';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'doctor' | 'staff' | 'patient' | 'admin';
  phone?: string;
  additionalData?: any;
}

// Test users for each role
export const testUsers: TestUser[] = [
  // Doctors
  {
    email: 'doctor1@mendoza-clinic.com',
    password: 'password123',
    name: 'Dr. Maria Santos',
    role: 'doctor',
    phone: '+63-917-555-0101',
    additionalData: {
      specialty: 'Cardiology',
      license_number: 'MD-12345',
      years_experience: 15,
      education: 'University of the Philippines College of Medicine',
      consultation_fee: 2500,
      rating: 4.8,
      total_ratings: 120
    }
  },
  {
    email: 'doctor2@mendoza-clinic.com',
    password: 'password123',
    name: 'Dr. Juan Rodriguez',
    role: 'doctor',
    phone: '+63-917-555-0102',
    additionalData: {
      specialty: 'Dermatology',
      license_number: 'MD-12346',
      years_experience: 8,
      education: 'Ateneo School of Medicine',
      consultation_fee: 2000,
      rating: 4.6,
      total_ratings: 85
    }
  },
  {
    email: 'doctor3@mendoza-clinic.com',
    password: 'password123',
    name: 'Dr. Ana Reyes',
    role: 'doctor',
    phone: '+63-917-555-0103',
    additionalData: {
      specialty: 'Pediatrics',
      license_number: 'MD-12347',
      years_experience: 12,
      education: 'University of Santo Tomas Faculty of Medicine',
      consultation_fee: 2200,
      rating: 4.9,
      total_ratings: 200
    }
  },

  // Staff Members
  {
    email: 'nurse1@mendoza-clinic.com',
    password: 'password123',
    name: 'Nurse Carmen Lopez',
    role: 'staff',
    phone: '+63-917-555-0201',
    additionalData: {
      department: 'Nursing',
      position: 'Head Nurse',
      employee_id: 'NUR-001',
      hire_date: '2020-03-15',
      shift_schedule: 'Day Shift (8AM-5PM)'
    }
  },
  {
    email: 'lab-tech@mendoza-clinic.com',
    password: 'password123',
    name: 'Miguel Torres',
    role: 'staff',
    phone: '+63-917-555-0202',
    additionalData: {
      department: 'Laboratory',
      position: 'Lab Technician',
      employee_id: 'LAB-001',
      hire_date: '2019-08-20',
      shift_schedule: 'Day Shift (7AM-4PM)'
    }
  },
  {
    email: 'receptionist@mendoza-clinic.com',
    password: 'password123',
    name: 'Sofia Gonzales',
    role: 'staff',
    phone: '+63-917-555-0203',
    additionalData: {
      department: 'Administration',
      position: 'Receptionist',
      employee_id: 'ADM-001',
      hire_date: '2021-01-10',
      shift_schedule: 'Day Shift (8AM-5PM)'
    }
  },

  // Patients
  {
    email: 'patient1@test.com',
    password: 'password123',
    name: 'Juan Dela Cruz',
    role: 'patient',
    phone: '+63-917-555-0301',
    additionalData: {
      date_of_birth: '1985-05-15',
      gender: 'male',
      address: '123 Rizal Street, Manila, Philippines',
      emergency_contact_name: 'Maria Dela Cruz',
      emergency_contact_phone: '+63-917-555-0401',
      blood_type: 'O+',
      allergies: 'None known'
    }
  },
  {
    email: 'patient2@test.com',
    password: 'password123',
    name: 'Maria Clara Santos',
    role: 'patient',
    phone: '+63-917-555-0302',
    additionalData: {
      date_of_birth: '1990-08-22',
      gender: 'female',
      address: '456 Bonifacio Avenue, Quezon City, Philippines',
      emergency_contact_name: 'Jose Santos',
      emergency_contact_phone: '+63-917-555-0402',
      blood_type: 'A+',
      allergies: 'Penicillin'
    }
  },
  {
    email: 'patient3@test.com',
    password: 'password123',
    name: 'Roberto Fernandez',
    role: 'patient',
    phone: '+63-917-555-0303',
    additionalData: {
      date_of_birth: '1978-12-03',
      gender: 'male',
      address: '789 Aguinaldo Street, Makati City, Philippines',
      emergency_contact_name: 'Carmen Fernandez',
      emergency_contact_phone: '+63-917-555-0403',
      blood_type: 'B+',
      allergies: 'Shellfish, Peanuts'
    }
  },

  // Admin
  {
    email: 'admin@mendoza-clinic.com',
    password: 'password123',
    name: 'Carlos Mendoza',
    role: 'admin',
    phone: '+63-917-555-0100',
  }
];

export class DatabaseSeeder {
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async checkUserExists(email: string): Promise<boolean> {
    try {
      const user = await db.getUserByEmail(email);
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async createUser(testUser: TestUser): Promise<any> {
    try {
      console.log(`Creating user: ${testUser.name} (${testUser.role})`);
      
      // Hash password
      const password_hash = await this.hashPassword(testUser.password);
      
      // Create user
      const user = await db.createUser({
        email: testUser.email,
        password: password_hash, // Use 'password' instead of 'password_hash'
        role: testUser.role,
        name: testUser.name,
        phone: testUser.phone
      });

      if (!user) {
        throw new Error(`Failed to create user: ${testUser.email}`);
      }

      console.log(`✅ Created user: ${user.name} (${user.role})`);

      // Create role-specific profiles
      if (testUser.role === 'doctor' && testUser.additionalData) {
        await db.createDoctor({
          user_id: user.id,
          ...testUser.additionalData
        });
        console.log(`✅ Created doctor profile for ${user.name}`);
      }

      if (testUser.role === 'staff' && testUser.additionalData) {
        await db.createStaff({
          user_id: user.id,
          ...testUser.additionalData
        });
        console.log(`✅ Created staff profile for ${user.name}`);
      }

      if (testUser.role === 'patient' && testUser.additionalData) {
        await db.createPatient({
          user_id: user.id,
          ...testUser.additionalData
        });
        console.log(`✅ Created patient profile for ${user.name}`);
      }

      return user;
    } catch (error) {
      console.error(`❌ Error creating user ${testUser.email}:`, error);
      throw error;
    }
  }

  async seedAllUsers(): Promise<void> {
    console.log('🌱 Starting database seeding...');
    
    let created = 0;
    let skipped = 0;

    for (const testUser of testUsers) {
      try {
        const exists = await this.checkUserExists(testUser.email);
        if (exists) {
          console.log(`⏭️  User ${testUser.email} already exists, skipping...`);
          skipped++;
          continue;
        }

        await this.createUser(testUser);
        created++;
      } catch (error) {
        console.error(`❌ Failed to create user ${testUser.email}:`, error);
      }
    }

    console.log(`\n🎉 Database seeding completed!`);
    console.log(`✅ Created: ${created} users`);
    console.log(`⏭️  Skipped: ${skipped} existing users`);
    console.log(`📊 Total test users: ${testUsers.length}`);
  }

  async checkAllRoles(): Promise<void> {
    console.log('\n🔍 Checking users by role:');
    
    const roles = ['doctor', 'staff', 'patient', 'admin'] as const;
    
    for (const role of roles) {
      try {
        // This would need a new method in the service
        const users = await db.getUsersByRole(role);
        console.log(`👥 ${role.toUpperCase()}: ${users.length} users found`);
        
        if (users.length > 0) {
          users.forEach(user => {
            console.log(`   - ${user.name} (${user.email})`);
          });
        }
      } catch (error) {
        console.log(`❌ Error checking ${role} users:`, error);
      }
    }
  }
}

// Export singleton instance
export const seeder = new DatabaseSeeder();

// Utility function to run seeding
export const runSeeding = async () => {
  try {
    await seeder.seedAllUsers();
    await seeder.checkAllRoles();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};