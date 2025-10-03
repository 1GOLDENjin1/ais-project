// Test script to debug appointment creation
import { supabase } from '@/lib/supabase';

export async function testAppointmentCreation() {
  console.log('Testing direct appointment creation...');
  
  // First, let's see what's in the users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5);
    
  console.log('Users in database:', users, usersError);
  
  // Check patients table
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*')
    .limit(5);
    
  console.log('Patients in database:', patients, patientsError);
  
  // Check doctors table
  const { data: doctors, error: doctorsError } = await supabase
    .from('doctors')
    .select('*')
    .limit(5);
    
  console.log('Doctors in database:', doctors, doctorsError);
  
  // Test appointment creation with a real patient and doctor ID
  if (patients && patients.length > 0 && doctors && doctors.length > 0) {
    const testAppointment = {
      patient_id: patients[0].id,
      doctor_id: doctors[0].id,
      service_type: 'consultation',
      reason: 'Test appointment',
      appointment_date: '2025-09-30',
      appointment_time: '10:00:00',
      status: 'pending'
    };
    
    console.log('Attempting to create test appointment:', testAppointment);
    
    const { data, error } = await supabase
      .from('appointments')
      .insert(testAppointment)
      .select()
      .single();
      
    console.log('Appointment creation result:', data, error);
  }
}

// Function to be called from browser console
(window as any).testAppointmentCreation = testAppointmentCreation;