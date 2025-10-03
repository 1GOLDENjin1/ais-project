import { supabase } from '../lib/supabase';

// Simplified types based on database schema (avoiding complex type imports for now)
export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  reason?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_reschedule_confirmation';
  created_at?: string;
  appointment_type?: string;
  consultation_type?: string;
  duration_minutes?: number;
  fee?: number;
  notes?: string;
  cancellation_reason?: string;
  reschedule_requested_by?: string;
  reschedule_reason?: string;
  original_date?: string;
  original_time?: string;
}

export interface HealthMetric {
  id: string;
  patient_id: string;
  metric_type: string;
  value: string;
  recorded_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  diagnosis?: string;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  appointment_id?: string;
  patient_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  provider?: string;
  transaction_ref?: string;
  created_at: string;
  payment_type?: string;
  payment_method?: string;
  payment_date?: string;
  description?: string;
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  medication_name: string;
  dosage?: string;
  instructions?: string;
  created_at: string;
}

export interface LabTest {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  test_type: string;
  result?: string;
  created_at: string;
}

export interface VideoCall {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  call_link: string;
  room_id: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  recording_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationType {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'medical' | 'system' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  related_appointment_id?: string;
  related_test_id?: string;
  created_at: string;
}

// Insert/Update types for database operations
export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at'>;
export type AppointmentUpdate = Partial<AppointmentInsert>;
export type HealthMetricInsert = Omit<HealthMetric, 'id'>;
export type MedicalRecordInsert = Omit<MedicalRecord, 'id' | 'created_at'>;
export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>;
export type PaymentUpdate = Partial<PaymentInsert>;
export type PrescriptionInsert = Omit<Prescription, 'id' | 'created_at'>;
export type LabTestInsert = Omit<LabTest, 'id' | 'created_at'>;
export type VideoCallInsert = Omit<VideoCall, 'id' | 'created_at' | 'updated_at'>;
export type NotificationInsert = Omit<NotificationType, 'id' | 'created_at' | 'is_read'>;

/**
 * Appointment Operations
 */
export class AppointmentService {
  // Get appointment by ID with patient and doctor details
  static async getAppointmentById(appointmentId: string): Promise<{appointment: any | null, error?: string}> {
    try {
      // First get the appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      // Then get patient details
      let patientData = null;
      if (appointment.patient_id) {
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select(`
            *,
            users (name, email, phone)
          `)
          .eq('id', appointment.patient_id)
          .single();

        if (!patientError) {
          patientData = patient;
        }
      }

      // Then get doctor details
      let doctorData = null;
      if (appointment.doctor_id) {
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select(`
            *,
            users (name, email, phone)
          `)
          .eq('id', appointment.doctor_id)
          .single();

        if (!doctorError) {
          doctorData = doctor;
        }
      }

      // Combine all data
      const fullAppointment = {
        ...appointment,
        patients: patientData,
        doctors: doctorData
      };
      
      console.log('Full appointment data:', fullAppointment);
      return { appointment: fullAppointment };
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return { 
        appointment: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch appointment' 
      };
    }
  }

