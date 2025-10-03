// Simple database migration check for reschedule/cancellation fields
// This script will help you determine if database migration is needed

console.log('🔍 Database Migration Check for Reschedule/Cancellation Fields');
console.log('================================================================');
console.log('');

console.log('📋 You need to add the following columns to your appointments table:');
console.log('');

const sqlCommands = [
  'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;',
  'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_requested_by TEXT;', 
  'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;',
  'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_date DATE;',
  'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_time TIME;'
];

const indexes = [
  "CREATE INDEX IF NOT EXISTS idx_appointments_status_reschedule ON appointments(status) WHERE status = 'pending_reschedule_confirmation';",
  "CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_requested ON appointments(reschedule_requested_by) WHERE reschedule_requested_by IS NOT NULL;"
];

console.log('🚀 SQL Commands to run in Supabase SQL Editor:');
console.log('');
sqlCommands.forEach((cmd, i) => {
  console.log(`${i + 1}. ${cmd}`);
});

console.log('');
console.log('🔧 Performance indexes (optional but recommended):');
console.log('');
indexes.forEach((idx, i) => {
  console.log(`${i + 1}. ${idx}`);
});

console.log('');
console.log('📝 Instructions:');
console.log('1. Go to https://supabase.com/dashboard');  
console.log('2. Open your project');
console.log('3. Navigate to SQL Editor');
console.log('4. Copy and paste the SQL commands above');
console.log('5. Execute them');
console.log('');
console.log('✅ After running these, your app will support:');
console.log('   - Appointment reschedule requests requiring doctor confirmation');
console.log('   - Required cancellation reasons');
console.log('   - Full audit trail of appointment changes');
console.log('');

// Also create a SQL file for easy copying\nimport { writeFileSync } from 'fs';

const fullSQL = `-- Database Migration: Add Reschedule and Cancellation Fields
-- Run these commands in your Supabase SQL Editor

-- Add new columns to appointments table
${sqlCommands.join('\n')}

-- Add performance indexes
${indexes.join('\n')}

-- Add comments for documentation
COMMENT ON COLUMN appointments.cancellation_reason IS 'Reason provided by patient when cancelling appointment';
COMMENT ON COLUMN appointments.reschedule_requested_by IS 'Who requested the reschedule (patient/doctor/staff)';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason for requesting reschedule';
COMMENT ON COLUMN appointments.original_date IS 'Original appointment date before reschedule';
COMMENT ON COLUMN appointments.original_time IS 'Original appointment time before reschedule';`;

writeFileSync('database-migration.sql', fullSQL);
console.log('📄 Created database-migration.sql file for easy copying');
console.log('');
console.log('🎯 Status check: The new fields are NOT yet in your database');
console.log('   Run the SQL migration above to add them.');