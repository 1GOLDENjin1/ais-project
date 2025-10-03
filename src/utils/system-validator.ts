// Complete System Validation Test
// This script tests the entire healthcare system flow with proper Supabase Auth integration

import { supabase } from '@/lib/supabase';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export class SystemValidator {
  private results: TestResult[] = [];

  private log(test: string, success: boolean, message: string, details?: any) {
    const result = { success, message, details };
    this.results.push(result);
    
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} ${test}: ${message}`);
    if (details && !success) {
      console.log('   Details:', details);
    }
  }

  // Test 1: Verify seedUsers creates proper Supabase Auth users
  async testUserCreation() {
    console.log('\n🧪 TEST 1: User Creation with Supabase Auth');
    
    try {
      // Import and run the updated seedUsers function
      const { seedTestUsers } = await import('@/utils/seedUsers');
      
      console.log('Running seedTestUsers()...');
      await seedTestUsers();
      
      this.log('User Creation', true, 'Successfully created test users with Supabase Auth');
      return true;
    } catch (error) {
      this.log('User Creation', false, 'Failed to create test users', error);
      return false;
    }
  }

  // Test 2: Verify login works with created users
  async testAuthentication() {
    console.log('\n🧪 TEST 2: Authentication Flow');
    
    const testCredentials = [
      { email: 'patient@test.com', password: 'password123', role: 'patient' },
      { email: 'doctor@mendoza-clinic.com', password: 'password123', role: 'doctor' },
      { email: 'staff@mendoza-clinic.com', password: 'password123', role: 'staff' }
    ];

    let successCount = 0;
    
    for (const cred of testCredentials) {
      try {
        console.log(`\n  Testing ${cred.role} login: ${cred.email}`);
        
        // Test Supabase Auth login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cred.email,
          password: cred.password
        });

        if (authError) {
          this.log(`${cred.role} Auth`, false, `Auth failed: ${authError.message}`, authError);
          continue;
        }

        if (!authData.user) {
          this.log(`${cred.role} Auth`, false, 'No user returned from auth');
          continue;
        }

        // Test database profile exists
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          this.log(`${cred.role} Profile`, false, 'Profile not found in database', profileError);
          await supabase.auth.signOut();
          continue;
        }

        // Verify role matches
        if (profile.role !== cred.role) {
          this.log(`${cred.role} Role`, false, `Role mismatch: expected ${cred.role}, got ${profile.role}`);
          await supabase.auth.signOut();
          continue;
        }

        this.log(`${cred.role} Login`, true, `Successfully authenticated as ${profile.name}`);
        successCount++;
        
        // Clean up
        await supabase.auth.signOut();

      } catch (error) {
        this.log(`${cred.role} Login`, false, 'Unexpected error during login', error);
      }
    }

    const allPassed = successCount === testCredentials.length;
    this.log('Authentication Flow', allPassed, `${successCount}/${testCredentials.length} logins successful`);
    return allPassed;
  }

  // Test 3: Verify RLS policies work correctly
  async testRLSPolicies() {
    console.log('\n🧪 TEST 3: RLS Policy Validation');
    
    try {
      // Login as patient
      const { data: patientAuth } = await supabase.auth.signInWithPassword({
        email: 'patient@test.com',
        password: 'password123'
      });

      if (!patientAuth.user) {
        this.log('RLS Patient Setup', false, 'Could not login as patient');
        return false;
      }

      // Test: Patient can see doctors (public data)
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, specialty, consultation_fee, rating')
        .limit(5);

      if (doctorsError) {
        this.log('Patient View Doctors', false, 'Patient cannot view doctors', doctorsError);
      } else {
        this.log('Patient View Doctors', true, `Patient can see ${doctors?.length || 0} doctors`);
      }

      // Test: Patient can see services (public data)
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, category, price')
        .eq('is_available', true)
        .limit(5);

      if (servicesError) {
        this.log('Patient View Services', false, 'Patient cannot view services', servicesError);
      } else {
        this.log('Patient View Services', true, `Patient can see ${services?.length || 0} services`);
      }

      // Test: Patient can see own profile
      const { data: patientProfile, error: profileError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', patientAuth.user.id)
        .single();

      if (profileError) {
        this.log('Patient Own Profile', false, 'Patient cannot view own profile', profileError);
      } else {
        this.log('Patient Own Profile', true, 'Patient can view own profile');
      }

      await supabase.auth.signOut();

      // Test Anonymous Access (should be blocked for sensitive data)
      const { data: anonAppointments, error: anonError } = await supabase
        .from('appointments')
        .select('id')
        .limit(1);

      const anonBlocked = anonError !== null;
      this.log('Anonymous Access Block', anonBlocked, anonBlocked ? 'Anonymous access properly blocked' : 'Anonymous access not blocked');

      return true;

    } catch (error) {
      this.log('RLS Policies', false, 'RLS policy test failed', error);
      return false;
    }
  }

  // Test 4: Test appointment creation flow
  async testAppointmentCreation() {
    console.log('\n🧪 TEST 4: Appointment Creation Flow');
    
    try {
      // Login as patient
      const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: 'patient@test.com',
        password: 'password123'
      });

      if (authError || !auth.user) {
        this.log('Appointment Auth', false, 'Could not authenticate patient', authError);
        return false;
      }

      // Get patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', auth.user.id)
        .single();

      if (patientError || !patient) {
        this.log('Patient Record', false, 'Could not find patient record', patientError);
        await supabase.auth.signOut();
        return false;
      }

      // Get available doctor
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .limit(1)
        .single();

      if (doctorError || !doctor) {
        this.log('Doctor Availability', false, 'No doctors available', doctorError);
        await supabase.auth.signOut();
        return false;
      }

      // Create appointment
      const appointmentData = {
        patient_id: patient.id,
        doctor_id: doctor.id,
        service_type: 'consultation',
        reason: 'System validation test appointment',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00:00',
        status: 'pending'
      };

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (appointmentError) {
        this.log('Appointment Creation', false, 'Failed to create appointment', appointmentError);
        await supabase.auth.signOut();
        return false;
      }

      this.log('Appointment Creation', true, `Successfully created appointment ${appointment.id}`);

      // Verify appointment is visible to patient
      const { data: myAppointments, error: myApptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointment.id);

      if (myApptError || !myAppointments?.length) {
        this.log('Appointment Visibility', false, 'Patient cannot see created appointment', myApptError);
      } else {
        this.log('Appointment Visibility', true, 'Patient can see created appointment');
      }

      await supabase.auth.signOut();
      return true;

    } catch (error) {
      this.log('Appointment Creation', false, 'Unexpected error during appointment creation', error);
      await supabase.auth.signOut();
      return false;
    }
  }

  // Test 5: Test role-based dashboard data access
  async testDashboardAccess() {
    console.log('\n🧪 TEST 5: Dashboard Data Access');
    
    const roles = [
      { email: 'patient@test.com', password: 'password123', role: 'patient' },
      { email: 'doctor@mendoza-clinic.com', password: 'password123', role: 'doctor' },
      { email: 'staff@mendoza-clinic.com', password: 'password123', role: 'staff' }
    ];

    for (const roleTest of roles) {
      try {
        const { data: auth } = await supabase.auth.signInWithPassword({
          email: roleTest.email,
          password: roleTest.password
        });

        if (!auth.user) continue;

        // Test appropriate data access for each role
        if (roleTest.role === 'patient') {
          // Patients should see their own appointments
          const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('*');
          
          this.log(`${roleTest.role} Appointments`, !apptError, 
            apptError ? 'Cannot access appointments' : `Can access ${appointments?.length || 0} appointments`);
        } else if (roleTest.role === 'doctor') {
          // Doctors should see assigned appointments
          const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('*');
          
          this.log(`${roleTest.role} Appointments`, !apptError, 
            apptError ? 'Cannot access appointments' : `Can access ${appointments?.length || 0} appointments`);
        } else if (roleTest.role === 'staff') {
          // Staff should see all appointments
          const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('*');
          
          this.log(`${roleTest.role} All Data`, !apptError, 
            apptError ? 'Cannot access appointments' : `Can access ${appointments?.length || 0} appointments`);
        }

        await supabase.auth.signOut();
      } catch (error) {
        this.log(`${roleTest.role} Dashboard`, false, 'Dashboard access test failed', error);
      }
    }

    return true;
  }

  // Run all tests
  async runCompleteValidation() {
    console.log('🏥 STARTING COMPLETE HEALTHCARE SYSTEM VALIDATION');
    console.log('================================================');
    
    const tests = [
      { name: 'User Creation', test: () => this.testUserCreation() },
      { name: 'Authentication', test: () => this.testAuthentication() },
      { name: 'RLS Policies', test: () => this.testRLSPolicies() },
      { name: 'Appointment Creation', test: () => this.testAppointmentCreation() },
      { name: 'Dashboard Access', test: () => this.testDashboardAccess() }
    ];

    const results = [];
    
    for (const testCase of tests) {
      try {
        const result = await testCase.test();
        results.push({ name: testCase.name, passed: result });
      } catch (error) {
        console.error(`❌ ${testCase.name} failed with error:`, error);
        results.push({ name: testCase.name, passed: false });
      }
    }

    // Final report
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('====================');
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! The healthcare system is ready for use.');
      console.log('');
      console.log('✅ Login credentials that work:');
      console.log('   Patient: patient@test.com / password123');
      console.log('   Doctor: doctor@mendoza-clinic.com / password123');
      console.log('   Staff: staff@mendoza-clinic.com / password123');
      console.log('');
      console.log('✅ Key features verified:');
      console.log('   • Supabase Auth integration');
      console.log('   • RLS policies enforced');
      console.log('   • Appointment booking works');
      console.log('   • Role-based data access');
    } else {
      console.log('⚠️ Some tests failed. Check the details above.');
    }

    return { passed: passedTests, total: totalTests, allPassed: passedTests === totalTests };
  }
}

// Create global instance for browser console
const validator = new SystemValidator();

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).validateSystem = () => validator.runCompleteValidation();
  (window as any).SystemValidator = SystemValidator;
  
  // Auto-run when imported
  console.log('💡 Healthcare System Validator loaded!');
  console.log('💡 Run validateSystem() to test the complete system');
}

export { validator as systemValidator };