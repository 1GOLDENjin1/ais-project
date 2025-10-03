// ===================================================
// AUTO-CONFIRMATION SERVICE
// Automated appointment confirmation system
// ===================================================

import { supabase } from '@/lib/supabase';
import { notificationService } from './notificationService';

interface AppointmentForAutoConfirm {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  created_at: string;
  patients: {
    user_id: string;
    users: {
      name: string;
      email: string;
    };
  };
  doctors: {
    user_id: string;
    users: {
      name: string;
    };
  };
}

class AutoConfirmationService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly AUTO_CONFIRM_DELAY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  private readonly CHECK_INTERVAL = 10 * 60 * 1000; // Check every 10 minutes

  /**
   * Start the auto-confirmation service
   * This will check for pending appointments every 10 minutes
   */
  start() {
    if (this.intervalId) {
      this.stop(); // Stop any existing interval
    }

    console.log('🤖 Auto-confirmation service started');
    
    // Run initial check
    this.checkPendingAppointments();
    
    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.checkPendingAppointments();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop the auto-confirmation service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Auto-confirmation service stopped');
    }
  }

  /**
   * Check for pending appointments that are ready for auto-confirmation
   */
  private async checkPendingAppointments() {
    try {
      console.log('🔍 Checking for appointments ready for auto-confirmation...');

      // Calculate the cutoff time (2 hours ago)
      const cutoffTime = new Date();
      cutoffTime.setTime(cutoffTime.getTime() - this.AUTO_CONFIRM_DELAY);

      // Get pending appointments older than 2 hours
      const { data: pendingAppointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          doctor_id,
          service_type,
          appointment_date,
          appointment_time,
          appointment_type,
          created_at,
          patients!inner (
            user_id,
            users!inner (
              name,
              email
            )
          ),
          doctors!inner (
            user_id,
            users!inner (
              name
            )
          )
        `)
        .eq('status', 'pending')
        .lt('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching pending appointments:', error);
        return;
      }

      if (!pendingAppointments || pendingAppointments.length === 0) {
        console.log('✅ No appointments ready for auto-confirmation');
        return;
      }

      console.log(`📋 Found ${pendingAppointments.length} appointment(s) ready for auto-confirmation`);

      // Process each appointment
      for (const appointment of pendingAppointments) {
        await this.autoConfirmAppointment(appointment);
      }

    } catch (error) {
      console.error('❌ Error in checkPendingAppointments:', error);
    }
  }

  /**
   * Auto-confirm a specific appointment
   */
  private async autoConfirmAppointment(appointment: AppointmentForAutoConfirm) {
    try {
      console.log(`🔄 Auto-confirming appointment ${appointment.id} for ${appointment.patients.users.name}`);

      // Check for conflicts before confirming
      const hasConflicts = await this.checkForConflicts(appointment);
      
      if (hasConflicts) {
        console.log(`⚠️ Conflicts detected for appointment ${appointment.id}, skipping auto-confirmation`);
        await this.notifyStaffOfConflict(appointment);
        return;
      }

      // Update appointment status to confirmed
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          doctor_notes: 'Auto-confirmed by system after 2 hours (no conflicts detected)'
        })
        .eq('id', appointment.id);

      if (updateError) {
        console.error(`❌ Error updating appointment ${appointment.id}:`, updateError);
        return;
      }

      // Send notifications to all parties
      await this.sendAutoConfirmationNotifications(appointment);

      console.log(`✅ Successfully auto-confirmed appointment ${appointment.id}`);

    } catch (error) {
      console.error(`❌ Error auto-confirming appointment ${appointment.id}:`, error);
    }
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkForConflicts(appointment: AppointmentForAutoConfirm): Promise<boolean> {
    try {
      // Check for same doctor, same date/time, confirmed appointments
      const { data: conflictingAppointments, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', appointment.doctor_id)
        .eq('appointment_date', appointment.appointment_date)
        .eq('appointment_time', appointment.appointment_time)
        .eq('status', 'confirmed')
        .neq('id', appointment.id);

      if (error) {
        console.error('Error checking conflicts:', error);
        return true; // Err on the side of caution
      }

      return (conflictingAppointments && conflictingAppointments.length > 0);
    } catch (error) {
      console.error('Error in checkForConflicts:', error);
      return true;
    }
  }

  /**
   * Send notifications after auto-confirmation
   */
  private async sendAutoConfirmationNotifications(appointment: AppointmentForAutoConfirm) {
    try {
      const appointmentTimeFormatted = new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Patient notification
      await notificationService.createNotification({
        user_id: appointment.patients.user_id,
        title: '✅ Appointment Auto-Confirmed',
        message: `Good news! Your ${appointment.service_type} appointment with Dr. ${appointment.doctors.users.name} on ${appointment.appointment_date} at ${appointmentTimeFormatted} has been automatically confirmed. Please arrive 15 minutes early.`,
        type: 'appointment',
        priority: 'high',
        is_read: false,
        related_appointment_id: appointment.id
      });

      // Doctor notification
      await notificationService.createNotification({
        user_id: appointment.doctors.user_id,
        title: '🤖 Appointment Auto-Confirmed',
        message: `System has automatically confirmed your appointment with ${appointment.patients.users.name} on ${appointment.appointment_date} at ${appointmentTimeFormatted}. No conflicts detected.`,
        type: 'appointment',
        priority: 'medium',
        is_read: false,
        related_appointment_id: appointment.id
      });

      // Staff notification
      const { data: staff } = await supabase
        .from('staff')
        .select('user_id')
        .limit(3);

      if (staff) {
        for (const staffMember of staff) {
          await notificationService.createNotification({
            user_id: staffMember.user_id,
            title: '🤖 Auto-Confirmation Completed',
            message: `System auto-confirmed appointment: ${appointment.patients.users.name} → Dr. ${appointment.doctors.users.name} on ${appointment.appointment_date}. No conflicts detected.`,
            type: 'system',
            priority: 'low',
            is_read: false,
            related_appointment_id: appointment.id
          });
        }
      }

      console.log(`📧 Auto-confirmation notifications sent for appointment ${appointment.id}`);

    } catch (error) {
      console.error('Error sending auto-confirmation notifications:', error);
    }
  }

  /**
   * Notify staff of conflicts that prevented auto-confirmation
   */
  private async notifyStaffOfConflict(appointment: AppointmentForAutoConfirm) {
    try {
      const { data: staff } = await supabase
        .from('staff')
        .select('user_id')
        .limit(5);

      if (staff) {
        for (const staffMember of staff) {
          await notificationService.createNotification({
            user_id: staffMember.user_id,
            title: '⚠️ Auto-Confirmation Blocked - Conflict Detected',
            message: `Cannot auto-confirm appointment for ${appointment.patients.users.name} with Dr. ${appointment.doctors.users.name} on ${appointment.appointment_date}. Manual review required due to scheduling conflicts.`,
            type: 'system',
            priority: 'high',
            is_read: false,
            related_appointment_id: appointment.id
          });
        }
      }

      console.log(`⚠️ Staff notified of conflict for appointment ${appointment.id}`);

    } catch (error) {
      console.error('Error notifying staff of conflict:', error);
    }
  }

  /**
   * Manually trigger auto-confirmation check (for testing or immediate execution)
   */
  async triggerManualCheck() {
    console.log('🔄 Manual auto-confirmation check triggered');
    await this.checkPendingAppointments();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.intervalId !== null,
      autoConfirmDelay: this.AUTO_CONFIRM_DELAY / 1000 / 60 / 60, // in hours
      checkInterval: this.CHECK_INTERVAL / 1000 / 60 // in minutes
    };
  }
}

// Create and export singleton instance
export const autoConfirmationService = new AutoConfirmationService();

// Auto-start the service when the module is imported
// You may want to conditionally start this based on environment or user role
if (typeof window !== 'undefined') {
  // Only start in browser environment
  autoConfirmationService.start();
  
  // Stop service when page unloads
  window.addEventListener('beforeunload', () => {
    autoConfirmationService.stop();
  });
}

export default autoConfirmationService;