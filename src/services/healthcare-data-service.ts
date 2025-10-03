// Updated Healthcare Data Service - Matches Your Exact Database Schema
// This service handles all role-based access control in the application layer

import { supabase } from '@/lib/supabase';

export interface AccessContext {
  userId: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  patientId?: string;
  doctorId?: string;
  staffId?: string;
}

class HealthcareDataService {
  private supabase = supabase;

  // ============================================
  // ACCESS CONTEXT MANAGEMENT
  // ============================================
  
  async getAccessContext(userId: string): Promise<AccessContext> {
    const { data: user } = await this.supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');

    const context: AccessContext = {
      userId: user.id,
      role: user.role as AccessContext['role']
    };

    // Get role-specific IDs
    if (user.role === 'patient') {
      const { data: patient } = await this.supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single();
      context.patientId = patient?.id;
    } else if (user.role === 'doctor') {
      const { data: doctor } = await this.supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();
      context.doctorId = doctor?.id;
    } else if (user.role === 'staff' || user.role === 'admin') {
      const { data: staff } = await this.supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .single();
      context.staffId = staff?.id;
    }

    return context;
  }

  // ============================================
  // APPOINTMENTS
  // ============================================
  
  async getAppointments(context: AccessContext) {
    try {
      let query = this.supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            id, user_id, date_of_birth, gender, address,
            users:user_id (name, email, phone)
          ),
          doctors:doctor_id (
            id, user_id, specialty, consultation_fee, rating,
            users:user_id (name, email)
          )
        `);

      // Role-based filtering
      if (context.role === 'patient') {
        query = query.eq('patient_id', context.patientId);
      } else if (context.role === 'doctor') {
        query = query.eq('doctor_id', context.doctorId);
      }
      // Staff and admin see all appointments

      const { data, error } = await query.order('appointment_date', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getAppointmentById(appointmentId: string, context: AccessContext) {
    try {
      let query = this.supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            id, user_id, date_of_birth, gender, address,
            users:user_id (name, email, phone)
          ),
          doctors:doctor_id (
            id, user_id, specialty, consultation_fee, rating,
            users:user_id (name, email)
          )
        `)
        .eq('id', appointmentId);

      // Role-based access control
      if (context.role === 'patient') {
        query = query.eq('patient_id', context.patientId);
      } else if (context.role === 'doctor') {
        query = query.eq('doctor_id', context.doctorId);
      }

      const { data, error } = await query.single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // MEDICAL RECORDS
  // ============================================
  
