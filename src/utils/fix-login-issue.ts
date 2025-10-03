// Quick debug script to check what users exist and create the right ones
import { supabase } from '@/lib/supabase';

export async function debugCurrentUsers() {
  console.log('🔍 Debugging current user situation...');
  
  // Check what users exist in the database
  console.log('1️⃣ Checking users in database table...');
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: false });
    
  if (dbError) {
    console.error('❌ Error fetching users from database:', dbError);
  } else {
    console.log('👥 Users in database:', dbUsers?.length || 0);
    dbUsers?.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} (${user.role}) - ${user.name}`);
    });
  }
  
  // Test specific login that user is trying
  console.log('\n2️⃣ Testing the login you attempted...');
  const testEmail = 'paenggineda471@gmail.com';
  const testPassword = '123456';
  
  console.log(`Testing: ${testEmail} / ${testPassword}`);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (authError) {
    console.error('❌ Login failed:', authError.message);
    console.log('💡 This user does not exist in Supabase Auth');
    
    // Check if exists in database only
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (dbUser) {
      console.log('⚠️ User exists in database but not in Supabase Auth');
      console.log('   This is the mismatch issue we need to fix');
    } else {
      console.log('ℹ️ User does not exist in database either');
    }
  } else {
    console.log('✅ Login successful:', authData.user?.email);
  }
  
  return { dbUsers, authError };
}

export async function createYourSpecificUser() {
  console.log('\n🔧 Creating the specific user you want to use...');
  
  const userData = {
    email: 'paenggineda471@gmail.com',
    password: '123456',
    name: 'Rafael User',
    phone: '+63-917-555-0302',
    role: 'patient' as const
  };
  
  console.log(`Creating user: ${userData.email} with password: ${userData.password}`);
  
  try {
    // Create Supabase Auth user
    console.log('  📧 Creating Supabase Auth account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ User already exists in Supabase Auth, trying login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });
        
        if (loginError) {
          console.error('❌ Existing user login failed:', loginError.message);
          return false;
        } else {
          console.log('✅ Existing user login successful');
          await supabase.auth.signOut();
          return true;
        }
      } else {
        console.error('❌ Auth creation failed:', authError.message);
        return false;
      }
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      return false;
    }

    const userId = authData.user.id;
    console.log(`  ✅ Auth user created with ID: ${userId}`);

    // Create user profile in database
    console.log('  👤 Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        password: '', // Not used with Supabase Auth
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      return false;
    }

    console.log('  ✅ Profile created');

    // Create patient record
    console.log('  🏥 Creating patient record...');
    const { error: patientError } = await supabase
      .from('patients')
      .insert({
        user_id: userId,
        date_of_birth: '1990-01-01',
        gender: 'male',
        address: '123 Main St, Metro Manila',
      });

    if (patientError) {
      console.error('⚠️ Patient record creation failed:', patientError.message);
    } else {
      console.log('  ✅ Patient record created');
    }

    console.log('\n🎉 User creation completed successfully!');
    console.log(`✅ You can now login with: ${userData.email} / ${userData.password}`);
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugCurrentUsers = debugCurrentUsers;
  (window as any).createYourSpecificUser = createYourSpecificUser;
  
  console.log('💡 Debug functions loaded:');
  console.log('   debugCurrentUsers() - see what users exist');
  console.log('   createYourSpecificUser() - create the user you want to login with');
}