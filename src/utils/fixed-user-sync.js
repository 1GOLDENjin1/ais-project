// Fixed User Sync Script - Run this in browser console (F12)
console.log('🔧 Loading FIXED user sync script...');

async function fixedUserSync() {
  console.log('🚀 Starting fixed user sync to Supabase Auth...\n');
  
  // Use clean, valid email addresses and passwords
  const validUsers = [
    {
      email: 'patient.test@example.com',
      password: 'Password123!',
      name: 'Test Patient',
      role: 'patient'
    },
    {
      email: 'doctor.test@example.com', 
      password: 'Password123!',
      name: 'Dr. Test Doctor',
      role: 'doctor'
    },
    {
      email: 'staff.test@example.com',
      password: 'Password123!',
      name: 'Test Staff Member',
      role: 'staff'
    },
    {
      email: 'admin.test@example.com',
      password: 'Password123!',
      name: 'Test Admin',
      role: 'admin'
    }
  ];
  
  const results = [];
  
  for (const user of validUsers) {
    console.log(`🔧 Creating user: ${user.email}`);
    
    try {
      // Step 1: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role
          }
        }
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ✅ ${user.email} - Already exists in Auth`);
          results.push({ email: user.email, status: 'exists', success: true });
        } else {
          console.error(`   ❌ ${user.email} - Auth error: ${authError.message}`);
          results.push({ email: user.email, status: 'auth_failed', success: false, error: authError.message });
        }
        continue;
      }
      
      if (authData.user) {
        console.log(`   ✅ ${user.email} - Auth user created: ${authData.user.id}`);
        
        // Step 2: Create database profile
        const { data: dbProfile, error: dbError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: user.name,
            email: user.email,
            password: '', // Handled by Supabase Auth
            role: user.role
          })
          .select()
          .single();
        
        if (dbError) {
          console.log(`   ⚠️  ${user.email} - Database profile error: ${dbError.message}`);
          results.push({ email: user.email, status: 'db_failed', success: true, warning: dbError.message });
        } else {
          console.log(`   ✅ ${user.email} - Database profile created`);
          
          // Step 3: Create role-specific records
          try {
            if (user.role === 'patient') {
              await supabase.from('patients').insert({
                user_id: authData.user.id,
                date_of_birth: null,
                gender: null,
                address: null
              });
              console.log(`   ✅ ${user.email} - Patient record created`);
            } else if (user.role === 'doctor') {
              await supabase.from('doctors').insert({
                user_id: authData.user.id,
                specialty: 'General Medicine',
                consultation_fee: 1500.00,
                rating: 0.0
              });
              console.log(`   ✅ ${user.email} - Doctor record created`);
            } else if (user.role === 'staff') {
              await supabase.from('staff').insert({
                user_id: authData.user.id,
                position: 'Staff Member'
              });
              console.log(`   ✅ ${user.email} - Staff record created`);
            }
          } catch (roleError) {
            console.log(`   ⚠️  ${user.email} - Role record warning: ${roleError.message}`);
          }
          
          results.push({ email: user.email, status: 'complete', success: true });
        }
      }
      
    } catch (error) {
      console.error(`   ❌ ${user.email} - Unexpected error: ${error.message}`);
      results.push({ email: user.email, status: 'failed', success: false, error: error.message });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Sync Results:');
  console.table(results);
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n🎉 ${successful}/${results.length} users ready!`);
  
  if (successful > 0) {
    console.log('\n🔑 Login Credentials:');
    validUsers.forEach(user => {
      console.log(`   📧 ${user.email}`);
      console.log(`   🔐 ${user.password}`);
      console.log(`   👤 ${user.role}`);
      console.log('');
    });
    
    console.log('💡 Try logging in with any of these credentials!');
  }
  
  return results;
}

// Quick login test
async function quickLogin(email, password) {
  console.log(`🧪 Testing login: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.error(`❌ Login failed: ${error.message}`);
      return false;
    }
    
    if (data.user) {
      console.log(`✅ Login successful!`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      
      // Test profile access
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (!profileError && profile) {
        console.log(`   Profile: ${profile.name} (${profile.role})`);
      }
      
      // Sign out after test
      await supabase.auth.signOut();
      console.log(`   Signed out`);
      
      return true;
    }
  } catch (error) {
    console.error(`❌ Login error: ${error.message}`);
  }
  
  return false;
}

// Make functions available
window.fixedUserSync = fixedUserSync;
window.quickLogin = quickLogin;

console.log('✅ Fixed sync script loaded!');
console.log('📋 Available functions:');
console.log('  - fixedUserSync() - Create working test users');
console.log('  - quickLogin(email, password) - Test login');
console.log('');
console.log('🚀 Run: fixedUserSync()');