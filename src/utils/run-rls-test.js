// Simple RLS Test Runner for Browser Console
// Copy and paste this into your browser console (F12) to test RLS permissions

console.log('🧪 Loading RLS Test Runner...');

// Quick RLS permission test
async function quickRLSTest() {
  try {
    console.log('🔍 Quick RLS Permission Test Starting...');
    
    // Get current user info
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Not authenticated. Please login first.');
      return;
    }
    
    console.log(`👤 Testing as user: ${user.email}`);
    
    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.log('❌ Could not get user role:', userError.message);
      return;
    }
    
    const userRole = userData?.role || 'unknown';
    console.log(`🎭 User role: ${userRole}`);
    
    const results = [];
    
    // Test 1: Users table access
    try {
      const { data: users, error } = await supabase.from('users').select('*');
      const count = users?.length || 0;
      results.push({
        table: 'users',
        operation: 'SELECT',
        result: error ? 'ERROR' : 'SUCCESS',
        count: count,
        details: error?.message || `Can see ${count} users`
      });
    } catch (e) {
      results.push({
        table: 'users',
        operation: 'SELECT',
        result: 'ERROR',
        details: e.message
      });
    }
    
    // Test 2: Appointments table access
    try {
      const { data: appointments, error } = await supabase.from('appointments').select('*');
      const count = appointments?.length || 0;
      results.push({
        table: 'appointments',
        operation: 'SELECT',
        result: error ? 'ERROR' : 'SUCCESS',
        count: count,
        details: error?.message || `Can see ${count} appointments`
      });
    } catch (e) {
      results.push({
        table: 'appointments',
        operation: 'SELECT',
        result: 'ERROR',
        details: e.message
      });
    }
    
    // Test 3: Doctors table access
    try {
      const { data: doctors, error } = await supabase.from('doctors').select('*');
      const count = doctors?.length || 0;
      results.push({
        table: 'doctors',
        operation: 'SELECT',
        result: error ? 'ERROR' : 'SUCCESS',
        count: count,
        details: error?.message || `Can see ${count} doctors`
      });
    } catch (e) {
      results.push({
        table: 'doctors',
        operation: 'SELECT',
        result: 'ERROR',
        details: e.message
      });
    }
    
    // Test 4: Services table access
    try {
      const { data: services, error } = await supabase.from('services').select('*');
      const count = services?.length || 0;
      results.push({
        table: 'services',
        operation: 'SELECT',
        result: error ? 'ERROR' : 'SUCCESS',
        count: count,
        details: error?.message || `Can see ${count} services`
      });
    } catch (e) {
      results.push({
        table: 'services',
        operation: 'SELECT',
        result: 'ERROR',
        details: e.message
      });
    }
    
    // Test 5: Medical records access
    try {
      const { data: records, error } = await supabase.from('medical_records').select('*');
      const count = records?.length || 0;
      results.push({
        table: 'medical_records',
        operation: 'SELECT',
        result: error ? 'ERROR' : 'SUCCESS',
        count: count,
        details: error?.message || `Can see ${count} medical records`
      });
    } catch (e) {
      results.push({
        table: 'medical_records',
        operation: 'SELECT',
        result: 'ERROR',
        details: e.message
      });
    }
    
    // Test 6: Equipment table access (should be staff/admin only)
    try {
      const { data: equipment, error } = await supabase.from('equipment').select('*');
      const count = equipment?.length || 0;
      results.push({
        table: 'equipment',
        operation: 'SELECT',
        result: error ? 'ERROR' : 'SUCCESS',
        count: count,
        details: error?.message || `Can see ${count} equipment items`
      });
    } catch (e) {
      results.push({
        table: 'equipment',
        operation: 'SELECT',
        result: 'ERROR',
        details: e.message
      });
    }
    
    // Test 7: Try to insert into doctors table (should fail for non-staff)
    try {
      const testInsert = {
        user_id: user.id,
        specialty: 'Test Specialty',
        consultation_fee: 1000,
        rating: 0
      };
      
      const { error } = await supabase.from('doctors').insert(testInsert);
      
      if (error) {
        if (error.message.includes('row-level security policy')) {
          results.push({
            table: 'doctors',
            operation: 'INSERT',
            result: 'BLOCKED_BY_RLS',
            details: 'Correctly blocked by RLS policy'
          });
        } else {
          results.push({
            table: 'doctors',
            operation: 'INSERT',
            result: 'BLOCKED_BY_CONSTRAINT',
            details: error.message
          });
        }
      } else {
        results.push({
          table: 'doctors',
          operation: 'INSERT',
          result: 'SUCCESS',
          details: 'Insert allowed (cleanup needed)'
        });
        
        // Cleanup if insert succeeded
        await supabase.from('doctors').delete().eq('user_id', user.id).eq('specialty', 'Test Specialty');
      }
    } catch (e) {
      results.push({
        table: 'doctors',
        operation: 'INSERT',
        result: 'ERROR',
        details: e.message
      });
    }
    
    // Print results
    console.log('\n📊 RLS Test Results:');
    console.table(results);
    
    // Analyze results based on role
    console.log(`\n🎯 Analysis for role "${userRole}":`);
    
    switch (userRole) {
      case 'patient':
        console.log('✅ Expected behavior for PATIENT:');
        console.log('  - Should see own user record only');
        console.log('  - Should see own appointments only');
        console.log('  - Should see all doctors (public info)');
        console.log('  - Should see available services');
        console.log('  - Should NOT see medical records of others');
        console.log('  - Should NOT access equipment table');
        console.log('  - Should NOT be able to insert into doctors table');
        break;
        
      case 'doctor':
        console.log('✅ Expected behavior for DOCTOR:');
        console.log('  - Should see own user record');
        console.log('  - Should see assigned appointments');
        console.log('  - Should see all doctors');
        console.log('  - Should see services matching specialty');
        console.log('  - Should see medical records they created');
        console.log('  - Should NOT access equipment table');
        console.log('  - Should NOT be able to insert into doctors table (staff only)');
        break;
        
      case 'staff':
        console.log('✅ Expected behavior for STAFF:');
        console.log('  - Should see all users');
        console.log('  - Should see all appointments');
        console.log('  - Should see all doctors');
        console.log('  - Should see all services');
        console.log('  - Should see all medical records');
        console.log('  - Should access equipment table');
        console.log('  - Should be able to insert into doctors table');
        break;
        
      case 'admin':
        console.log('✅ Expected behavior for ADMIN:');
        console.log('  - Should see everything');
        console.log('  - Should modify everything');
        console.log('  - Full system access');
        break;
        
      default:
        console.log('❓ Unknown role - checking general permissions');
    }
    
    return {
      userRole,
      userEmail: user.email,
      testResults: results
    };
    
  } catch (error) {
    console.error('❌ Error running RLS test:', error);
    return null;
  }
}

