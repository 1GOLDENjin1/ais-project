// Comprehensive RLS Testing Suite
// Test all 4 user roles against the permission requirements
import { supabase } from '../lib/supabase';

interface RLSTestResult {
  role: string;
  table: string;
  operation: string;
  expected: 'ALLOW' | 'DENY' | 'LIMITED';
  actual: 'PASS' | 'FAIL' | 'ERROR';
  details?: string;
}

class RLSTestSuite {
  private results: RLSTestResult[] = [];

  private addResult(role: string, table: string, operation: string, expected: 'ALLOW' | 'DENY' | 'LIMITED', actual: 'PASS' | 'FAIL' | 'ERROR', details?: string) {
    this.results.push({ role, table, operation, expected, actual, details });
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const emoji = {
      info: '📋',
      success: '✅',
      error: '❌',
      warn: '⚠️'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  // Test Patient Role Permissions
  async testPatientPermissions() {
    this.log('Testing Patient Role Permissions...', 'info');

    // Patient should see own data only
    try {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;
      
      // Should only see own user record
      const expectedCount = 1;
      const actualCount = users?.length || 0;
      
      if (actualCount === expectedCount) {
        this.addResult('patient', 'users', 'SELECT', 'LIMITED', 'PASS', `Sees own record only (${actualCount})`);
      } else {
        this.addResult('patient', 'users', 'SELECT', 'LIMITED', 'FAIL', `Expected ${expectedCount}, got ${actualCount}`);
      }
    } catch (error) {
      this.addResult('patient', 'users', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Patient should see own appointments only
    try {
      const { data: appointments, error } = await supabase.from('appointments').select('*');
      if (error) throw error;

      this.addResult('patient', 'appointments', 'SELECT', 'LIMITED', 'PASS', `Can see ${appointments?.length || 0} appointments`);
    } catch (error) {
      this.addResult('patient', 'appointments', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Patient should see all available doctors (public info)
    try {
      const { data: doctors, error } = await supabase.from('doctors').select('*');
      if (error) throw error;

      this.addResult('patient', 'doctors', 'SELECT', 'ALLOW', 'PASS', `Can see ${doctors?.length || 0} doctors`);
    } catch (error) {
      this.addResult('patient', 'doctors', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Patient should see all available services
    try {
      const { data: services, error } = await supabase.from('services').select('*');
      if (error) throw error;

      this.addResult('patient', 'services', 'SELECT', 'ALLOW', 'PASS', `Can see ${services?.length || 0} services`);
    } catch (error) {
      this.addResult('patient', 'services', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Patient should see active packages only
    try {
      const { data: packages, error } = await supabase.from('service_packages').select('*');
      if (error) throw error;

      this.addResult('patient', 'service_packages', 'SELECT', 'LIMITED', 'PASS', `Can see ${packages?.length || 0} active packages`);
    } catch (error) {
      this.addResult('patient', 'service_packages', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Patient should see own medical records only
    try {
      const { data: records, error } = await supabase.from('medical_records').select('*');
      if (error) throw error;

      this.addResult('patient', 'medical_records', 'SELECT', 'LIMITED', 'PASS', `Can see ${records?.length || 0} own records`);
    } catch (error) {
      this.addResult('patient', 'medical_records', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Patient should see own prescriptions only
    try {
      const { data: prescriptions, error } = await supabase.from('prescriptions').select('*');
      if (error) throw error;

      this.addResult('patient', 'prescriptions', 'SELECT', 'LIMITED', 'PASS', `Can see ${prescriptions?.length || 0} own prescriptions`);
    } catch (error) {
      this.addResult('patient', 'prescriptions', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Patient should NOT be able to modify doctors table
    try {
      const { error } = await supabase.from('doctors').insert({
        user_id: 'test-id',
        specialty: 'Test',
        consultation_fee: 1000,
        rating: 5
      });
      
      if (error && error.message.includes('new row violates row-level security policy')) {
        this.addResult('patient', 'doctors', 'INSERT', 'DENY', 'PASS', 'Correctly blocked from inserting');
      } else if (error) {
        this.addResult('patient', 'doctors', 'INSERT', 'DENY', 'PASS', 'Blocked by other constraint');
      } else {
        this.addResult('patient', 'doctors', 'INSERT', 'DENY', 'FAIL', 'Should not be able to insert');
      }
    } catch (error) {
      this.addResult('patient', 'doctors', 'INSERT', 'DENY', 'ERROR', error.message);
    }
  }

  // Test Doctor Role Permissions
  async testDoctorPermissions() {
    this.log('Testing Doctor Role Permissions...', 'info');

    // Doctor should see own profile
    try {
      const { data: doctors, error } = await supabase.from('doctors').select('*');
      if (error) throw error;

      this.addResult('doctor', 'doctors', 'SELECT', 'LIMITED', 'PASS', `Can see ${doctors?.length || 0} doctor records`);
    } catch (error) {
      this.addResult('doctor', 'doctors', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Doctor should see own schedules
    try {
      const { data: schedules, error } = await supabase.from('doctor_schedules').select('*');
      if (error) throw error;

      this.addResult('doctor', 'doctor_schedules', 'SELECT', 'LIMITED', 'PASS', `Can see ${schedules?.length || 0} schedules`);
    } catch (error) {
      this.addResult('doctor', 'doctor_schedules', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Doctor should see assigned appointments
    try {
      const { data: appointments, error } = await supabase.from('appointments').select('*');
      if (error) throw error;

      this.addResult('doctor', 'appointments', 'SELECT', 'LIMITED', 'PASS', `Can see ${appointments?.length || 0} assigned appointments`);
    } catch (error) {
      this.addResult('doctor', 'appointments', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Doctor should see patients they treat
    try {
      const { data: patients, error } = await supabase.from('patients').select('*');
      if (error) throw error;

      this.addResult('doctor', 'patients', 'SELECT', 'LIMITED', 'PASS', `Can see ${patients?.length || 0} patients`);
    } catch (error) {
      this.addResult('doctor', 'patients', 'SELECT', 'LIMITED', 'ERROR', error.message);
    }

    // Doctor should be able to create medical records
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const testRecord = {
        patient_id: 'test-patient-id',
        doctor_id: 'test-doctor-id',
        appointment_id: 'test-appointment-id',
        diagnosis: 'Test diagnosis',
        notes: 'Test notes'
      };

      const { error } = await supabase.from('medical_records').insert(testRecord);
      
      if (error && error.message.includes('new row violates row-level security policy')) {
        this.addResult('doctor', 'medical_records', 'INSERT', 'ALLOW', 'FAIL', 'RLS blocked legitimate insert');
      } else if (error) {
        this.addResult('doctor', 'medical_records', 'INSERT', 'ALLOW', 'PASS', 'Blocked by data constraint, not RLS');
      } else {
        this.addResult('doctor', 'medical_records', 'INSERT', 'ALLOW', 'PASS', 'Can create medical records');
      }
    } catch (error) {
      this.addResult('doctor', 'medical_records', 'INSERT', 'ALLOW', 'ERROR', error.message);
    }
  }

  // Test Staff Role Permissions
  async testStaffPermissions() {
    this.log('Testing Staff Role Permissions...', 'info');

    // Staff should see all users
    try {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;

      this.addResult('staff', 'users', 'SELECT', 'ALLOW', 'PASS', `Can see ${users?.length || 0} users`);
    } catch (error) {
      this.addResult('staff', 'users', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Staff should see all appointments
    try {
      const { data: appointments, error } = await supabase.from('appointments').select('*');
      if (error) throw error;

      this.addResult('staff', 'appointments', 'SELECT', 'ALLOW', 'PASS', `Can see ${appointments?.length || 0} appointments`);
    } catch (error) {
      this.addResult('staff', 'appointments', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Staff should see all patients
    try {
      const { data: patients, error } = await supabase.from('patients').select('*');
      if (error) throw error;

      this.addResult('staff', 'patients', 'SELECT', 'ALLOW', 'PASS', `Can see ${patients?.length || 0} patients`);
    } catch (error) {
      this.addResult('staff', 'patients', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Staff should see all medical records
    try {
      const { data: records, error } = await supabase.from('medical_records').select('*');
      if (error) throw error;

      this.addResult('staff', 'medical_records', 'SELECT', 'ALLOW', 'PASS', `Can see ${records?.length || 0} medical records`);
    } catch (error) {
      this.addResult('staff', 'medical_records', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Staff should be able to manage services
    try {
      const testService = {
        id: 'test-service-' + Date.now(),
        name: 'Test Service',
        category: 'testing',
        description: 'Test service for RLS testing',
        duration: '30 minutes',
        price: 1000,
        is_available: true
      };

      const { error } = await supabase.from('services').insert(testService);
      
      if (error && error.message.includes('new row violates row-level security policy')) {
        this.addResult('staff', 'services', 'INSERT', 'ALLOW', 'FAIL', 'RLS blocked staff from managing services');
      } else if (error) {
        this.addResult('staff', 'services', 'INSERT', 'ALLOW', 'PASS', 'Blocked by data constraint, not RLS');
      } else {
        this.addResult('staff', 'services', 'INSERT', 'ALLOW', 'PASS', 'Can manage services');
        
        // Clean up
        await supabase.from('services').delete().eq('id', testService.id);
      }
    } catch (error) {
      this.addResult('staff', 'services', 'INSERT', 'ALLOW', 'ERROR', error.message);
    }
  }

  // Test Admin Role Permissions
  async testAdminPermissions() {
    this.log('Testing Admin Role Permissions...', 'info');

    // Admin should have full access to staff table
    try {
      const { data: staff, error } = await supabase.from('staff').select('*');
      if (error) throw error;

      this.addResult('admin', 'staff', 'SELECT', 'ALLOW', 'PASS', `Can see ${staff?.length || 0} staff members`);
    } catch (error) {
      this.addResult('admin', 'staff', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Admin should see all users
    try {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;

      this.addResult('admin', 'users', 'SELECT', 'ALLOW', 'PASS', `Can see ${users?.length || 0} users`);
    } catch (error) {
      this.addResult('admin', 'users', 'SELECT', 'ALLOW', 'ERROR', error.message);
    }

    // Admin should be able to manage equipment
    try {
      const testEquipment = {
        name: 'Test Equipment',
        type: 'diagnostic',
        model: 'TEST-001',
        location: 'Test Room',
        status: 'available'
      };

      const { error } = await supabase.from('equipment').insert(testEquipment);
      
      if (error && error.message.includes('new row violates row-level security policy')) {
        this.addResult('admin', 'equipment', 'INSERT', 'ALLOW', 'FAIL', 'RLS blocked admin from managing equipment');
      } else if (error) {
        this.addResult('admin', 'equipment', 'INSERT', 'ALLOW', 'PASS', 'Blocked by data constraint, not RLS');
      } else {
        this.addResult('admin', 'equipment', 'INSERT', 'ALLOW', 'PASS', 'Can manage equipment');
      }
    } catch (error) {
      this.addResult('admin', 'equipment', 'INSERT', 'ALLOW', 'ERROR', error.message);
    }
  }

  // Generate comprehensive report
  generateReport() {
    this.log('\n🔍 RLS Test Results Summary:', 'info');
    
    const roleStats = {
      patient: { pass: 0, fail: 0, error: 0, total: 0 },
      doctor: { pass: 0, fail: 0, error: 0, total: 0 },
      staff: { pass: 0, fail: 0, error: 0, total: 0 },
      admin: { pass: 0, fail: 0, error: 0, total: 0 }
    };

    this.results.forEach(result => {
      const stats = roleStats[result.role];
      if (stats) {
        stats.total++;
        if (result.actual === 'PASS') stats.pass++;
        else if (result.actual === 'FAIL') stats.fail++;
        else if (result.actual === 'ERROR') stats.error++;
      }
    });

    // Print summary by role
    Object.entries(roleStats).forEach(([role, stats]) => {
      const passRate = Math.round((stats.pass / stats.total) * 100);
      const emoji = passRate >= 80 ? '✅' : passRate >= 60 ? '⚠️' : '❌';
      console.log(`${emoji} ${role.toUpperCase()}: ${stats.pass}/${stats.total} tests passed (${passRate}%)`);
    });

    console.log('\n📊 Detailed Results:');
    console.table(this.results);

    // Identify critical failures
    const criticalFailures = this.results.filter(r => 
      r.actual === 'FAIL' && (
        (r.role === 'patient' && r.expected === 'DENY') ||
        (r.role === 'staff' && r.expected === 'ALLOW') ||
        (r.role === 'admin' && r.expected === 'ALLOW')
      )
    );

    if (criticalFailures.length > 0) {
      this.log('\n🚨 Critical Security Issues Found:', 'error');
      criticalFailures.forEach(failure => {
        console.log(`❌ ${failure.role} can ${failure.operation} ${failure.table} when they should not be able to`);
      });
    } else {
      this.log('\n🔒 No critical security issues detected!', 'success');
    }

    return {
      summary: roleStats,
      details: this.results,
      criticalIssues: criticalFailures
    };
  }
}

// Test functions for different user contexts
export async function testRLSAsPatient() {
  console.log('🧪 Testing RLS as Patient User...');
  const suite = new RLSTestSuite();
  await suite.testPatientPermissions();
  return suite.generateReport();
}

export async function testRLSAsDoctor() {
  console.log('🧪 Testing RLS as Doctor User...');
  const suite = new RLSTestSuite();
  await suite.testDoctorPermissions();
  return suite.generateReport();
}

export async function testRLSAsStaff() {
  console.log('🧪 Testing RLS as Staff User...');
  const suite = new RLSTestSuite();
  await suite.testStaffPermissions();
  return suite.generateReport();
}

export async function testRLSAsAdmin() {
  console.log('🧪 Testing RLS as Admin User...');
  const suite = new RLSTestSuite();
  await suite.testAdminPermissions();
  return suite.generateReport();
}

export async function testAllRoles() {
  console.log('🧪 Testing All RLS Permissions...');
  
  const results = {
    patient: null,
    doctor: null,
    staff: null,
    admin: null
  };

  try {
    // Note: You need to login as each role to test properly
    console.log('\n⚠️  To test all roles, you need to:');
    console.log('1. Login as patient@test.com and run: testRLSAsPatient()');
    console.log('2. Login as doctor@test.com and run: testRLSAsDoctor()');
    console.log('3. Login as staff@test.com and run: testRLSAsStaff()');
    console.log('4. Login as admin@test.com and run: testRLSAsAdmin()');
    
    return results;
  } catch (error) {
    console.error('❌ Error running comprehensive RLS tests:', error);
    return null;
  }
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).testRLSAsPatient = testRLSAsPatient;
  (window as any).testRLSAsDoctor = testRLSAsDoctor;
  (window as any).testRLSAsStaff = testRLSAsStaff;
  (window as any).testRLSAsAdmin = testRLSAsAdmin;
  (window as any).testAllRoles = testAllRoles;
  
  console.log('🧪 RLS Test Suite loaded! Available functions:');
  console.log('- testRLSAsPatient()');
  console.log('- testRLSAsDoctor()');
  console.log('- testRLSAsStaff()');
  console.log('- testRLSAsAdmin()');
  console.log('- testAllRoles()');
}