  // Update appointment details
  static async updateAppointment(appointmentId: string, updateData: {
    doctor_id?: string;
    service_type?: string;
    appointment_date?: string;
    appointment_time?: string;
    consultation_type?: string;
    duration_minutes?: number;
    fee?: number;
    notes?: string;
  }): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update appointment' 
      };
    }
  }

  // Reschedule an appointment (by patient - requires doctor confirmation)
  static async reschedule(appointmentId: string, newDate: string, newTime: string, reason?: string): Promise<{success: boolean, error?: string}> {
    try {
      // First get the original appointment details
      const { data: originalAppt, error: fetchError } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time')
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Try with new columns first, fallback to basic update if they don't exist
      try {
        const { error } = await supabase
          .from('appointments')
          .update({
            appointment_date: newDate,
            appointment_time: newTime,
            status: 'pending_reschedule_confirmation', // Requires doctor confirmation
            original_date: originalAppt.appointment_date,
            original_time: originalAppt.appointment_time,
            reschedule_requested_by: 'patient',
            reschedule_reason: reason || 'Patient requested reschedule'
          })
          .eq('id', appointmentId);

        if (error) throw error;
        return { success: true };
      } catch (newFieldError) {
        console.warn('New columns not available, using fallback reschedule:', newFieldError);
        
        // Fallback: just update the basic fields and add reason to notes
        const { error: fallbackError } = await supabase
          .from('appointments')
          .update({
            appointment_date: newDate,
            appointment_time: newTime,
            status: 'pending', // Use pending status instead of new confirmation status
            notes: `Rescheduled by patient. Original: ${originalAppt.appointment_date} ${originalAppt.appointment_time}. Reason: ${reason || 'Patient requested reschedule'}`
          })
          .eq('id', appointmentId);

        if (fallbackError) throw fallbackError;
        return { success: true };
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to reschedule appointment' };
    }
  }

  // Cancel an appointment (requires reason)
  static async cancel(appointmentId: string, reason: string): Promise<{success: boolean, error?: string}> {
    try {
      if (!reason || reason.trim() === '') {
        throw new Error('Cancellation reason is required');
      }

      // Try with new column first, fallback if it doesn't exist
      try {
        const { error } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            cancellation_reason: reason,
            notes: `Cancelled by patient: ${reason}`
          })
          .eq('id', appointmentId);

        if (error) throw error;
        return { success: true };
      } catch (newFieldError) {
        console.warn('cancellation_reason column not available, using fallback:', newFieldError);
        
        // Fallback: just update status and put reason in notes
        const { error: fallbackError } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            notes: `Cancelled by patient: ${reason}`
          })
          .eq('id', appointmentId);

        if (fallbackError) throw fallbackError;
        return { success: true };
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel appointment' };
    }
  }

  // Confirm a rescheduled appointment (by doctor/practitioner)
  static async confirmReschedule(appointmentId: string, approved: boolean, doctorNotes?: string): Promise<{success: boolean, error?: string}> {
    try {
      const updateData: any = {};
      
      if (approved) {
        updateData.status = 'confirmed';
        updateData.notes = doctorNotes || 'Reschedule approved by doctor';
      } else {
        // Reject reschedule - try to revert to original date/time
        try {
          const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select('original_date, original_time')
            .eq('id', appointmentId)
            .single();

          if (fetchError || !appointment.original_date || !appointment.original_time) {
            // If we can't get original date/time, just reject and keep current date
            updateData.status = 'confirmed';
            updateData.notes = `Reschedule declined by doctor. ${doctorNotes || 'Please contact office to reschedule.'}`;
          } else {
            // Revert to original date/time
            updateData.appointment_date = appointment.original_date;
            updateData.appointment_time = appointment.original_time;
            updateData.status = 'confirmed';
            updateData.notes = `Reschedule declined by doctor. ${doctorNotes || 'Please contact office to reschedule.'}`;
            
            // Clear reschedule fields if they exist
            try {
              updateData.original_date = null;
              updateData.original_time = null;
              updateData.reschedule_requested_by = null;
              updateData.reschedule_reason = null;
            } catch (fieldError) {
              // Ignore if these fields don't exist
              console.warn('Some reschedule fields may not exist:', fieldError);
            }
          }
        } catch (fetchError) {
          // If we can't fetch original data, just mark as confirmed with current date
          updateData.status = 'confirmed';
          updateData.notes = `Reschedule declined by doctor. ${doctorNotes || 'Please contact office to reschedule.'}`;
        }
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error confirming reschedule:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to confirm reschedule' };
    }
  }

  // Create video call session for appointment
  // NOTE: Creation must be done by a doctor via DoctorStartCall/VideoSDKService.
  // This method is retained for compatibility but will not auto-create calls from patient flows.
  static async createVideoCall(appointmentId: string, doctorId: string, patientId: string): Promise<string | null> {
    try {
      // Do NOT create a call here to avoid patient-side creation.
      // Return null to signal UI to instruct patient to obtain a code from the doctor.
      console.warn('[AppointmentService.createVideoCall] Disabled to prevent non-doctor creation. Use DoctorStartCall flow.');
      return null;
    } catch (error) {
      console.error('Error creating video call:', error);
      return null;
    }
  }

  // Start video call (used when doctor begins the session)
  static async startVideoCall(appointmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'ongoing',
          started_at: new Date().toISOString()
        })
        .eq('appointment_id', appointmentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting video call:', error);
      return false;
    }
  }

  // Get appointment with video call info
  static async getAppointmentWithVideoCall(appointmentId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          video_calls (*),
          doctors:doctor_id (
            *,
            users:user_id (*)
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching appointment with video call:', error);
      return null;
    }
  }

  // Get all appointments for a patient with complete details
  static async getPatientAppointments(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors:doctor_id (
            specialty,
            consultation_fee,
            rating,
            license_number,
            users:user_id (
              name,
              email,
              phone
            )
          ),
          video_calls (*),
          payments (*)
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  }

  // Create new appointment
  static async createAppointment(appointmentData: {
    patient_id: string;
    doctor_id: string;
    service_type: string;
    reason?: string;
    appointment_date: string;
    appointment_time: string;
    appointment_type?: string;
    consultation_type?: string;
    duration_minutes?: number;
    fee?: number;
    notes?: string;
  }): Promise<string | null> {
    try {
      console.log('🔍 AppointmentService.createAppointment called with:', appointmentData);
      
      // Try simple RPC function first (no RLS)
      try {
        console.log('🚀 Trying simple RPC function...');
        const { data: appointmentId, error: rpcError } = await supabase.rpc('create_appointment_simple', {
          p_patient_id: appointmentData.patient_id,
          p_doctor_id: appointmentData.doctor_id,
          p_service_type: appointmentData.service_type,
          p_appointment_date: appointmentData.appointment_date,
          p_appointment_time: appointmentData.appointment_time,
          p_reason: appointmentData.reason
        });

        console.log('📊 Simple RPC result:', { appointmentId, rpcError });

        if (appointmentId && !rpcError) {
          console.log('✅ Appointment created via simple RPC with ID:', appointmentId);
          return appointmentId;
        } else if (rpcError) {
          console.warn('⚠️ Simple RPC function failed:', rpcError);
        }
      } catch (rpcError) {
        console.warn('⚠️ RPC method failed, falling back to direct insert:', rpcError);
      }
      
      // Fallback to direct insert (should work now without RLS)
      console.log('🔄 Attempting direct insert (no RLS)...');
      const insertData = {
        ...appointmentData,
        status: 'pending', // Always set status
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(insertData)
        .select('id')
        .single();

      console.log('📊 Supabase insert result:', { data, error });

      if (error) {
        console.error('❌ Supabase appointment insert error:', error);
        throw error;
      }
      
      if (!data || !data.id) {
        console.error('❌ No data returned from appointment insert');
        return null;
      }
      
      console.log('✅ Appointment created successfully with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('💥 Error creating appointment:', error);
      return null;
    }
  }

  // Update appointment status
  static async updateAppointmentStatus(appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_reschedule_confirmation', notes?: string): Promise<boolean> {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return false;
    }
  }
}

