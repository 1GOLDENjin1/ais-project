-- Database updates for reschedule and cancellation improvements
-- Add new fields to appointments table for better reschedule and cancellation tracking

-- Add new columns if they don't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS reschedule_requested_by TEXT,
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
ADD COLUMN IF NOT EXISTS original_date DATE,
ADD COLUMN IF NOT EXISTS original_time TIME;

-- Update the status enum to include the new reschedule confirmation status
-- Note: This might need to be done differently depending on your database setup
-- For PostgreSQL with enum types:
-- ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'pending_reschedule_confirmation';

-- For databases without enum types, you might need to modify check constraints:
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
-- ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
--   CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'pending_reschedule_confirmation'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_status_reschedule ON appointments(status) 
WHERE status = 'pending_reschedule_confirmation';

CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_requested ON appointments(reschedule_requested_by) 
WHERE reschedule_requested_by IS NOT NULL;

-- Create a function to handle reschedule confirmations (optional, for better data integrity)
CREATE OR REPLACE FUNCTION confirm_reschedule(
    appointment_id UUID,
    approved BOOLEAN,
    doctor_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    original_date_val DATE;
    original_time_val TIME;
BEGIN
    -- Get original date/time from the appointment
    SELECT original_date, original_time 
    INTO original_date_val, original_time_val
    FROM appointments 
    WHERE id = appointment_id;

    IF approved THEN
        -- Approve the reschedule - keep new date/time and mark as confirmed
        UPDATE appointments 
        SET 
            status = 'confirmed',
            notes = COALESCE(doctor_notes, 'Reschedule approved by doctor'),
            -- Clear reschedule tracking fields
            original_date = NULL,
            original_time = NULL,
            reschedule_requested_by = NULL,
            reschedule_reason = NULL
        WHERE id = appointment_id;
    ELSE
        -- Deny the reschedule - revert to original date/time
        UPDATE appointments 
        SET 
            appointment_date = original_date_val,
            appointment_time = original_time_val,
            status = 'confirmed',
            notes = CONCAT('Reschedule denied: ', COALESCE(doctor_notes, 'Please contact office to reschedule')),
            -- Clear reschedule tracking fields
            original_date = NULL,
            original_time = NULL,
            reschedule_requested_by = NULL,
            reschedule_reason = NULL
        WHERE id = appointment_id;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Sample data update (optional) - add some test reschedule data if needed
-- UPDATE appointments 
-- SET status = 'pending_reschedule_confirmation',
--     reschedule_requested_by = 'patient',
--     reschedule_reason = 'Schedule conflict',
--     original_date = appointment_date,
--     original_time = appointment_time
-- WHERE id IN (SELECT id FROM appointments WHERE status = 'pending' LIMIT 1);

COMMENT ON COLUMN appointments.cancellation_reason IS 'Reason provided by patient when cancelling appointment';
COMMENT ON COLUMN appointments.reschedule_requested_by IS 'Who requested the reschedule (patient/doctor/staff)';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason for requesting reschedule';
COMMENT ON COLUMN appointments.original_date IS 'Original appointment date before reschedule';
COMMENT ON COLUMN appointments.original_time IS 'Original appointment time before reschedule';

COMMENT ON FUNCTION confirm_reschedule(UUID, BOOLEAN, TEXT) IS 'Function to approve or deny patient reschedule requests';