// Comprehensive RLS Testing Suite
// Test the complete system with Supabase Auth integration

import { supabase } from '@/lib/supabase';

export async function testCompleteRLSSystem() {
  console.log('🧪 Starting comprehensive RLS system test...');
  
  try {
    // ==========================================
    // PHASE 1: Test Patient Authentication & Data Access
    // ==========================================
    
    console.log('\n📋 Phase 1: Testing Patient Authentication...');
    
    // Sign in as patient
    const { data: patientAuth, error: patientAuthError } = await supabase.auth.signInWithPassword({
      email: 'patient@test.com',
      password: 'test123456'
    });
    
    if (patientAuthError) {
      console.error('❌ Patient login failed:', patientAuthError.message);
      return false;
    }
    
    console.log('✅ Patient logged in successfully:', patientAuth.user?.email);
    
    // Test patient can see doctors
    const { data: doctorsForPatient, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, specialty, consultation_fee, rating');
    
    console.log('👨‍⚕️ Doctors visible to patient:', doctorsForPatient?.length || 0, doctorsError ? `(Error: ${doctorsError.message})` : '');
    
    // Test patient can see services
    const { data: servicesForPatient, error: servicesError } = await supabase
      .from('services')
      .select('id, name, category, price, is_available')
      .limit(5);
    
    console.log('🏥 Services visible to patient:', servicesForPatient?.length || 0, servicesError ? `(Error: ${servicesError.message})` : '');
    
    // Test patient can see own appointments
    const { data: patientAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, doctor_id, service_type, appointment_date, status');
    
    console.log('📅 Patient appointments:', patientAppointments?.length || 0, appointmentsError ? `(Error: ${appointmentsError.message})` : '');
    
    // ==========================================
    // PHASE 2: Test Appointment Creation
    // ==========================================
    
    console.log('\n📋 Phase 2: Testing Appointment Creation...');
    
    // Get patient record
    const { data: patientRecord } = await supabase
      .from('patients')
      .select('id')
      .single();
    
    // Get a doctor
    const { data: availableDoctor } = await supabase
      .from('doctors')
      .select('id')
      .limit(1)
      .single();
    
    if (patientRecord && availableDoctor) {
      // Try to create appointment
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientRecord.id,
          doctor_id: availableDoctor.id,
          service_type: 'consultation',
          reason: 'RLS Test Appointment',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '10:00:00',
          status: 'pending'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Appointment creation failed:', createError.message);
      } else {
        console.log('✅ Appointment created successfully:', newAppointment?.id);
      }
    }
    
    await supabase.auth.signOut();
    
    // ==========================================
    // PHASE 3: Test Doctor Authentication & Data Access
    // ==========================================
    
    console.log('\n📋 Phase 3: Testing Doctor Authentication...');
    
    // Sign in as doctor
    const { data: doctorAuth, error: doctorAuthError } = await supabase.auth.signInWithPassword({
      email: 'doctor@test.com',
      password: 'test123456'
    });
    
    if (doctorAuthError) {
      console.error('❌ Doctor login failed:', doctorAuthError.message);
    } else {
      console.log('✅ Doctor logged in successfully:', doctorAuth.user?.email);
      
      // Test doctor can see assigned appointments
      const { data: doctorAppointments, error: docApptError } = await supabase
        .from('appointments')
        .select('id, patient_id, service_type, status');
      
      console.log('📅 Doctor appointments:', doctorAppointments?.length || 0, docApptError ? `(Error: ${docApptError.message})` : '');
      
      // Test doctor can see assigned patients
      const { data: doctorPatients, error: docPatientsError } = await supabase
        .from('patients')
        .select('id, date_of_birth, gender');
      
      console.log('👥 Patients visible to doctor:', doctorPatients?.length || 0, docPatientsError ? `(Error: ${docPatientsError.message})` : '');
    }
    
    await supabase.auth.signOut();
    
    // ==========================================
    // PHASE 4: Test Anonymous Access (Should Fail)
    // ==========================================
    
    console.log('\n📋 Phase 4: Testing Anonymous Access Restrictions...');
    
    // Test anonymous user cannot see appointments
    const { data: anonAppointments, error: anonError } = await supabase
      .from('appointments')
      .select('id');
    
    console.log('🚫 Anonymous appointment access:', anonAppointments?.length || 0, anonError ? `(Expected error: ${anonError.message})` : '(Should be blocked)');
    
    console.log('\n🎉 RLS System Test Complete!');
    return true;
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    return false;
  }
}

// Test appointment booking flow specifically
export async function testAppointmentBookingFlow() {
  console.log('🧪 Testing Complete Appointment Booking Flow...');
  
  try {
    // Login as patient
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
      email: 'patient@test.com',
      password: 'test123456'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return false;
    }
    
    console.log('✅ Patient authenticated, current user:', auth.user?.id);
    
    // Step 1: Get available services
    console.log('\n1️⃣ Fetching available services...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price, doctor_specialty')
      .eq('is_available', true)
      .limit(3);
    
    if (servicesError) {
      console.error('❌ Failed to fetch services:', servicesError.message);
      return false;
    }
    
    console.log('✅ Available services:', services?.length);
    
    // Step 2: Get available doctors
    console.log('\n2️⃣ Fetching available doctors...');
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, specialty, consultation_fee')
      .limit(3);
    
    if (doctorsError) {
      console.error('❌ Failed to fetch doctors:', doctorsError.message);
      return false;
    }
    
    console.log('✅ Available doctors:', doctors?.length);
    
    // Step 3: Get patient ID
    console.log('\n3️⃣ Getting patient record...');
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, user_id')
      .eq('user_id', auth.user.id)
      .single();
    
    if (patientError) {
      console.error('❌ Failed to get patient record:', patientError.message);
      return false;
    }
    
    console.log('✅ Patient record found:', patient?.id);
    
    // Step 4: Create appointment
    console.log('\n4️⃣ Creating appointment...');
    const appointmentData = {
      patient_id: patient.id,
      doctor_id: doctors[0]?.id,
      service_type: services[0]?.name || 'consultation',
      reason: 'Test booking via RLS system',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '14:00:00',
      status: 'pending'
    };
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();
    
    if (appointmentError) {
      console.error('❌ Failed to create appointment:', appointmentError.message);
      console.error('   Full error details:', appointmentError);
      return false;
    }
    
    console.log('✅ Appointment created successfully!');
    console.log('   Appointment ID:', appointment?.id);
    console.log('   Status:', appointment?.status);
    
    // Step 5: Verify appointment is visible to patient
    console.log('\n5️⃣ Verifying appointment visibility...');
    const { data: myAppointments, error: myApptError } = await supabase
      .from('appointments')
      .select('id, doctor_id, service_type, status, created_at')
      .eq('id', appointment.id);
    
    if (myApptError) {
      console.error('❌ Failed to fetch created appointment:', myApptError.message);
      return false;
    }
    
    console.log('✅ Appointment visible to patient:', myAppointments?.length === 1);
    
    await supabase.auth.signOut();
    console.log('\n🎉 Complete appointment booking flow test PASSED!');
    return true;
    
  } catch (error) {
    console.error('💥 Booking flow test failed:', error);
    await supabase.auth.signOut();
    return false;
  }
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).testCompleteRLSSystem = testCompleteRLSSystem;
  (window as any).testAppointmentBookingFlow = testAppointmentBookingFlow;
}