/**
 * Health Metrics Operations
 */
export class HealthMetricsService {
  // Add new health metric
  static async addMetric(patientId: string, metricType: string, value: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('health_metrics')
        .insert({
          patient_id: patientId,
          metric_type: metricType,
          value: value,
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding health metric:', error);
      return false;
    }
  }

  // Get health metrics history for patient
  static async getMetricsHistory(patientId: string, metricType?: string) {
    try {
      let query = supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      return [];
    }
  }

  // Get latest metrics by type
  static async getLatestMetrics(patientId: string) {
    try {
      // Get the latest metric for each type
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Group by metric_type and get the latest for each
      const latestMetrics: { [key: string]: any } = {};
      data?.forEach(metric => {
        if (!latestMetrics[metric.metric_type]) {
          latestMetrics[metric.metric_type] = metric;
        }
      });

      return Object.values(latestMetrics);
    } catch (error) {
      console.error('Error fetching latest metrics:', error);
      return [];
    }
  }

  // Get metrics by date range
  static async getMetricsByDateRange(patientId: string, startDate: string, endDate: string, metricType?: string) {
    try {
      let query = supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: true });

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching metrics by date range:', error);
      return [];
    }
  }

  // Delete health metric
  static async deleteMetric(metricId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('health_metrics')
        .delete()
        .eq('id', metricId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting health metric:', error);
      return false;
    }
  }
}

/**
 * Medical Records Operations
 */
export class MedicalRecordsService {
  // Get medical records with prescriptions
  static async getRecordsWithPrescriptions(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctors:doctor_id (
            specialty,
            users:user_id (name)
          ),
          appointments:appointment_id (
            appointment_date,
            appointment_time,
            service_type
          ),
          prescriptions (*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return [];
    }
  }

