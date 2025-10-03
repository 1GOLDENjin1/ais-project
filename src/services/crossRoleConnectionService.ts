import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Enhanced cross-role connection service for healthcare system
export class CrossRoleConnectionService {
  
  // ==================== PATIENT ACCESS FOR STAFF ====================
  
  /**
   * Get all patients accessible by staff
   */
  static async getAccessiblePatients(staffId?: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          users!patients_user_id_fkey (
            id, name, email, phone, role
          ),
          health_metrics (
            id, metric_type, value, recorded_at
          )
        `)
        .eq('users.is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accessible patients:', error);
      return [];
    }
  }

  /**
   * Get specific patient data with full medical history for staff access
   */
  static async getPatientFullRecord(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          users!patients_user_id_fkey (
            id, name, email, phone, role
          ),
          appointments (
            id, appointment_date, appointment_time, status, service_type, fee, notes,
            doctors!appointments_doctor_id_fkey (
              id, specialty, consultation_fee,
              users!doctors_user_id_fkey (name, email, phone)
            )
          ),
          medical_records (
            id, diagnosis, notes, created_at,
            doctors!medical_records_doctor_id_fkey (
              id, specialty,
              users!doctors_user_id_fkey (name)
            ),
            prescriptions (id, medication_name, dosage, instructions)
          ),
          lab_tests (
            id, test_type, result, created_at,
            doctors!lab_tests_doctor_id_fkey (
              users!doctors_user_id_fkey (name)
            )
          ),
          health_metrics (
            id, metric_type, value, recorded_at
          ),
          payments (
            id, amount, status, payment_method, payment_date, description
          )
        `)
        .eq('id', patientId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient full record:', error);
      return null;
    }
  }

  // ==================== DOCTOR ACCESS FOR STAFF ====================

  /**
   * Get all doctors accessible by staff
   */
  static async getAccessibleDoctors(staffId?: string) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users!doctors_user_id_fkey (
            id, name, email, phone, role, is_active
          ),
          doctor_schedules (
            id, available_date, start_time, end_time
          )
        `)
        .eq('users.is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accessible doctors:', error);
      return [];
    }
  }

  /**
   * Get specific doctor data with schedule and patient history for staff access
   */
  static async getDoctorFullRecord(doctorId: string) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users!doctors_user_id_fkey (
            id, name, email, phone, role
          ),
          appointments (
            id, appointment_date, appointment_time, status, service_type, fee, notes,
            patients!appointments_patient_id_fkey (
              id,
              users!patients_user_id_fkey (name, email, phone)
            )
          ),
          doctor_schedules (
            id, available_date, start_time, end_time
          ),
          medical_records (
            id, diagnosis, notes, created_at,
            patients!medical_records_patient_id_fkey (
              users!patients_user_id_fkey (name)
            )
          ),
          lab_tests (
            id, test_type, result, created_at,
            patients!lab_tests_patient_id_fkey (
              users!patients_user_id_fkey (name)
            )
          )
        `)
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching doctor full record:', error);
      return null;
    }
  }

  // ==================== CROSS-ROLE COMMUNICATION ====================

  /**
   * Send message between different roles (staff to patient/doctor, etc.)
   */
  static async sendCrossRoleMessage(
    senderId: string,
    receiverId: string, 
    messageText: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    appointmentId?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: senderId,
          receiver_id: receiverId,
          message_text: messageText,
          message_type: messageType,
          appointment_id: appointmentId,
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create notification for receiver
      await this.createNotification(
        receiverId,
        'New Message',
        `You have a new message: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
        'message',
        'medium'
      );

      return data;
    } catch (error) {
      console.error('Error sending cross-role message:', error);
      throw error;
    }
  }

  /**
   * Get messages between staff and patients/doctors
   */
  static async getCrossRoleMessages(userId: string, contactId?: string) {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id, name, email, role
          ),
          receiver:receiver_id (
            id, name, email, role
          ),
          appointment:appointment_id (
            id, appointment_date, service_type
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (contactId) {
        query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cross-role messages:', error);
      return [];
    }
  }

  // ==================== APPOINTMENT MANAGEMENT ====================

  /**
   * Create appointment with staff oversight (staff can book for patients)
   */
  static async createAppointmentForPatient(
    patientId: string,
    doctorId: string,
    appointmentData: {
      service_type: string;
      appointment_date: string;
      appointment_time: string;
      reason?: string;
      consultation_type?: string;
      duration_minutes?: number;
      fee?: number;
      notes?: string;
    },
    staffId: string
  ) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: patientId,
          doctor_id: doctorId,
          ...appointmentData,
          status: 'confirmed', // Staff can directly confirm
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          patients!appointments_patient_id_fkey (
            users!patients_user_id_fkey (name, email, phone)
          ),
          doctors!appointments_doctor_id_fkey (
            users!doctors_user_id_fkey (name, email)
          )
        `)
        .single();

      if (error) throw error;

      // Send notifications to patient and doctor
      await Promise.all([
        this.createNotification(
          patientId,
          'Appointment Scheduled',
          `Your appointment for ${appointmentData.service_type} has been scheduled for ${appointmentData.appointment_date} at ${appointmentData.appointment_time}`,
          'appointment',
          'high'
        ),
        this.createNotification(
          doctorId,
          'New Appointment',
          `New appointment scheduled: ${appointmentData.service_type} on ${appointmentData.appointment_date} at ${appointmentData.appointment_time}`,
          'appointment',
          'medium'
        )
      ]);

      return data;
    } catch (error) {
      console.error('Error creating appointment for patient:', error);
      throw error;
    }
  }

  /**
   * Update appointment status with staff authority
   */
  static async updateAppointmentStatus(
    appointmentId: string,
    newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    notes?: string,
    staffId?: string
  ) {
    try {
      // First get the appointment details
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!appointments_patient_id_fkey (
            user_id,
            users!patients_user_id_fkey (name, email)
          ),
          doctors!appointments_doctor_id_fkey (
            user_id,
            users!doctors_user_id_fkey (name, email)
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update the appointment
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: newStatus,
          notes: notes ? `${appointment.notes ? appointment.notes + '; ' : ''}${notes}` : appointment.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;

      // Send notifications based on status change
      const statusMessages = {
        confirmed: 'Your appointment has been confirmed',
        cancelled: 'Your appointment has been cancelled',
        completed: 'Your appointment has been completed',
        pending: 'Your appointment status has been updated to pending'
      };

      await Promise.all([
        this.createNotification(
          appointment.patients.user_id,
          'Appointment Update',
          statusMessages[newStatus],
          'appointment',
          newStatus === 'cancelled' ? 'high' : 'medium'
        ),
        this.createNotification(
          appointment.doctors.user_id,
          'Appointment Update',
          `Appointment ${newStatus}: ${appointment.service_type} on ${appointment.appointment_date}`,
          'appointment',
          'medium'
        )
      ]);

      return data;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  // ==================== MEDICAL RECORD MANAGEMENT ====================

  /**
   * Create/update medical record with staff oversight
   */
  static async createMedicalRecord(
    patientId: string,
    doctorId: string,
    recordData: {
      diagnosis?: string;
      notes?: string;
      appointment_id?: string;
    },
    staffId: string
  ) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert([{
          patient_id: patientId,
          doctor_id: doctorId,
          ...recordData,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          patients!medical_records_patient_id_fkey (
            users!patients_user_id_fkey (name, email)
          ),
          doctors!medical_records_doctor_id_fkey (
            users!doctors_user_id_fkey (name)
          )
        `)
        .single();

      if (error) throw error;

      // Notify patient about new record
      await this.createNotification(
        patientId,
        'Medical Record Updated',
        `A new medical record has been added by ${data.doctors.users.name}`,
        'record',
        'medium'
      );

      return data;
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }
  }

  // ==================== PAYMENT MANAGEMENT ====================

  /**
   * Process payment with staff oversight
   */
  static async processPayment(
    paymentId: string,
    paymentMethod: string,
    transactionRef: string,
    staffId: string
  ) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_method: paymentMethod,
          transaction_ref: transactionRef,
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select(`
          *,
          patients!payments_patient_id_fkey (
            user_id,
            users!patients_user_id_fkey (name, email)
          ),
          appointments!payments_appointment_id_fkey (
            service_type,
            doctors!appointments_doctor_id_fkey (
              user_id,
              users!doctors_user_id_fkey (name)
            )
          )
        `)
        .single();

      if (error) throw error;

      // Notify patient about payment confirmation
      await this.createNotification(
        data.patients.user_id,
        'Payment Confirmed',
        `Your payment of ₱${data.amount} has been processed successfully`,
        'payment',
        'medium'
      );

      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION SYSTEM ====================

  /**
   * Create notification for any user
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'appointment' | 'payment' | 'message' | 'record' | 'system' = 'system',
    priority: 'low' | 'medium' | 'high' = 'medium',
    relatedAppointmentId?: string,
    relatedTestId?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type,
          priority,
          related_appointment_id: relatedAppointmentId,
          related_test_id: relatedTestId,
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user with cross-role context
   */
  static async getNotifications(userId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          appointments:related_appointment_id (
            id, appointment_date, appointment_time, service_type,
            patients!appointments_patient_id_fkey (
              users!patients_user_id_fkey (name)
            ),
            doctors!appointments_doctor_id_fkey (
              users!doctors_user_id_fkey (name)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // ==================== DASHBOARD ANALYTICS ====================

  /**
   * Get comprehensive dashboard stats for staff
   */
  static async getStaffDashboardStats() {
    try {
      const [
        appointmentsResult,
        patientsResult,
        doctorsResult,
        paymentsResult,
        staffResult
      ] = await Promise.all([
        supabase.from('appointments').select('id, status, fee').order('created_at', { ascending: false }),
        supabase.from('patients').select('id').eq('users.is_active', true),
        supabase.from('doctors').select('id, is_available').eq('users.is_active', true),
        supabase.from('payments').select('id, amount, status'),
        supabase.from('staff').select('id').eq('users.is_active', true)
      ]);

      const appointments = appointmentsResult.data || [];
      const patients = patientsResult.data || [];
      const doctors = doctorsResult.data || [];
      const payments = paymentsResult.data || [];
      const staff = staffResult.data || [];

      return {
        totalAppointments: appointments.length,
        confirmedAppointments: appointments.filter(apt => apt.status === 'confirmed').length,
        pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
        completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        availableDoctors: doctors.filter(doc => doc.is_available).length,
        totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + (payment.amount || 0), 0),
        activeStaff: staff.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        totalPayments: payments.length
      };
    } catch (error) {
      console.error('Error fetching staff dashboard stats:', error);
      return {
        totalAppointments: 0,
        confirmedAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalPatients: 0,
        totalDoctors: 0,
        availableDoctors: 0,
        totalRevenue: 0,
        activeStaff: 0,
        pendingPayments: 0,
        totalPayments: 0
      };
    }
  }

  // ==================== SEARCH & DISCOVERY ====================

  /**
   * Universal search across patients, doctors, appointments
   */
  static async universalSearch(searchTerm: string, searchType: 'all' | 'patients' | 'doctors' | 'appointments' = 'all') {
    try {
      const results: any = {
        patients: [],
        doctors: [],
        appointments: []
      };

      if (searchType === 'all' || searchType === 'patients') {
        const { data: patients } = await supabase
          .from('patients')
          .select(`
            *,
            users!patients_user_id_fkey (id, name, email, phone)
          `)
          .or(`users.name.ilike.%${searchTerm}%,users.email.ilike.%${searchTerm}%,users.phone.ilike.%${searchTerm}%`);
        
        results.patients = patients || [];
      }

      if (searchType === 'all' || searchType === 'doctors') {
        const { data: doctors } = await supabase
          .from('doctors')
          .select(`
            *,
            users!doctors_user_id_fkey (id, name, email, phone)
          `)
          .or(`users.name.ilike.%${searchTerm}%,users.email.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%`);
        
        results.doctors = doctors || [];
      }

      if (searchType === 'all' || searchType === 'appointments') {
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            *,
            patients!appointments_patient_id_fkey (
              users!patients_user_id_fkey (name, email)
            ),
            doctors!appointments_doctor_id_fkey (
              users!doctors_user_id_fkey (name),
              specialty
            )
          `)
          .or(`service_type.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
        
        results.appointments = appointments || [];
      }

      return results;
    } catch (error) {
      console.error('Error in universal search:', error);
      return {
        patients: [],
        doctors: [],
        appointments: []
      };
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to real-time updates for staff dashboard
   */
  static subscribeToStaffUpdates(callback: (payload: any) => void) {
    const subscriptions = [
      supabase
        .channel('staff-appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, callback)
        .subscribe(),
      
      supabase
        .channel('staff-patients')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, callback)
        .subscribe(),
      
      supabase
        .channel('staff-doctors')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, callback)
        .subscribe(),
      
      supabase
        .channel('staff-payments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, callback)
        .subscribe()
    ];

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }
}

export default CrossRoleConnectionService;