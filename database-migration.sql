-- Database Migration: Add Reschedule and Cancellation Fields
-- Run these commands in your Supabase SQL Editor

-- Add new columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_requested_by TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS original_time TIME;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_status_reschedule ON appointments(status) WHERE status = 'pending_reschedule_confirmation';
CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_requested ON appointments(reschedule_requested_by) WHERE reschedule_requested_by IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN appointments.cancellation_reason IS 'Reason provided by patient when cancelling appointment';
COMMENT ON COLUMN appointments.reschedule_requested_by IS 'Who requested the reschedule (patient/doctor/staff)';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason for requesting reschedule';
COMMENT ON COLUMN appointments.original_date IS 'Original appointment date before reschedule';
COMMENT ON COLUMN appointments.original_time IS 'Original appointment time before reschedule';