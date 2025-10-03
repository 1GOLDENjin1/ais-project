// Debug appointment creation issues
import { supabase } from '../lib/supabase';

const debugAppointmentCreation = async () => {
  try {
    console.log('🔍 Starting appointment creation debug...');

    // Check current auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Current Supabase auth user:', user);
    console.log('🚫 Auth error:', authError);

    // Check if we can access users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    console.log('👥 Users table access:', { users, usersError });

    // Check if we can access appointments table
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    console.log('📅 Appointments table access:', { appointments, appointmentsError });

    // Check if we can access patients table  
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    console.log('🏥 Patients table access:', { patients, patientsError });

    // Check if we can access doctors table
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
    console.log('👨‍⚕️ Doctors table access:', { doctors, doctorsError });

    // Try a simple appointment insert to see what happens
    console.log('🧪 Testing appointment insert...');
    
    const testAppointmentData = {
      patient_id: '123e4567-e89b-12d3-a456-426614174000', // fake UUID
      doctor_id: '123e4567-e89b-12d3-a456-426614174001',  // fake UUID  
      service_type: 'test',
      appointment_date: '2025-10-02',
      appointment_time: '10:00:00',
      reason: 'Test appointment',
      status: 'pending'
    };

    const { data: testResult, error: testError } = await supabase
      .from('appointments')
      .insert(testAppointmentData)
      .select('id')
      .single();

    console.log('🧪 Test insert result:', { testResult, testError });

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
};

export default debugAppointmentCreation;