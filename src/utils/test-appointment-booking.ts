// Test appointment creation with proper error handling
import { AppointmentService } from '../services/databaseService';
import { supabase } from '../lib/supabase';

async function testAppointmentBooking() {
  console.log('🧪 Testing appointment booking process...');
  
  try {
    // Step 1: Check if we have sample doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select(`
        id, 
        specialty,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .limit(5);

    console.log('👨‍⚕️ Available doctors:', doctors);
    console.log('🚫 Doctors error:', doctorsError);

    if (!doctors || doctors.length === 0) {
      console.log('⚠️ No doctors found in database');
      return;
    }

    // Step 2: Check if we have sample patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select(`
        id,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .limit(5);

    console.log('🏥 Available patients:', patients);
    console.log('🚫 Patients error:', patientsError);

    if (!patients || patients.length === 0) {
      console.log('⚠️ No patients found in database');
      return;
    }

    // Step 3: Try to create an appointment with real IDs
    const testAppointmentData = {
      patient_id: patients[0].id,
      doctor_id: doctors[0].id,
      service_type: 'consultation',
      appointment_date: '2025-10-02',
      appointment_time: '10:00:00',
      reason: 'Test appointment creation',
      appointment_type: 'consultation',
      consultation_type: 'in-person',
      duration_minutes: 30
    };

    console.log('📝 Creating appointment with data:', testAppointmentData);

    const appointmentId = await AppointmentService.createAppointment(testAppointmentData);
    
    console.log('📊 Appointment creation result:', appointmentId);

    if (appointmentId) {
      console.log('✅ SUCCESS: Appointment created with ID:', appointmentId);
    } else {
      console.log('❌ FAILED: Appointment creation returned null');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testAppointmentBooking = testAppointmentBooking;
}

export default testAppointmentBooking;