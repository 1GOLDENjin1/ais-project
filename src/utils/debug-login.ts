// Debug login issues and check what users exist in the system

import { supabase } from '@/lib/supabase';

export async function debugLoginIssue(email: string, password: string) {
  console.log('🔍 Debugging login issue for:', email);
  
  try {
    // Step 1: Check if user exists in Supabase Auth
    console.log('1️⃣ Attempting Supabase Auth login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      console.error('❌ Supabase Auth Error:', authError.message);
      console.log('   This means the user does not exist in Supabase Auth or password is wrong');
      
      // Check if user exists in our users table
      console.log('2️⃣ Checking if user exists in users table...');
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('email', email)
        .single();
      
      if (dbError) {
        console.log('❌ User not found in users table either:', dbError.message);
        console.log('💡 Solution: Create the user using createTestPatient() or createTestDoctor()');
      } else {
        console.log('⚠️ User exists in database but not in Supabase Auth:', dbUser);
        console.log('💡 This indicates migration issue - user created with old auth system');
      }
      
      return { success: false, issue: 'auth_failed', details: authError };
    }
    
    console.log('✅ Supabase Auth successful:', authData.user?.email);
    
    // Step 2: Check if profile exists in users table
    console.log('2️⃣ Checking user profile in database...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found in users table:', profileError.message);
      console.log('💡 Solution: User exists in Auth but missing profile data');
      return { success: false, issue: 'missing_profile', details: profileError };
    }
    
    console.log('✅ Profile found:', profile);
    
    // Step 3: Check role-specific tables
    console.log('3️⃣ Checking role-specific tables...');
    if (profile.role === 'patient') {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      
      console.log(patient ? '✅ Patient record found' : '⚠️ Patient record missing:', patientError?.message);
    } else if (profile.role === 'doctor') {
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      
      console.log(doctor ? '✅ Doctor record found' : '⚠️ Doctor record missing:', doctorError?.message);
    }
    
    console.log('🎉 Login should work! All components are in place.');
    return { success: true, user: profile };
    
  } catch (error) {
    console.error('💥 Unexpected error during login debug:', error);
    return { success: false, issue: 'unexpected_error', details: error };
  }
}

export async function listAllUsers() {
  console.log('📋 Listing all users in the system...');
  
  try {
    // List users from database
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .limit(10);
    
    if (dbError) {
      console.error('❌ Error fetching users:', dbError.message);
      return;
    }
    
    console.log('👥 Users in database:');
    dbUsers?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.name}`);
    });
    
    // Note: We can't list Supabase Auth users from client side for security
    console.log('\n💡 To see Supabase Auth users, check the Supabase dashboard');
    
  } catch (error) {
    console.error('💥 Error listing users:', error);
  }
}

export async function testLoginFlow() {
  console.log('🧪 Testing complete login flow...');
  
  // Test common credentials
  const testCredentials = [
    { email: 'patient@test.com', password: 'test123456' },
    { email: 'doctor@test.com', password: 'test123456' },
    { email: 'doctor@mendoza-clinic.com', password: 'password123' },
    { email: 'staff@mendoza-clinic.com', password: 'password123' }
  ];
  
  for (const cred of testCredentials) {
    console.log(`\n🔐 Testing ${cred.email}...`);
    await debugLoginIssue(cred.email, cred.password);
  }
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugLoginIssue = debugLoginIssue;
  (window as any).listAllUsers = listAllUsers;
  (window as any).testLoginFlow = testLoginFlow;
}