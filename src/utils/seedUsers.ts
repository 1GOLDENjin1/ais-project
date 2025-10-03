import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { generateUUID } from '@/utils/browser-crypto';

export const seedTestUsers = async () => {
  console.log('🌱 Seeding test users with database authentication...');
  
  const testUsers = [
    // Doctors
    {
      email: 'doctor@mendoza-clinic.com',
      password: 'password123',
      role: 'doctor' as const,
      name: 'Dr. Maria Santos',
      phone: '+63-917-555-0101',
      specialty: 'Cardiology',
      consultation_fee: 2500
    },
    
    // Staff
    {
      email: 'staff@mendoza-clinic.com',
      password: 'password123',
      role: 'staff' as const,
      name: 'Ana Rodriguez',
      phone: '+63-917-555-0201'
    },
    
    // Patients
    {
      email: 'patient@test.com',
      password: 'password123',
      role: 'patient' as const,
      name: 'Juan Dela Cruz',
      phone: '+63-917-555-0301'
    },
    {
      email: 'paenggineda471@gmail.com',
      password: '123456',
      role: 'patient' as const,
      name: 'Rafael User',
      phone: '+63-917-555-0302'
    },
    {
      email: 'paenggineda471+1@gmail.com',
      password: 'qwertyu',
      role: 'patient' as const,
      name: 'Rafael User Alt',
      phone: '+63-917-555-0303'
    },
    
    // Admin
    {
      email: 'admin@mendoza-clinic.com',
      password: 'password123',
      role: 'admin' as const,
      name: 'Carlos Mendoza',
      phone: '+63-917-555-0401'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const testUser of testUsers) {
    try {
      console.log(`Creating ${testUser.role}: ${testUser.name}...`);
      
      // Check if user already exists in database (handle 406 error properly)
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', testUser.email);

      if (existingUsers && existingUsers.length > 0) {
        console.log(`⚠️ User ${testUser.email} already exists in database, skipping...`);
        continue;
      }
      
      // Generate UUID for the user
      const userId = generateUUID();
      console.log(`  🆔 Generated user ID: ${userId}`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      console.log(`  🔒 Password hashed`);

      // Create user profile in database
      console.log(`  👤 Creating user profile...`);
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: testUser.name,
          email: testUser.email,
          phone: testUser.phone,
          role: testUser.role,
          password: hashedPassword,
        })
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Profile creation failed for ${testUser.name}:`, profileError.message);
        errorCount++;
        continue;
      }

      console.log(`  ✅ Profile created`);

      // Create role-specific profile
      if (testUser.role === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            user_id: userId,
            specialty: (testUser as any).specialty,
            consultation_fee: (testUser as any).consultation_fee,
            rating: 4.8,
          });
        
        if (doctorError) {
          console.error(`⚠️ Doctor profile creation failed:`, doctorError.message);
        } else {
          console.log(`  ✅ Doctor profile created`);
        }
      } else if (testUser.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: userId,
            date_of_birth: '1990-01-01',
            gender: 'male',
            address: '123 Main St, Metro Manila',
          });
        
        if (patientError) {
          console.error(`⚠️ Patient profile creation failed:`, patientError.message);
        } else {
          console.log(`  ✅ Patient profile created`);
        }
      } else if (testUser.role === 'staff') {
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            user_id: userId,
            position: 'Medical Assistant',
          });
        
        if (staffError) {
          console.error(`⚠️ Staff profile creation failed:`, staffError.message);
        } else {
          console.log(`  ✅ Staff profile created`);
        }
      }
      
      // Optionally try to create Supabase Auth user for session management
      try {
        const { error: authError } = await supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password
        });
        
        if (authError) {
          console.log(`  ⚠️ Optional Supabase Auth creation failed: ${authError.message}`);
        } else {
          console.log(`  ✅ Optional Supabase Auth user created`);
        }
      } catch (authErr) {
        console.log(`  ⚠️ Optional Supabase Auth creation skipped`);
      }
      
      console.log(`✅ Successfully created: ${testUser.name} (${testUser.email})`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error creating ${testUser.name}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n🎉 User seeding completed!`);
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount} users`);
  
  if (successCount === 0 && errorCount === 0) {
    console.log('ℹ️  All users already exist - database is ready!');
  }
  
  if (successCount > 0) {
    console.log('\n📋 Test Login Credentials (Database Authentication):');
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    console.log('\n💡 These users now work with the updated login form!');
    console.log('🔒 Passwords are securely hashed in the database');
    console.log('\n🔧 Next steps:');
    console.log('1. Run the RLS fix SQL script in Supabase SQL Editor');
    console.log('2. Try logging in with the credentials above');
    console.log('3. Test the RLS functionality in browser console');
  }
};

// Export for browser console use
if (typeof window !== 'undefined') {
  (window as any).seedTestUsers = seedTestUsers;
}