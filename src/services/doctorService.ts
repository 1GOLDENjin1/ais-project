/**
 * Doctor Services
 * Comprehensive service layer for all doctor-related database operations and real-time subscriptions
 */

import { supabase } from '@/lib/supabase';

// Interfaces
export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  video_consultation_fee?: number;
  license_number: string;
  rating: number;
  years_of_experience?: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start?: string;
  break_end?: string;
  max_patients_per_day: number;
}

export interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  consultation_type: 'in-person' | 'video' | 'phone';
  notes?: string;
  meeting_link?: string;
  meeting_code?: string;
  fee: number;
  patients?: {
    id: string;
    date_of_birth: string;
    gender: string;
    address: string;
    users: {
      name: string;
      email: string;
      phone: string;
    };
  };
  payments?: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    amount: number;
    payment_date?: string;
  }[];
}

export interface PatientRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  visit_date: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
}

export interface DoctorStats {
  totalPatients: number;
  todayAppointments: number;
  pendingRequests: number;
  completedConsultations: number;
  monthlyRevenue: number;
  averageRating: number;
}

class DoctorService {
  /**
   * Get doctor profile by user ID
   */
  async getDoctorProfile(userId: string): Promise<DoctorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id (
            name,
            email,
            phone
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      return null;
    }
  }

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(doctorId: string, updates: Partial<DoctorProfile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      return false;
    }
  }

  /**
   * Update doctor availability status
   */
  async updateAvailabilityStatus(doctorId: string, isAvailable: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('id', doctorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating availability status:', error);
      return false;
    }
  }

  /**
   * Get doctor schedule
   */
  async getDoctorSchedule(doctorId: string): Promise<DoctorSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
      return [];
    }
  }

  /**
   * Save or update doctor schedule
   */
  async saveDoctorSchedule(scheduleData: Partial<DoctorSchedule>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .upsert(scheduleData);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving doctor schedule:', error);
      return false;
    }
  }

  /**
   * Delete doctor schedule
   */
  async deleteDoctorSchedule(scheduleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting doctor schedule:', error);
      return false;
    }
  }

  /**
   * Get appointment requests for a doctor
   */
  async getAppointmentRequests(doctorId: string, status?: string): Promise<AppointmentRequest[]> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            *,
            users:user_id (
              name,
              email,
              phone
            )
          ),
          payments (
            status,
            amount,
            payment_date
          )
        `)
        .eq('doctor_id', doctorId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      return [];
    }
  }

  /**
   * Get today's appointments for a doctor
   */
  async getTodaysAppointments(doctorId: string): Promise<AppointmentRequest[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            *,
            users:user_id (
              name,
              email,
              phone
            )
          ),
          payments (
            status,
            amount,
            payment_date
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .eq('status', 'confirmed')
        .order('appointment_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      return [];
    }
  }

  /**
   * Accept or reject appointment request
   */
  async updateAppointmentStatus(
    appointmentId: string, 
    status: 'confirmed' | 'cancelled', 
    notes?: string,
    meetingLink?: string,
    meetingCode?: string
  ): Promise<{success: boolean, error?: string}> {
    try {
      const updateData: any = { status };
      
      if (notes) updateData.notes = notes;
      if (meetingLink) updateData.meeting_link = meetingLink;
      if (meetingCode) updateData.meeting_code = meetingCode;

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update appointment status' };
    }
  }

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string, consultationNotes?: string): Promise<{success: boolean, error?: string}> {
    try {
      const updateData: any = { 
        status: 'completed',
        completion_time: new Date().toISOString()
      };
      
      if (consultationNotes) {
        updateData.consultation_notes = consultationNotes;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error completing appointment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to complete appointment' };
    }
  }

  /**
   * Confirm or reject patient reschedule request
   */
  async confirmReschedule(
    appointmentId: string, 
    approved: boolean, 
    doctorNotes?: string
  ): Promise<{success: boolean, error?: string}> {
    try {
      // Use the AppointmentService method for consistency
      const { AppointmentService } = await import('./databaseService');
      const result = await AppointmentService.confirmReschedule(appointmentId, approved, doctorNotes);
      return result;
    } catch (error) {
      console.error('Error confirming reschedule:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to confirm reschedule' };
    }
  }

  /**
   * Generate meeting link for video consultation
   */
  generateMeetingLink(appointmentId: string): { meetingCode: string; meetingLink: string } {
    const meetingCode = `MDC-${Date.now()}`;
    const meetingLink = `${window.location.origin}/video-call?appointmentId=${appointmentId}&code=${meetingCode}`;
    
    return { meetingCode, meetingLink };
  }

  /**
   * Get patient information
   */
  async getPatientInfo(patientId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          users:user_id (
            name,
            email,
            phone
          )
        `)
        .eq('id', patientId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient info:', error);
      return null;
    }
  }

  /**
   * Get patient medical history
   */
  async getPatientMedicalHistory(patientId: string): Promise<PatientRecord[]> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient medical history:', error);
      return [];
    }
  }

  /**
   * Save medical record
   */
  async saveMedicalRecord(recordData: Partial<PatientRecord>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('medical_records')
        .insert([recordData]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving medical record:', error);
      return false;
    }
  }

  /**
   * Get patient lab tests
   */
  async getPatientLabTests(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient lab tests:', error);
      return [];
    }
  }

  /**
   * Order lab test
   */
  async orderLabTest(testData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lab_tests')
        .insert([testData]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ordering lab test:', error);
      return false;
    }
  }

  /**
   * Get patient prescriptions
   */
  async getPatientPrescriptions(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescribed_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return [];
    }
  }

  /**
   * Add prescription
   */
  async addPrescription(prescriptionData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert([prescriptionData]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding prescription:', error);
      return false;
    }
  }

  /**
   * Get patient health metrics
   */
  async getPatientHealthMetrics(patientId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient health metrics:', error);
      return [];
    }
  }

  /**
   * Save health metrics (vital signs)
   */
  async saveHealthMetrics(metricsData: any[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('health_metrics')
        .insert(metricsData);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving health metrics:', error);
      return false;
    }
  }

  /**
   * Get doctor statistics and analytics
   */
  async getDoctorStats(doctorId: string): Promise<DoctorStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      // Get total unique patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorId)
        .eq('status', 'completed');

      const totalPatients = patientsData ? new Set(patientsData.map(p => p.patient_id)).size : 0;

      // Get today's appointments
      const { data: todayData, error: todayError } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .eq('status', 'confirmed');

      const todayAppointments = todayData?.length || 0;

      // Get pending requests
      const { data: pendingData, error: pendingError } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('status', 'pending');

      const pendingRequests = pendingData?.length || 0;

      // Get completed consultations this month
      const { data: completedData, error: completedError } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('status', 'completed')
        .gte('appointment_date', `${currentMonth}-01`)
        .lt('appointment_date', `${currentMonth}-32`);

      const completedConsultations = completedData?.length || 0;

      // Get monthly revenue (sum of paid appointments this month)
      const { data: revenueData, error: revenueError } = await supabase
        .from('appointments')
        .select(`
          fee,
          payments!inner(status)
        `)
        .eq('doctor_id', doctorId)
        .eq('payments.status', 'paid')
        .gte('appointment_date', `${currentMonth}-01`)
        .lt('appointment_date', `${currentMonth}-32`);

      const monthlyRevenue = revenueData?.reduce((sum, appointment) => sum + (appointment.fee || 0), 0) || 0;

      // Get doctor profile for current rating
      const doctorProfile = await this.getDoctorProfile(doctorId);
      const averageRating = doctorProfile?.rating || 0;

      return {
        totalPatients,
        todayAppointments,
        pendingRequests,
        completedConsultations,
        monthlyRevenue,
        averageRating
      };

    } catch (error) {
      console.error('Error fetching doctor stats:', error);
      return {
        totalPatients: 0,
        todayAppointments: 0,
        pendingRequests: 0,
        completedConsultations: 0,
        monthlyRevenue: 0,
        averageRating: 0
      };
    }
  }

  /**
   * Setup real-time subscriptions for doctor
   */
  setupRealtimeSubscriptions(doctorId: string, callbacks: {
    onNewAppointment?: (appointment: any) => void;
    onPaymentUpdate?: (payment: any) => void;
    onAppointmentUpdate?: (appointment: any) => void;
  }) {
    const channels: any[] = [];

    // Subscribe to new appointments
    if (callbacks.onNewAppointment) {
      const appointmentsChannel = supabase
        .channel('doctor_appointments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `doctor_id=eq.${doctorId}`,
          },
          callbacks.onNewAppointment
        )
        .subscribe();
      
      channels.push(appointmentsChannel);
    }

    // Subscribe to appointment updates
    if (callbacks.onAppointmentUpdate) {
      const appointmentUpdatesChannel = supabase
        .channel('doctor_appointment_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments',
            filter: `doctor_id=eq.${doctorId}`,
          },
          callbacks.onAppointmentUpdate
        )
        .subscribe();
      
      channels.push(appointmentUpdatesChannel);
    }

    // Subscribe to payment updates
    if (callbacks.onPaymentUpdate) {
      const paymentsChannel = supabase
        .channel('doctor_payments')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payments',
          },
          callbacks.onPaymentUpdate
        )
        .subscribe();
      
      channels.push(paymentsChannel);
    }

    // Return cleanup function
    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }

  /**
   * Search patients by name or email
   */
  async searchPatients(doctorId: string, searchTerm: string): Promise<any[]> {
    try {
      // Get patients who have had appointments with this doctor
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patients:patient_id (
            *,
            users:user_id (
              name,
              email,
              phone
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .ilike('patients.users.name', `%${searchTerm}%`)
        .or(`patients.users.email.ilike.%${searchTerm}%`);

      if (error) throw error;

      // Remove duplicates and extract patient info
      const uniquePatients = data?.reduce((acc: any[], appointment: any) => {
        const patient = appointment.patients;
        if (patient && !acc.find(p => p.id === patient.id)) {
          acc.push(patient);
        }
        return acc;
      }, []) || [];

      return uniquePatients;
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }

  /**
   * Get appointment history for a specific patient (for this doctor)
   */
  async getPatientAppointmentHistory(doctorId: string, patientId: string): Promise<AppointmentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            *,
            users:user_id (
              name,
              email,
              phone
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient appointment history:', error);
      return [];
    }
  }

  /**
   * Schedule follow-up appointment
   */
  async scheduleFollowUp(
    doctorId: string, 
    patientId: string, 
    followUpDate: string, 
    notes: string
  ): Promise<boolean> {
    try {
      const followUpData = {
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: followUpDate,
        appointment_time: '09:00', // Default time, can be customized
        status: 'confirmed',
        consultation_type: 'in-person',
        notes: `Follow-up appointment: ${notes}`,
        fee: 0, // Follow-ups might be free or reduced fee
        is_follow_up: true
      };

      const { error } = await supabase
        .from('appointments')
        .insert([followUpData]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return false;
    }
  }
}

// Export singleton instance
export const doctorService = new DoctorService();
export default doctorService;