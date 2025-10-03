// Database migration script to add reschedule and cancellation fields
// Run this with: node run-migration.js

import { supabase } from './src/lib/supabase.js';

async function runMigration() {
  console.log('🚀 Starting database migration for reschedule/cancellation fields...');

  try {
    // First, let's check the current structure of the appointments table
    console.log('📋 Checking current appointments table structure...');
    
    const { data: currentData, error: checkError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log('❌ Error accessing appointments table:', checkError);
      return;
    }

    console.log('✅ Current appointments table accessible');
    if (currentData && currentData.length > 0) {
      console.log('📊 Sample appointment record:', currentData[0]);
      console.log('🔍 Current fields:', Object.keys(currentData[0]));
    }

    // Check if new fields already exist
    const sampleRecord = currentData?.[0];
    const hasNewFields = sampleRecord && (
      'cancellation_reason' in sampleRecord ||
      'reschedule_requested_by' in sampleRecord ||
      'reschedule_reason' in sampleRecord ||
      'original_date' in sampleRecord ||
      'original_time' in sampleRecord
    );

    if (hasNewFields) {
      console.log('✅ New fields already exist in the database!');
      return;
    }

    console.log('🔧 New fields not found. You need to run the SQL migration.');
    console.log('\n📝 Please execute the following SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('-- Add new columns to appointments table');
    console.log('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;');
    console.log('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_requested_by TEXT;');
    console.log('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;');
    console.log('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_date DATE;');
    console.log('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_time TIME;');
    console.log('');
    console.log('-- Update status enum to include new reschedule confirmation status');
    console.log('-- Note: This might fail if you\'re using enum types. If so, you may need to:');
    console.log('-- 1. Drop the existing constraint');
    console.log('-- 2. Add a new one with the additional status');
    console.log('');
    console.log('-- Create indexes for performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_appointments_status_reschedule ON appointments(status) WHERE status = \'pending_reschedule_confirmation\';');
    console.log('CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_requested ON appointments(reschedule_requested_by) WHERE reschedule_requested_by IS NOT NULL;');
    
    console.log('\n🌐 Go to your Supabase dashboard:');
    console.log('1. Open https://supabase.com/dashboard');
    console.log('2. Go to your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Run the SQL commands above');
    console.log('5. Then re-run this script to verify');

  } catch (error) {
    console.error('💥 Migration error:', error);
  }
}

// Test if we can create a test appointment with new fields
async function testNewFields() {
  console.log('\n🧪 Testing new fields...');
  
  try {
    // Try to update an existing appointment with new fields
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);

    if (fetchError) {
      console.log('❌ Cannot fetch appointments:', fetchError);
      return;
    }

    if (!appointments || appointments.length === 0) {
      console.log('ℹ️ No appointments found to test with');
      return;
    }

    const testId = appointments[0].id;
    console.log(`🎯 Testing with appointment ID: ${testId}`);

    // Try to update with new fields
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        reschedule_reason: 'Test reschedule reason',
        reschedule_requested_by: 'patient'
      })
      .eq('id', testId);

    if (updateError) {
      console.log('❌ Cannot update with new fields:', updateError);
      console.log('🔧 This confirms the database migration is needed');
    } else {
      console.log('✅ Successfully updated appointment with new fields!');
      console.log('✅ Database migration appears to be complete');
      
      // Clean up test data
      await supabase
        .from('appointments')
        .update({
          reschedule_reason: null,
          reschedule_requested_by: null
        })
        .eq('id', testId);
    }

  } catch (error) {
    console.log('❌ Test error:', error);
  }
}

// Main execution
runMigration().then(() => {
  testNewFields();
});