  // Add new prescription
  static async addPrescription(medicalRecordId: string, medication: string, dosage: string, instructions: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          medical_record_id: medicalRecordId,
          medication_name: medication,
          dosage: dosage,
          instructions: instructions
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding prescription:', error);
      return false;
    }
  }
}

/**
 * Lab Tests Operations
 */
export class LabTestsService {
  // Get lab tests for patient
  static async getLabTests(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          doctors:doctor_id (
            specialty,
            users:user_id (name)
          ),
          appointments:appointment_id (
            appointment_date,
            service_type
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      return [];
    }
  }

  // Add lab test result
  static async addLabTest(patientId: string, doctorId: string, appointmentId: string, testType: string, result: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lab_tests')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId,
          test_type: testType,
          result: result
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding lab test:', error);
      return false;
    }
  }
}

/**
 * Payment Operations
 */
export class PaymentService {
  // Retry failed payment
  static async retryPayment(paymentId: string): Promise<boolean> {
    try {
      // Reset payment status to pending for retry
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'pending',
          transaction_ref: null
        })
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error retrying payment:', error);
      return false;
    }
  }

  // Mark payment as paid
  static async markPaymentPaid(paymentId: string, transactionRef: string, paymentMethod: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          transaction_ref: transactionRef,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      return false;
    }
  }

  // Get payment details with appointment info
  static async getPaymentDetails(paymentId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          appointments:appointment_id (
            appointment_date,
            appointment_time,
            service_type,
            doctors:doctor_id (
              specialty,
              users:user_id (name)
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return null;
    }
  }
}

/**
 * Patient Profile Operations
 */
export class PatientService {
  // Get complete patient profile with all related data
  static async getCompleteProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          patients (
            id,
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            blood_type,
            allergies,
            medical_history,
            insurance_provider,
            insurance_number,
            created_at,
            updated_at
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching complete patient profile:', error);
      return null;
    }
  }

  // Update user information
  static async updateUserInfo(userId: string, userData: { name?: string; phone?: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user info:', error);
      return false;
    }
  }

  // Update or create patient record
  static async updatePatientInfo(userId: string, patientData: {
    date_of_birth?: string;
    gender?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_type?: string;
    allergies?: string;
    medical_history?: string;
    insurance_provider?: string;
    insurance_number?: string;
  }): Promise<boolean> {
    try {
      // Check if patient record exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingPatient) {
        // Update existing record
        const { error } = await supabase
          .from('patients')
          .update({
            ...patientData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('patients')
          .insert({
            user_id: userId,
            ...patientData
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating patient info:', error);
      return false;
    }
  }

  // Get patient statistics for dashboard
  static async getPatientStats(patientId: string) {
    try {
      const [appointmentsResult, paymentsResult, recordsResult, metricsResult] = await Promise.all([
        supabase.from('appointments').select('id, status').eq('patient_id', patientId),
        supabase.from('payments').select('id, status, amount').eq('patient_id', patientId),
        supabase.from('medical_records').select('id').eq('patient_id', patientId),
        supabase.from('health_metrics').select('id').eq('patient_id', patientId)
      ]);

      return {
        totalAppointments: appointmentsResult.data?.length || 0,
        upcomingAppointments: appointmentsResult.data?.filter(apt => apt.status === 'confirmed' || apt.status === 'pending').length || 0,
        totalPayments: paymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
        paidPayments: paymentsResult.data?.filter(payment => payment.status === 'paid').length || 0,
        totalRecords: recordsResult.data?.length || 0,
        totalMetrics: metricsResult.data?.length || 0
      };
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      return {
        totalAppointments: 0,
        upcomingAppointments: 0,
        totalPayments: 0,
        paidPayments: 0,
        totalRecords: 0,
        totalMetrics: 0
      };
    }
  }
}

/**
 * Notification Operations
 */
export class NotificationService {
  // Create notification
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'appointment' | 'payment' | 'medical' | 'system' | 'reminder',
    priority: 'low' | 'medium' | 'high' = 'medium',
    relatedAppointmentId?: string,
    relatedTestId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: title,
          message: message,
          type: type,
          priority: priority,
          related_appointment_id: relatedAppointmentId,
          related_test_id: relatedTestId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Get unread notifications for user
  static async getUnreadNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
}

// Export all services as default object
export default {
  AppointmentService,
  HealthMetricsService,
  MedicalRecordsService,
  LabTestsService,
  PaymentService,
  NotificationService,
  PatientService
};