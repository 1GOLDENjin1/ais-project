// Comprehensive Login Debug Script
// Copy and paste this entire script into your browser console (F12) to debug login issues

console.log('🔍 Loading comprehensive login debugger...');

async function debugLoginIssue() {
  console.log('🕵️ Starting comprehensive login diagnosis...\n');
  
  try {
    // Step 1: Check Supabase connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError);
      return;
    }
    console.log('✅ Supabase connection working');
    
    // Step 2: Check database users
    console.log('\n2️⃣ Checking database users...');
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at');
    
    if (dbError) {
      console.error('❌ Database users query failed:', dbError);
      return;
    }
    
    console.log(`✅ Found ${dbUsers?.length || 0} users in database:`);
    dbUsers?.forEach(user => {
      console.log(`   📧 ${user.email} (${user.role}) - ID: ${user.id}`);
    });
    
    // Step 3: Check Supabase Auth users
    console.log('\n3️⃣ Checking Supabase Auth users...');
    
    // We can't directly query auth users from client, so we'll test login attempts
    const testCredentials = [
      { email: 'paenggineda471+1@gmail.com', password: 'qwertyu' },
      { email: 'patient@test.com', password: 'password123' },
      { email: 'doctor@mendoza-clinic.com', password: 'password123' },
      { email: 'staff@mendoza-clinic.com', password: 'password123' },
      { email: 'admin@mendoza-clinic.com', password: 'password123' }
    ];
    
    console.log('🧪 Testing login attempts...');
    
    for (const cred of testCredentials) {
      console.log(`\n🔑 Testing: ${cred.email}`);
      
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cred.email,
          password: cred.password
        });
        
        if (authError) {
          console.log(`   ❌ Auth failed: ${authError.message}`);
          
          if (authError.message.includes('Invalid login credentials')) {
            console.log(`   💡 This user needs to be synced to Supabase Auth`);
          }
        } else if (authData.user) {
          console.log(`   ✅ Auth successful! User ID: ${authData.user.id}`);
          
          // Check if database profile exists
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (profileError) {
            console.log(`   ❌ Database profile not found: ${profileError.message}`);
          } else {
            console.log(`   ✅ Database profile exists: ${profile.name} (${profile.role})`);
          }
          
          // Sign out after test
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.log(`   ❌ Login test error: ${error.message}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Step 4: Check for common issues
    console.log('\n4️⃣ Checking for common issues...');
    
    // Check if RLS is blocking queries
    console.log('🔒 Testing RLS policies...');
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
    
    if (!currentAuthUser) {
      console.log('   ℹ️  Not currently authenticated - RLS may be blocking queries');
    } else {
      console.log(`   ℹ️  Currently authenticated as: ${currentAuthUser.email}`);
    }
    
    // Step 5: Provide recommendations
    console.log('\n5️⃣ Recommendations:');
    
    const authFailures = testCredentials.filter(async (cred) => {
      const { error } = await supabase.auth.signInWithPassword(cred);
      return error?.message.includes('Invalid login credentials');
    });
    
    if (authFailures.length > 0) {
      console.log('🔧 SOLUTION: Run the sync script to create Supabase Auth accounts');
      console.log('   Copy and paste this into console:');
      console.log(`
// Sync all users to Supabase Auth
import('/src/utils/sync-auth-users.ts')
  .then(module => module.syncAllExistingUsers())
  .then(() => {
    console.log('✅ Sync complete! Try logging in again.');
  });
      `);
    }
    
    console.log('\n📱 Alternative: Create a new test user');
    console.log('   If sync fails, create a fresh test user:');
    console.log(`
// Create fresh test user
const testUser = {
  email: 'test@example.com',
  password: 'test123456',
  name: 'Test User',
  role: 'patient'
};

supabase.auth.signUp({
  email: testUser.email,
  password: testUser.password,
  options: { data: { name: testUser.name, role: testUser.role } }
}).then(result => {
  console.log('Test user created:', result);
});
    `);
    
  } catch (error) {
    console.error('❌ Debug process failed:', error);
  }
}

// Quick login test function
async function quickLoginTest(email, password) {
  console.log(`🧪 Quick login test: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.error(`❌ Login failed: ${error.message}`);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 This user may not exist in Supabase Auth. Try running:');
        console.log('   syncAllExistingUsers()');
      }
      return false;
    }
    
    if (data.user) {
      console.log(`✅ Login successful!`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   ID: ${data.user.id}`);
      
      // Test database profile access
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error(`❌ Profile access failed: ${profileError.message}`);
      } else {
        console.log(`✅ Profile loaded: ${profile.name} (${profile.role})`);
      }
      
      return true;
    }
  } catch (error) {
    console.error(`❌ Login test error:`, error);
  }
  
  return false;
}

// Sync function (embedded for convenience)
async function syncUserToAuth(email, password, name, role) {
  console.log(`🔧 Syncing ${email} to Supabase Auth...`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { name: name, role: role }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`✅ ${email} already exists in Supabase Auth`);
        return true;
      }
      console.error(`❌ Sync failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ ${email} synced to Supabase Auth successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Sync error:`, error);
    return false;
  }
}

// Make functions available globally
window.debugLoginIssue = debugLoginIssue;
window.quickLoginTest = quickLoginTest;
window.syncUserToAuth = syncUserToAuth;

console.log('✅ Login debugger loaded! Available functions:');
console.log('  - debugLoginIssue() - Full diagnosis');
console.log('  - quickLoginTest(email, password) - Test specific login');
console.log('  - syncUserToAuth(email, password, name, role) - Sync user to Auth');
console.log('');
console.log('🚀 Run debugLoginIssue() to start diagnosis');