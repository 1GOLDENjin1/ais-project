// Sync existing database users with Supabase Auth
// Run this in browser console to create Auth accounts for your database users

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okwsgaseenyhlupnqewo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rd3NnYXNlZW55aGx1cG5xZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE3MzMsImV4cCI6MjA3NDUzNzczM30.CTyA-FkrFPEyYZ_0qg4BNWTznIfNrPJBXDWfs_zgSx4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DatabaseUser {
  email: string;
  password: string;
  name: string;
  role: string;
}

// Your existing database users with their passwords
const existingUsers: DatabaseUser[] = [
  {
    email: 'paenggineda471+1@gmail.com',
    password: 'qwertyu',
    name: 'Rafael User',
    role: 'patient'
  },
  {
    email: 'patient@test.com',
    password: 'password123',
    name: 'Test Patient',
    role: 'patient'
  },
  {
    email: 'doctor@mendoza-clinic.com',
    password: 'password123',
    name: 'Dr. Maria Santos',
    role: 'doctor'
  },
  {
    email: 'staff@mendoza-clinic.com',
    password: 'password123',
    name: 'Ana Rodriguez',
    role: 'staff'
  },
  {
    email: 'admin@mendoza-clinic.com',
    password: 'password123',
    name: 'Carlos Mendoza',
    role: 'admin'
  }
];

export async function createSupabaseAuthForUser(user: DatabaseUser) {
  console.log(`🔧 Creating Supabase Auth for: ${user.email}`);
  
  try {
    // Try to sign up the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          name: user.name,
          role: user.role
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`✅ ${user.email} - Already has Supabase Auth account`);
        return { success: true, message: 'Already exists' };
      } else {
        console.error(`❌ ${user.email} - Auth creation failed:`, error.message);
        return { success: false, error: error.message };
      }
    }

    if (data.user) {
      console.log(`✅ ${user.email} - Supabase Auth account created successfully!`);
      return { success: true, user: data.user };
    }

    return { success: false, error: 'No user returned' };
  } catch (err) {
    console.error(`❌ ${user.email} - Unexpected error:`, err);
    return { success: false, error: String(err) };
  }
}

export async function syncAllExistingUsers() {
  console.log('🚀 Starting Supabase Auth sync for all existing users...\n');
  
  const results = [];
  
  for (const user of existingUsers) {
    const result = await createSupabaseAuthForUser(user);
    results.push({ email: user.email, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Sync Results Summary:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.email}: ${result.error || result.message || 'Created successfully'}`);
  });
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n🎉 Sync complete! ${successful}/${results.length} users ready for login.`);
  
  if (successful > 0) {
    console.log('\n🔑 You can now login with:');
    existingUsers.forEach(user => {
      console.log(`   📧 ${user.email} / 🔐 ${user.password}`);
    });
  }
  
  return results;
}

// Create your preferred user (without +1)
export async function createPreferredUser() {
  console.log('🎯 Creating your preferred user account...');
  
  const preferredUser: DatabaseUser = {
    email: 'paenggineda471@gmail.com', // Without +1
    password: '123456',
    name: 'Rafael User',
    role: 'patient'
  };
  
  const result = await createSupabaseAuthForUser(preferredUser);
  
  if (result.success) {
    console.log(`\n🎉 Your preferred account is ready!`);
    console.log(`📧 Email: ${preferredUser.email}`);
    console.log(`🔐 Password: ${preferredUser.password}`);
    console.log('\nNow you can login with this exact email and password!');
  }
  
  return result;
}

// Test login with a specific user
export async function testLogin(email: string, password: string) {
  console.log(`🧪 Testing login with: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(`❌ Login failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      console.log(`✅ Login successful!`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.user_metadata?.role || 'Not specified'}`);
      
      // Sign out after test
      await supabase.auth.signOut();
      console.log(`🔐 Signed out after test`);
      
      return { success: true, user: data.user };
    }
    
    return { success: false, error: 'No user returned' };
  } catch (err) {
    console.error(`❌ Login test failed:`, err);
    return { success: false, error: String(err) };
  }
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).syncAllExistingUsers = syncAllExistingUsers;
  (window as any).createPreferredUser = createPreferredUser;
  (window as any).testLogin = testLogin;
}