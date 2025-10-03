// Database-driven user management - works with existing users in your Supabase database
import { supabase } from '@/lib/supabase';

export async function checkExistingUsers() {
  console.log('🔍 Checking existing users in your Supabase database...');
  
  try {
    // Get all users from your database
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role, phone, created_at')
      .order('created_at', { ascending: false });
    
    if (dbError) {
      console.error('❌ Error fetching users from database:', dbError);
      return { users: [], error: dbError };
    }
    
    console.log(`📊 Found ${dbUsers?.length || 0} users in database:`);
    
    if (dbUsers && dbUsers.length > 0) {
      console.log('\n👥 Your existing users:');
      dbUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role})`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
      
      return { users: dbUsers, error: null };
    } else {
      console.log('ℹ️ No users found in database');
      return { users: [], error: null };
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return { users: [], error };
  }
}

export async function createSupabaseAuthForExistingUser(email: string, password: string) {
  console.log(`🔧 Creating Supabase Auth for existing database user: ${email}`);
  
  try {
    // First, check if user exists in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (dbError || !dbUser) {
      console.error('❌ User not found in database:', dbError?.message);
      return false;
    }
    
    console.log(`✅ Found user in database: ${dbUser.name} (${dbUser.role})`);
    
    // Try to create Supabase Auth account for this user
    console.log('📧 Creating Supabase Auth account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ User already exists in Supabase Auth');
        
        // Test login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (loginError) {
          console.error('❌ Login test failed:', loginError.message);
          console.log('💡 The password you provided may not match the Supabase Auth password');
          return false;
        } else {
          console.log('✅ Login test successful - user can authenticate');
          await supabase.auth.signOut();
          return true;
        }
      } else {
        console.error('❌ Supabase Auth creation failed:', authError.message);
        return false;
      }
    }
    
    if (authData.user) {
      console.log(`✅ Supabase Auth account created with ID: ${authData.user.id}`);
      
      // Update the database user record to use the Supabase Auth ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: authData.user.id })
        .eq('email', email);
      
      if (updateError) {
        console.error('⚠️ Could not update user ID in database:', updateError.message);
        console.log('💡 The user exists in both systems but with different IDs');
      } else {
        console.log('✅ Updated database user record with Supabase Auth ID');
      }
      
      // Update related records if user is a patient
      if (dbUser.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .update({ user_id: authData.user.id })
          .eq('user_id', dbUser.id);
        
        if (patientError) {
          console.log('ℹ️ No patient record to update or update failed');
        } else {
          console.log('✅ Updated patient record with new user ID');
        }
      }
      
      // Update related records if user is a doctor
      if (dbUser.role === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctors')
          .update({ user_id: authData.user.id })
          .eq('user_id', dbUser.id);
        
        if (doctorError) {
          console.log('ℹ️ No doctor record to update or update failed');
        } else {
          console.log('✅ Updated doctor record with new user ID');
        }
      }
      
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

export async function testLoginWithDatabaseUser(email: string, password: string) {
  console.log(`🧪 Testing login for database user: ${email}`);
  
  try {
    // Check if user exists in database
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!dbUser) {
      console.error('❌ User not found in database');
      return false;
    }
    
    console.log(`👤 Database user found: ${dbUser.name} (${dbUser.role})`);
    
    // Test Supabase Auth login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      console.error('❌ Supabase Auth login failed:', authError.message);
      console.log('💡 This means either:');
      console.log('   1. User does not exist in Supabase Auth');
      console.log('   2. Password is incorrect for Supabase Auth');
      console.log('   3. You need to create Supabase Auth account for this user');
      return false;
    }
    
    if (authData.user) {
      console.log('✅ Supabase Auth login successful!');
      console.log(`   Auth ID: ${authData.user.id}`);
      console.log(`   Database ID: ${dbUser.id}`);
      
      // Check if IDs match
      if (authData.user.id === dbUser.id) {
        console.log('✅ User IDs match - perfect integration!');
      } else {
        console.log('⚠️ User IDs do not match - may cause RLS issues');
        console.log('   Consider updating database user ID to match Auth ID');
      }
      
      // Test RLS by trying to access user's own data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (userError) {
        console.error('⚠️ RLS test failed - user cannot access own data:', userError.message);
      } else {
        console.log('✅ RLS test passed - user can access own data');
      }
      
      await supabase.auth.signOut();
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
}

export async function syncAllDatabaseUsersWithAuth() {
  console.log('🔄 Syncing all database users with Supabase Auth...');
  
  const { users } = await checkExistingUsers();
  
  if (users.length === 0) {
    console.log('ℹ️ No users to sync');
    return;
  }
  
  console.log('\n🔧 Starting sync process...');
  console.log('💡 You will need to provide passwords for each user');
  
  for (const user of users) {
    console.log(`\n👤 Processing user: ${user.email} (${user.name})`);
    
    // For demo purposes, using a default password
    // In real usage, you'd prompt for or use known passwords
    const defaultPassword = 'password123';
    
    console.log(`   Attempting to sync with password: ${defaultPassword}`);
    const success = await createSupabaseAuthForExistingUser(user.email, defaultPassword);
    
    if (success) {
      console.log(`   ✅ ${user.email} sync completed`);
    } else {
      console.log(`   ❌ ${user.email} sync failed`);
    }
  }
  
  console.log('\n🎉 Sync process completed!');
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).checkExistingUsers = checkExistingUsers;
  (window as any).createSupabaseAuthForExistingUser = createSupabaseAuthForExistingUser;
  (window as any).testLoginWithDatabaseUser = testLoginWithDatabaseUser;
  (window as any).syncAllDatabaseUsersWithAuth = syncAllDatabaseUsersWithAuth;
  
  console.log('💡 Database user management functions loaded:');
  console.log('   checkExistingUsers() - see what users exist in your database');
  console.log('   testLoginWithDatabaseUser(email, password) - test login for specific user');
  console.log('   createSupabaseAuthForExistingUser(email, password) - sync database user to Auth');
  console.log('   syncAllDatabaseUsersWithAuth() - sync all users (uses default password)');
}