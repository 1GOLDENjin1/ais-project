-- Safe Database Migration: Add Reschedule and Cancellation Fields
-- This version handles potential failures more gracefully

-- Check if we can access the appointments table first
SELECT COUNT(*) as appointment_count FROM appointments LIMIT 1;

-- Add new columns one by one with error handling
-- Note: If any of these fail, it's likely because the column already exists or there are permission issues

-- 1. Add cancellation_reason column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='cancellation_reason') THEN
        ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT;
        RAISE NOTICE 'Added cancellation_reason column';
    ELSE
        RAISE NOTICE 'cancellation_reason column already exists';
    END IF;
END $$;

-- 2. Add reschedule_requested_by column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reschedule_requested_by') THEN
        ALTER TABLE appointments ADD COLUMN reschedule_requested_by TEXT;
        RAISE NOTICE 'Added reschedule_requested_by column';
    ELSE
        RAISE NOTICE 'reschedule_requested_by column already exists';
    END IF;
END $$;

-- 3. Add reschedule_reason column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reschedule_reason') THEN
        ALTER TABLE appointments ADD COLUMN reschedule_reason TEXT;
        RAISE NOTICE 'Added reschedule_reason column';
    ELSE
        RAISE NOTICE 'reschedule_reason column already exists';
    END IF;
END $$;

-- 4. Add original_date column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='original_date') THEN
        ALTER TABLE appointments ADD COLUMN original_date DATE;
        RAISE NOTICE 'Added original_date column';
    ELSE
        RAISE NOTICE 'original_date column already exists';
    END IF;
END $$;

-- 5. Add original_time column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='original_time') THEN
        ALTER TABLE appointments ADD COLUMN original_time TIME;
        RAISE NOTICE 'Added original_time column';
    ELSE
        RAISE NOTICE 'original_time column already exists';
    END IF;
END $$;

-- Create indexes for better performance (these are safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_requested ON appointments(reschedule_requested_by) WHERE reschedule_requested_by IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN appointments.cancellation_reason IS 'Reason provided by patient when cancelling appointment';
COMMENT ON COLUMN appointments.reschedule_requested_by IS 'Who requested the reschedule (patient/doctor/staff)';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason for requesting reschedule';
COMMENT ON COLUMN appointments.original_date IS 'Original appointment date before reschedule';
COMMENT ON COLUMN appointments.original_time IS 'Original appointment time before reschedule';

-- Verify the migration worked
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
    AND column_name IN ('cancellation_reason', 'reschedule_requested_by', 'reschedule_reason', 'original_date', 'original_time')
ORDER BY column_name;