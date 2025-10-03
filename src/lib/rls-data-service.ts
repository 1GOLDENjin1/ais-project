// rls-data-service.ts
// Role-Based Data Access Service
// This service provides secure data access methods that work with RLS policies and views

import { supabase } from './supabase';
import {
  UserRole,
  PatientAppointmentView,
  DoctorAppointmentView,
  StaffAppointmentView,
  AvailableDoctorView,
  AvailableServiceView,
  ActivePackageView,
  PatientDashboardSummary,
  DoctorDashboardSummary,
  StaffDashboardSummary,
  VIEW_NAMES,
  RPC_FUNCTIONS,
  ApiResponse,
  CreateAppointmentInput,
  CreateMedicalRecordInput,
  CreateLabTestInput,
  CreatePrescriptionInput,
  CreateHealthMetricInput,
  AppointmentFilters,
  DoctorFilters,
  ServiceFilters,
} from '@/types/rls-types';

class RLSDataService {
  // ===============================================
  // AUTHENTICATION & USER MANAGEMENT
  // ===============================================

  async getCurrentUser() {
    // Try Supabase Auth first
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      // Get user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError) return profile;
    }

    // Fallback: check if there's a user in localStorage (from AuthContext)
    try {
      const authUser = localStorage.getItem('currentUser');
      if (authUser) {
        const userData = JSON.parse(authUser);
        console.log('Using fallback user from localStorage:', userData);
        
        // Get full profile from database
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userData.id)
          .single();
        
        if (!profileError) return profile;
        
        // If profile lookup fails, return the cached user data
        return userData;
      }
    } catch (e) {
      console.log('No fallback user found:', e);
    }

    return null;
  }

  async getCurrentUserRole(): Promise<UserRole | null> {
    const user = await this.getCurrentUser();
    return user?.role || null;
  }

  // Admin: fetch all users including password field (for hash visibility in admin only UIs)
  async getAllUsersWithPassword(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    password?: string | null;
    is_active?: boolean | null;
  }>> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, password, is_active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Admin: update user basic fields
  async updateUser(
    id: string,
    updates: Partial<{ name: string; email: string; role: string; is_active: boolean }>
  ) {
    const { data, error } = await supabase
      .from('users')
      .update(updates as any)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  // Admin: toggle user activation status
  async setUserActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id, is_active')
      .single();
    if (error) throw error;
    return data;
  }



  // ===============================================
  // PUBLIC DATA ACCESS (no authentication required)
  // ===============================================

  async getPublicDoctors(): Promise<AvailableDoctorView[]> {
    try {
      // Try RPC first (bypasses RLS securely)
      const { data, error } = await supabase.rpc(RPC_FUNCTIONS.GET_PUBLIC_DOCTORS);
      if (data && !error) return data;

      // Fallback to view
      const { data: viewData, error: viewError } = await supabase
        .from(VIEW_NAMES.AVAILABLE_DOCTORS)
        .select('*');
      
      return viewData || [];
    } catch (error) {
      console.error('Error fetching public doctors:', error);
      return [];
    }
  }

  async getAvailableServices(filters?: ServiceFilters): Promise<AvailableServiceView[]> {
    try {
      let query = supabase.from(VIEW_NAMES.AVAILABLE_SERVICES).select('*');

      if (filters) {
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.price_max) {
          query = query.lte('price', filters.price_max);
        }
        if (filters.home_service !== undefined) {
          query = query.eq('home_service_available', filters.home_service);
        }
      }

      const { data, error } = await query.order('service_name');
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching available services:', error);
      return [];
    }
  }

  async getActivePackages(): Promise<ActivePackageView[]> {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.ACTIVE_PACKAGES)
        .select('*')
        .order('package_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active packages:', error);
      return [];
    }
  }

  // ===============================================
  // PATIENT DATA ACCESS
  // ===============================================

  async getPatientAppointments(filters?: AppointmentFilters): Promise<PatientAppointmentView[]> {
    try {
      let query = supabase.from(VIEW_NAMES.PATIENT_APPOINTMENTS).select('*');

      if (filters) {
        if (filters.status) {
          query = query.in('status', filters.status);
        }
        if (filters.date_from) {
          query = query.gte('appointment_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('appointment_date', filters.date_to);
        }
        if (filters.doctor_id) {
          query = query.eq('doctor_id', filters.doctor_id);
        }
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  }

  async getPatientMedicalRecords() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.PATIENT_MEDICAL_RECORDS)
        .select('*')
        .order('record_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient medical records:', error);
      return [];
    }
  }

  async getPatientLabTests() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.PATIENT_LAB_TESTS)
        .select('*')
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient lab tests:', error);
      return [];
    }
  }

  async getPatientPrescriptions() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.PATIENT_PRESCRIPTIONS)
        .select('*')
        .order('prescribed_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return [];
    }
  }

  async getPatientPayments() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.PATIENT_PAYMENTS)
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient payments:', error);
      return [];
    }
  }

  async getPatientDashboardSummary(): Promise<PatientDashboardSummary | null> {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.PATIENT_DASHBOARD)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient dashboard summary:', error);
      return null;
    }
  }

  // ===============================================
  // DOCTOR DATA ACCESS
  // ===============================================

  async getDoctorAppointments(filters?: AppointmentFilters): Promise<DoctorAppointmentView[]> {
    try {
      let query = supabase.from(VIEW_NAMES.DOCTOR_APPOINTMENTS).select('*');

      if (filters) {
        if (filters.status) {
          query = query.in('status', filters.status);
        }
        if (filters.date_from) {
          query = query.gte('appointment_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('appointment_date', filters.date_to);
        }
        if (filters.patient_id) {
          query = query.eq('patient_id', filters.patient_id);
        }
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      return [];
    }
  }

  async getDoctorPatients() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.DOCTOR_PATIENTS)
        .select('*')
        .order('last_appointment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }

  async getDoctorMedicalRecords() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.DOCTOR_MEDICAL_RECORDS)
        .select('*')
        .order('record_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor medical records:', error);
      return [];
    }
  }

  async getDoctorLabTests() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.DOCTOR_LAB_TESTS)
        .select('*')
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor lab tests:', error);
      return [];
    }
  }

  async getDoctorDashboardSummary(): Promise<DoctorDashboardSummary | null> {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.DOCTOR_DASHBOARD)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching doctor dashboard summary:', error);
      return null;
    }
  }

  // ===============================================
  // STAFF/ADMIN DATA ACCESS
  // ===============================================

  async getStaffAppointments(filters?: AppointmentFilters): Promise<StaffAppointmentView[]> {
    try {
      let query = supabase.from(VIEW_NAMES.STAFF_APPOINTMENTS).select('*');

      if (filters) {
        if (filters.status) {
          query = query.in('status', filters.status);
        }
        if (filters.date_from) {
          query = query.gte('appointment_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('appointment_date', filters.date_to);
        }
        if (filters.doctor_id) {
          query = query.eq('doctor_id', filters.doctor_id);
        }
        if (filters.patient_id) {
          query = query.eq('patient_id', filters.patient_id);
        }
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching staff appointments:', error);
      return [];
    }
  }

  async getStaffPatients() {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.STAFF_PATIENTS)
        .select('*')
        .order('last_appointment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching staff patients:', error);
      return [];
    }
  }

  async getStaffDoctors(filters?: DoctorFilters) {
    try {
      let query = supabase.from(VIEW_NAMES.STAFF_DOCTORS).select('*');

      if (filters) {
        if (filters.specialty) {
          query = query.eq('specialty', filters.specialty);
        }
        if (filters.rating_min) {
          query = query.gte('rating', filters.rating_min);
        }
        if (filters.fee_max) {
          query = query.lte('consultation_fee', filters.fee_max);
        }
      }

      const { data, error } = await query.order('doctor_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching staff doctors:', error);
      return [];
    }
  }

  async getStaffDashboardSummary(): Promise<StaffDashboardSummary | null> {
    try {
      const { data, error } = await supabase
        .from(VIEW_NAMES.STAFF_DASHBOARD)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching staff dashboard summary:', error);
      return null;
    }
  }

  // ===============================================
  // CREATE OPERATIONS
  // ===============================================

  async createAppointment(appointmentData: CreateAppointmentInput): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 Starting appointment creation process...');
      console.log('📝 Appointment data received:', appointmentData);

      // Get current user to set patient_id
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('❌ No user found - authentication required');
        return { success: false, error: 'User not authenticated. Please log in and try again.' };
      }

      console.log('✅ User authenticated:', { id: user.id, role: user.role, name: user.name });

      // Convert time format if needed (12-hour to 24-hour)
      let appointmentTime = appointmentData.appointment_time;
      if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
        const convertTo24Hour = (time12h: string): string => {
          const [time, modifier] = time12h.split(' ');
          let [hours, minutes] = time.split(':');
          if (hours === '12') {
            hours = '00';
          }
          if (modifier === 'PM') {
            hours = (parseInt(hours, 10) + 12).toString();
          }
          return `${hours}:${minutes}:00`;
        };
        appointmentTime = convertTo24Hour(appointmentTime);
        console.log('⏰ Converted time format:', appointmentTime);
      }

      // Attempt 1: Try RPC function first (bypasses RLS)
      console.log('🚀 Attempting appointment creation via RPC function...');
      try {
        const rpcResult = await supabase.rpc('create_appointment_secure', {
          p_doctor_id: appointmentData.doctor_id,
          p_service_type: appointmentData.service_type,
          p_appointment_date: appointmentData.appointment_date,
          p_appointment_time: appointmentTime,
          p_reason: appointmentData.reason || 'Appointment booked through online system'
        });
        
        console.log('📊 RPC Result:', rpcResult);
        
        if (rpcResult.data && !rpcResult.error) {
          const result = typeof rpcResult.data === 'string' ? JSON.parse(rpcResult.data) : rpcResult.data;
          console.log('✅ Appointment created successfully via RPC:', result);
          return { success: true, data: result, message: 'Appointment created successfully' };
        } else if (rpcResult.error) {
          console.log('⚠️ RPC function failed:', rpcResult.error);
          // Continue to fallback method
        }
      } catch (rpcError) {
        console.log('⚠️ RPC method failed or not available:', rpcError);
        // Continue to fallback method
      }
      
      // Attempt 2: Manual patient creation + direct insert
      console.log('🔄 Attempting fallback method with direct insert...');

      // Get or create patient record for current user
      let { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('👤 Patient lookup result:', { patient, patientError });

      // If patient not found, create one
      if (patientError || !patient) {
        console.log('👤 Creating patient profile for user:', user.id);
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            date_of_birth: null,
            gender: null,
            address: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();
          
        console.log('👤 Patient creation result:', { newPatient, createError });
        
        if (createError) {
          console.error('❌ Error creating patient profile:', createError);
          return { success: false, error: `Failed to create patient profile: ${createError.message}` };
        }
        patient = newPatient;
      }

      const appointmentData_full = {
        patient_id: patient.id,
        doctor_id: appointmentData.doctor_id,
        service_type: appointmentData.service_type,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentTime,
        reason: appointmentData.reason || 'Appointment booked through online system',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      console.log('📋 Full appointment data for insert:', appointmentData_full);

      // Direct insert attempt
      const insertResult = await supabase
        .from('appointments')
        .insert(appointmentData_full)
        .select()
        .single();

      console.log('📊 Direct insert result:', insertResult);
        
      const { data, error } = insertResult;

      if (error) {
        console.error('❌ Direct insert failed:', error);
        
        // Check for specific error types
        if (error.message?.includes('policy') || error.message?.includes('RLS') || error.code === '42501') {
          return { 
            success: false, 
            error: 'Permission denied: RLS policies are blocking appointment creation. Please ensure you are logged in as a patient and try again.' 
          };
        }
        
        if (error.code === '23503') {
          return {
            success: false,
            error: 'Invalid doctor or patient ID provided. Please refresh the page and try again.'
          };
        }
        
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      if (!data) {
        console.error('❌ No data returned from insert');
        return {
          success: false,
          error: 'Appointment creation failed - no data returned'
        };
      }

      console.log('✅ Appointment created successfully via direct insert:', data);
      return { success: true, data, message: 'Appointment created successfully' };

    } catch (error: any) {
      console.error('💥 Unexpected error in createAppointment:', error);
      return { 
        success: false, 
        error: `Unexpected error: ${error.message}. Please try again or contact support.` 
      };
    }
  }

  async createMedicalRecord(recordData: CreateMedicalRecordInput): Promise<ApiResponse<any>> {
    try {
      // Get current doctor ID
      const user = await this.getCurrentUser();
      if (!user || user.role !== 'doctor') {
        return { success: false, error: 'Only doctors can create medical records' };
      }

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctor) {
        return { success: false, error: 'Doctor profile not found' };
      }

      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          ...recordData,
          doctor_id: doctor.id,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: 'Medical record created successfully' };
    } catch (error: any) {
      console.error('Error creating medical record:', error);
      return { success: false, error: error.message };
    }
  }

  async createLabTest(testData: CreateLabTestInput): Promise<ApiResponse<any>> {
    try {
      // Get current doctor ID
      const user = await this.getCurrentUser();
      if (!user || user.role !== 'doctor') {
        return { success: false, error: 'Only doctors can order lab tests' };
      }

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctor) {
        return { success: false, error: 'Doctor profile not found' };
      }

      const { data, error } = await supabase
        .from('lab_tests')
        .insert({
          ...testData,
          doctor_id: doctor.id,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: 'Lab test ordered successfully' };
    } catch (error: any) {
      console.error('Error creating lab test:', error);
      return { success: false, error: error.message };
    }
  }

  async createPrescription(prescriptionData: CreatePrescriptionInput): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert(prescriptionData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: 'Prescription created successfully' };
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      return { success: false, error: error.message };
    }
  }

  async createHealthMetric(metricData: CreateHealthMetricInput): Promise<ApiResponse<any>> {
    try {
      // Get current user's patient ID
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError || !patient) {
        return { success: false, error: 'Patient profile not found' };
      }

      const { data, error } = await supabase
        .from('health_metrics')
        .insert({
          ...metricData,
          patient_id: patient.id,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: 'Health metric recorded successfully' };
    } catch (error: any) {
      console.error('Error creating health metric:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // UPDATE OPERATIONS
  // ===============================================

  async updateAppointmentStatus(appointmentId: string, status: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: 'Appointment status updated successfully' };
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      return { success: false, error: error.message };
    }
  }

  async updateLabTestResult(testId: string, result: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .update({ result })
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: 'Lab test result updated successfully' };
    } catch (error: any) {
      console.error('Error updating lab test result:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // UTILITY METHODS
  // ===============================================

  async getUserNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: 'Notification marked as read' };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  async getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const role = await this.getCurrentUserRole();

    switch (role) {
      case 'patient':
        return this.getPatientAppointments({
          date_from: today,
          date_to: today,
        });
      case 'doctor':
        return this.getDoctorAppointments({
          date_from: today,
          date_to: today,
        });
      case 'staff':
      case 'admin':
        return this.getStaffAppointments({
          date_from: today,
          date_to: today,
        });
      default:
        return [];
    }
  }
}

// Export singleton instance
export const rlsDataService = new RLSDataService();