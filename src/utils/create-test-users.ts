// Development helper to create test users that work with Supabase Auth
import { supabase } from '@/lib/supabase';

export async function createTestPatient() {
  const testEmail = 'patient@test.com';
  const testPassword = 'test123456';
  
  console.log('Creating test patient user...');
  
  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return;
    }

    if (authData.user) {
      console.log('Supabase Auth user created:', authData.user.id);
      
      // 2. Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: 'Test Patient',
          email: testEmail,
          phone: '+639123456789',
          role: 'patient',
          password: '', // Handled by Supabase Auth
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return;
      }

      console.log('User profile created:', profile);

      // 3. Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: authData.user.id,
          date_of_birth: '1990-01-01',
          gender: 'male',
          address: '123 Test Street, Test City'
        })
        .select()
        .single();

      if (patientError) {
        console.error('Patient record creation error:', patientError);
        return;
      }

      console.log('Patient record created:', patient);
      console.log('✅ Test patient created successfully!');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
      
      return { email: testEmail, password: testPassword, user: profile };
    }
  } catch (error) {
    console.error('Error creating test patient:', error);
  }
}

export async function createTestDoctor() {
  const testEmail = 'doctor@test.com';
  const testPassword = 'test123456';
  
  console.log('Creating test doctor user...');
  
  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return;
    }

    if (authData.user) {
      console.log('Supabase Auth user created:', authData.user.id);
      
      // 2. Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: 'Dr. Maria Santos',
          email: testEmail,
          phone: '+639987654321',
          role: 'doctor',
          password: '', // Handled by Supabase Auth
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return;
      }

      console.log('User profile created:', profile);

      // 3. Create doctor record
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: authData.user.id,
          specialty: 'General Medicine',
          consultation_fee: 2500.00,
          rating: 4.8
        })
        .select()
        .single();

      if (doctorError) {
        console.error('Doctor record creation error:', doctorError);
        return;
      }

      console.log('Doctor record created:', doctor);
      console.log('✅ Test doctor created successfully!');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
      
      return { email: testEmail, password: testPassword, user: profile };
    }
  } catch (error) {
    console.error('Error creating test doctor:', error);
  }
}

// Make functions available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).createTestPatient = createTestPatient;
  (window as any).createTestDoctor = createTestDoctor;
}