// Test different role scenarios
async function testRoleScenarios() {
  console.log('🎭 Testing Role-Based Scenarios...');
  
  const scenarios = [
    {
      name: 'Patient Books Appointment',
      description: 'Patient should be able to create appointments for themselves',
      test: async () => {
        // This would test appointment creation workflow
        console.log('📅 Testing appointment booking...');
        return 'Would test appointment creation here';
      }
    },
    {
      name: 'Doctor Updates Medical Record', 
      description: 'Doctor should be able to update medical records for their patients',
      test: async () => {
        console.log('📝 Testing medical record updates...');
        return 'Would test medical record updates here';
      }
    },
    {
      name: 'Staff Manages Services',
      description: 'Staff should be able to modify services and packages',
      test: async () => {
        console.log('🔧 Testing service management...');
        return 'Would test service management here';
      }
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n🎯 ${scenario.name}: ${scenario.description}`);
    const result = await scenario.test();
    console.log(`   Result: ${result}`);
  }
}

// Make functions available globally
window.quickRLSTest = quickRLSTest;
window.testRoleScenarios = testRoleScenarios;

console.log('✅ RLS Test Runner loaded!');
console.log('📋 Available functions:');
console.log('  - quickRLSTest() - Test current user\'s permissions');
console.log('  - testRoleScenarios() - Test role-based scenarios');
console.log('');
console.log('💡 Usage:');
console.log('  1. Login as different users (patient, doctor, staff, admin)');
console.log('  2. Run quickRLSTest() to see what each role can access');
console.log('  3. Compare results with expected permissions');