  async getMedicalRecords(context: AccessContext) {
    try {
      let query = this.supabase
        .from('medical_records')
        .select(`
          *,
          patients:patient_id (
            id, user_id, date_of_birth, gender,
            users:user_id (name, email)
          ),
          doctors:doctor_id (
            id, user_id, specialty,
            users:user_id (name, email)
          ),
          appointments:appointment_id (
            id, appointment_date, appointment_time, service_type, status
          )
        `);

      // Role-based filtering
      if (context.role === 'patient') {
        query = query.eq('patient_id', context.patientId);
      } else if (context.role === 'doctor') {
        query = query.eq('doctor_id', context.doctorId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // LAB TESTS
  // ============================================
  
  async getLabTests(context: AccessContext) {
    try {
      let query = this.supabase
        .from('lab_tests')
        .select(`
          *,
          patients:patient_id (
            id, user_id,
            users:user_id (name, email)
          ),
          doctors:doctor_id (
            id, user_id,
            users:user_id (name)
          ),
          appointments:appointment_id (
            id, appointment_date, service_type
          )
        `);

      // Role-based filtering
      if (context.role === 'patient') {
        query = query.eq('patient_id', context.patientId);
      } else if (context.role === 'doctor') {
        query = query.eq('doctor_id', context.doctorId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // DOCTORS
  // ============================================
  
  async getDoctors(context: AccessContext) {
    try {
      let query = this.supabase
        .from('doctors')
        .select(`
          *,
          users:user_id (name, email, phone)
        `);

      // All roles can see doctors, but with different data
      if (context.role === 'patient') {
        // Patients see basic doctor info for booking - recreate query
        query = this.supabase
          .from('doctors')
          .select(`
            id, specialty, consultation_fee, rating,
            users:user_id (name)
          `);
      }

      const { data, error } = await query.order('rating', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // SERVICES & PACKAGES
  // ============================================
  
  async getServices(context: AccessContext) {
    try {
      let query = this.supabase
        .from('services')
        .select('*');

      // Patients see only available services
      if (context.role === 'patient') {
        query = query.eq('is_available', true);
      }

      const { data, error } = await query.order('display_order');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getServicePackages(context: AccessContext) {
    try {
      let query = this.supabase
        .from('service_packages')
        .select(`
          *,
          package_services (
            services:service_id (
              id, name, description, price, category, duration
            )
          )
        `);

      // Patients see only active packages
      if (context.role === 'patient') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('display_order');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // PATIENTS (Staff/Admin only)
  // ============================================
  
  async getPatients(context: AccessContext) {
    if (context.role !== 'staff' && context.role !== 'admin') {
      return { data: [], error: { message: 'Access denied' } };
    }

    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select(`
          *,
          users:user_id (name, email, phone, created_at)
        `)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // PAYMENTS
  // ============================================
  
  async getPayments(context: AccessContext) {
    try {
      let query = this.supabase
        .from('payments')
        .select(`
          *,
          appointments:appointment_id (
            id, appointment_date, service_type, patient_id, doctor_id,
            patients:patient_id (
              users:user_id (name)
            )
          )
        `);

      // Role-based filtering through appointments
      if (context.role === 'patient') {
        // Join through appointments to filter by patient
        query = query.eq('appointments.patient_id', context.patientId);
      } else if (context.role === 'doctor') {
        // Join through appointments to filter by doctor
        query = query.eq('appointments.doctor_id', context.doctorId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // HEALTH METRICS
  // ============================================
  
  async getHealthMetrics(context: AccessContext) {
    try {
      let query = this.supabase
        .from('health_metrics')
        .select(`
          *,
          patients:patient_id (
            id, user_id,
            users:user_id (name)
          )
        `);

      // Only patients see their own metrics, staff/admin see all
      if (context.role === 'patient') {
        query = query.eq('patient_id', context.patientId);
      } else if (context.role === 'doctor') {
        // Doctors can see metrics for their patients only
        const { data: appointments } = await this.supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', context.doctorId);
        
        if (appointments && appointments.length > 0) {
          const patientIds = appointments.map(a => a.patient_id);
          query = query.in('patient_id', patientIds);
        } else {
          return { data: [], error: null };
        }
      }

      const { data, error } = await query.order('recorded_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  
  async getNotifications(context: AccessContext) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // TASKS
  // ============================================
  
  async getTasks(context: AccessContext) {
    try {
      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:assigned_to (name, email),
          creator:created_by (name, email),
          patient:related_patient_id (
            users:user_id (name)
          ),
          equipment:related_equipment_id (name, type, status)
        `);

      // Filter based on role
      if (context.role === 'doctor' || context.role === 'staff') {
        query = query.or(`assigned_to.eq.${context.userId},created_by.eq.${context.userId}`);
      } else if (context.role === 'patient') {
        return { data: [], error: { message: 'Patients cannot access tasks' } };
      }
      // Admin sees all tasks

      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // EQUIPMENT (Staff/Admin only)
  // ============================================
  
  async getEquipment(context: AccessContext) {
    if (context.role === 'patient') {
      return { data: [], error: { message: 'Access denied' } };
    }

    try {
      const { data, error } = await this.supabase
        .from('equipment')
        .select('*')
        .order('name');

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // DOCTOR SCHEDULES
  // ============================================
  
  async getDoctorSchedules(context: AccessContext) {
    try {
      let query = this.supabase
        .from('doctor_schedules')
        .select(`
          *,
          doctors:doctor_id (
            id, specialty,
            users:user_id (name)
          )
        `);

      // Doctors see only their schedules
      if (context.role === 'doctor') {
        query = query.eq('doctor_id', context.doctorId);
      }
      // Patients and staff see all schedules

      const { data, error } = await query
        .gte('available_date', new Date().toISOString().split('T')[0])
        .order('available_date');

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // PRESCRIPTIONS
  // ============================================
  
  async getPrescriptions(context: AccessContext) {
    try {
      let query = this.supabase
        .from('prescriptions')
        .select(`
          *,
          medical_records:medical_record_id (
            id, patient_id, doctor_id, diagnosis,
            patients:patient_id (
              users:user_id (name)
            ),
            doctors:doctor_id (
              users:user_id (name)
            )
          )
        `);

      // Role-based filtering through medical records
      if (context.role === 'patient') {
        query = query.eq('medical_records.patient_id', context.patientId);
      } else if (context.role === 'doctor') {
        query = query.eq('medical_records.doctor_id', context.doctorId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ============================================
  // DASHBOARD AGGREGATIONS
  // ============================================
  
  async getPatientDashboard(context: AccessContext) {
    if (context.role !== 'patient') {
      return { error: { message: 'Access denied' } };
    }

    try {
      // Get appointments count
      const { data: appointments } = await this.supabase
        .from('appointments')
        .select('id, status, appointment_date')
        .eq('patient_id', context.patientId);

      // Get upcoming appointments
      const upcomingAppointments = appointments?.filter(apt => 
        new Date(apt.appointment_date) > new Date() && 
        apt.status !== 'cancelled'
      ).length || 0;

      // Get recent medical records
      const { data: medicalRecords } = await this.supabase
        .from('medical_records')
        .select('id')
        .eq('patient_id', context.patientId);

      // Get recent lab tests
      const { data: labTests } = await this.supabase
        .from('lab_tests')
        .select('id')
        .eq('patient_id', context.patientId);

      return {
        totalAppointments: appointments?.length || 0,
        upcomingAppointments,
        completedAppointments: appointments?.filter(a => a.status === 'completed').length || 0,
        medicalRecords: medicalRecords?.length || 0,
        labTests: labTests?.length || 0,
        recentAppointments: appointments?.slice(0, 5) || []
      };
    } catch (error) {
      return { error };
    }
  }

  async getDoctorDashboard(context: AccessContext) {
    if (context.role !== 'doctor') {
      return { error: { message: 'Access denied' } };
    }

    try {
      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAppointments } = await this.supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', context.doctorId)
        .eq('appointment_date', today);

      // Get total patients (unique patient IDs from appointments)
      const { data: allAppointments } = await this.supabase
        .from('appointments')
        .select('patient_id, status')
        .eq('doctor_id', context.doctorId);

      const uniquePatients = new Set(allAppointments?.map(a => a.patient_id)).size;

      // Get pending tasks
      const { data: tasks } = await this.supabase
        .from('tasks')
        .select('id')
        .eq('assigned_to', context.userId)
        .eq('status', 'pending');

      return {
        todaysAppointments: todayAppointments?.length || 0,
        totalPatients: uniquePatients,
        pendingTasks: tasks?.length || 0,
        completedAppointments: allAppointments?.filter(a => a.status === 'completed').length || 0
      };
    } catch (error) {
      return { error };
    }
  }

  async getStaffDashboard(context: AccessContext) {
    if (context.role !== 'staff' && context.role !== 'admin') {
      return { error: { message: 'Access denied' } };
    }

    try {
      // Get all appointments
      const { data: appointments } = await this.supabase
        .from('appointments')
        .select('*');

      // Get all patients
      const { data: patients } = await this.supabase
        .from('patients')
        .select('id');

      // Get active doctors
      const { data: doctors } = await this.supabase
        .from('doctors')
        .select('id');

      // Get pending payments
      const { data: pendingPayments } = await this.supabase
        .from('payments')
        .select('id')
        .eq('status', 'pending');

      return {
        totalAppointments: appointments?.length || 0,
        totalPatients: patients?.length || 0,
        activeDoctors: doctors?.length || 0,
        pendingPayments: pendingPayments?.length || 0,
        todayAppointments: appointments?.filter(a => 
          a.appointment_date === new Date().toISOString().split('T')[0]
        ).length || 0
      };
    } catch (error) {
      return { error };
    }
  }
}

// Export singleton instance
export const healthcareDataService = new HealthcareDataService();
export type { AccessContext };