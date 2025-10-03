# Appointment Reschedule & Cancellation Enhancement Implementation

## Overview

This implementation enhances the appointment system to:
1. **Require doctor/practitioner confirmation** when patients reschedule appointments
2. **Require cancellation reasons** when patients cancel appointments
3. **Improve the user experience** with better status management and notifications

## ✅ Changes Implemented

### 1. Database Service Updates (`src/services/databaseService.ts`)

#### Enhanced Appointment Interface
```typescript
export interface Appointment {
  // ... existing fields ...
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_reschedule_confirmation';
  cancellation_reason?: string;
  reschedule_requested_by?: string;
  reschedule_reason?: string;
  original_date?: string;
  original_time?: string;
}
```

#### Updated Methods
- **`reschedule()`**: Now sets status to `pending_reschedule_confirmation` and stores original date/time
- **`cancel()`**: Now requires a cancellation reason (throws error if empty)
- **`confirmReschedule()`**: New method for doctors to approve/deny reschedule requests
- **`updateAppointmentStatus()`**: Updated to support new status types

### 2. UI Component Updates

#### Reschedule Modal (`src/components/RescheduleAppointmentModal.tsx`)
- ✅ Now passes reschedule reason to the backend
- ✅ Updated success message to indicate doctor confirmation needed
- ✅ Improved user experience with clearer messaging

#### Cancellation Modal (`src/components/CancelAppointmentModal.tsx`)
- ✅ Already requires cancellation reason (was working correctly)
- ✅ Provides multiple reason options + custom reason field
- ✅ Stores reason in database via updated `cancel()` method

#### Patient Dashboard (`src/pages/PatientDashboardEnhanced.tsx`)
- ✅ Removed `window.confirm()` calls for cancellations
- ✅ Added proper cancel modal state management
- ✅ Updated cancel handlers to use the proper modal flow

#### New Cancel Button Component (`src/components/CancelAppointmentButton.tsx`)
- ✅ Created reusable cancel button that triggers the modal
- ✅ Handles all appointment cancellation logic properly
- ✅ Can be easily integrated into other components

### 3. Doctor Confirmation Interface Updates (`src/components/DoctorConfirmationInterface.tsx`)

#### Enhanced Query
- ✅ Now fetches appointments with `pending_reschedule_confirmation` status
- ✅ Added reschedule-related fields to the data fetch
- ✅ Updated interface to handle reschedule requests

#### New Functionality
- ✅ Added `confirmReschedule()` function for approving/denying reschedules
- ✅ Added `sendRescheduleConfirmationNotifications()` for patient updates
- ✅ Enhanced UI to show reschedule requests alongside regular pending appointments

### 4. Database Schema Updates

#### SQL Migration (`database_updates_reschedule_cancel.sql`)
```sql
-- Add new columns for enhanced tracking
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS reschedule_requested_by TEXT,
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
ADD COLUMN IF NOT EXISTS original_date DATE,
ADD COLUMN IF NOT EXISTS original_time TIME;

-- Create helper function for reschedule confirmations
CREATE OR REPLACE FUNCTION confirm_reschedule(
    appointment_id UUID,
    approved BOOLEAN,
    doctor_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
```

## 🔄 New Workflow

### Patient Reschedule Flow
1. Patient clicks "Reschedule" on appointment
2. Selects new date/time and provides reason
3. System updates appointment to `pending_reschedule_confirmation` status
4. Original date/time stored in `original_date`/`original_time` fields
5. Doctor receives notification of reschedule request

### Doctor Confirmation Flow
1. Doctor sees reschedule requests in their confirmation interface
2. Doctor can approve or deny the reschedule
3. **If approved**: Appointment keeps new date/time, status → `confirmed`
4. **If denied**: Appointment reverts to original date/time, status → `confirmed`
5. Patient receives notification of decision

### Patient Cancellation Flow
1. Patient clicks "Cancel" on appointment
2. Modal opens requiring cancellation reason
3. Patient selects from predefined reasons or provides custom reason
4. System updates appointment to `cancelled` status
5. Reason stored in `cancellation_reason` field
6. Refund processing logic can use the reason for decision making

## 📱 User Experience Improvements

### For Patients
- ✅ **Clear expectations**: Told that reschedules need doctor approval
- ✅ **Required reasoning**: Must provide reasons for both reschedules and cancellations
- ✅ **Better feedback**: Receive notifications when doctor responds to reschedule requests
- ✅ **No surprise cancellations**: Can't accidentally cancel without providing reason

### For Doctors/Staff
- ✅ **Better control**: Can approve/deny reschedule requests
- ✅ **More information**: See patient reasons for reschedules and cancellations
- ✅ **Unified interface**: All pending items (new appointments + reschedules) in one place
- ✅ **Audit trail**: Full history of appointment changes with reasons

## 🚀 Usage Examples

### Using the New Cancel Button Component
```tsx
import { CancelAppointmentButton } from '@/components/CancelAppointmentButton';

<CancelAppointmentButton
  appointment={appointment}
  onCancelled={() => refreshAppointments()}
  variant="outline"
  size="sm"
/>
```

### Checking for Reschedule Confirmations in Doctor Interface
```typescript
// Query will now include appointments with status 'pending_reschedule_confirmation'
const pendingItems = await supabase
  .from('appointments')
  .select('*')
  .in('status', ['pending', 'pending_reschedule_confirmation'])
```

## 🔧 Installation Steps

1. **Run the database migration**:
   ```sql
   -- Execute the contents of database_updates_reschedule_cancel.sql
   ```

2. **Update your appointment status handling** in any custom components to account for the new `pending_reschedule_confirmation` status

3. **Import and use the new CancelAppointmentButton** in places where you need cancellation functionality

## ⚠️ Important Notes

1. **Database Enum Types**: If your database uses enum types for status, you may need to update the enum definition manually
2. **Existing Data**: Current appointments will continue to work normally
3. **Backwards Compatibility**: All existing functionality is preserved
4. **Notifications**: The system sends notifications for reschedule decisions - ensure your notification service is working

## 🎯 Benefits Achieved

1. **Better Patient Communication**: Patients know their reschedule requests need approval
2. **Improved Data Quality**: All cancellations and reschedules now have associated reasons
3. **Enhanced Doctor Control**: Doctors can manage their schedule more effectively
4. **Audit Trail**: Complete history of appointment changes with reasons
5. **Better User Experience**: Cleaner, more predictable flows for both patients and staff

This implementation provides a professional appointment management system with proper approval workflows and comprehensive tracking of all appointment changes.