// Healthcare Data Access Service
// Implements role-based access control in application layer (no RLS)
// All data filtering and permissions handled in code

import { supabase } from '@/lib/supabase';

export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin';

export interface AccessContext {
  userId: string;
  role: UserRole;
  patientId?: string;  // For patients
  doctorId?: string;   // For doctors
  staffId?: string;    // For staff
}

export class HealthcareDataService {
  
  // ============================================
  // AUTHENTICATION & CONTEXT SETUP
  // ============================================
  
  async getAccessContext(userId: string): Promise<AccessContext | null> {
    // Get user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
      
    if (userError || !user) return null;
    
    const context: AccessContext = {
      userId: user.id,
      role: user.role as UserRole
    };
    
    // Get role-specific IDs
    if (user.role === 'patient') {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (patient) context.patientId = patient.id;
    }
    
    if (user.role === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (doctor) context.doctorId = doctor.id;
    }
    
    if (user.role === 'staff' || user.role === 'admin') {
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (staff) context.staffId = staff.id;
    }
    
    return context;
  }

  // ============================================
  // APPOINTMENTS - Role-based Access
  // ============================================
  
  async getAppointments(context: AccessContext) {
    let query = supabase
      .from('appointments')
      .select(`
        id,
        service_type,
        reason,
        appointment_date,
        appointment_time,
        status,
        created_at,
        patient:patients(
          id,
          user:users(id, name, email, phone)
        ),
        doctor:doctors(
          id,
          specialty,
          consultation_fee,
          user:users(id, name, email, phone)
        )
      `);

    // Apply role-based filtering
    switch (context.role) {
      case 'patient':
        if (!context.patientId) return { data: [], error: null };
        query = query.eq('patient_id', context.patientId);
        break;
        
      case 'doctor':
        if (!context.doctorId) return { data: [], error: null };
        query = query.eq('doctor_id', context.doctorId);
        break;
        
      case 'staff':
      case 'admin':
        // Staff/Admin see all appointments - no filter needed
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('appointment_date', { ascending: true });
  }

  async getAppointmentById(appointmentId: string, context: AccessContext) {
    const query = supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        doctor_id,
        service_type,
        reason,
        appointment_date,
        appointment_time,
        status,
        created_at,
        patient:patients(
          id,
          date_of_birth,
          gender,
          address,
          user:users(id, name, email, phone)
        ),
        doctor:doctors(
          id,
          specialty,
          consultation_fee,
          rating,
          user:users(id, name, email, phone)
        )
      `)
      .eq('id', appointmentId);

    const { data: appointment, error } = await query.single();
    
    if (error || !appointment) return { data: null, error };
    
    // Check access permissions
    const hasAccess = this.checkAppointmentAccess(appointment, context);
    if (!hasAccess) {
      return { data: null, error: { message: 'Access denied to this appointment' } };
    }
    
    return { data: appointment, error: null };
  }
  
  private checkAppointmentAccess(appointment: any, context: AccessContext): boolean {
    switch (context.role) {
      case 'patient':
        return appointment.patient_id === context.patientId;
      case 'doctor':
        return appointment.doctor_id === context.doctorId;
      case 'staff':
      case 'admin':
        return true;
      default:
        return false;
    }
  }

  // ============================================
  // MEDICAL RECORDS - Role-based Access
  // ============================================
  
  async getMedicalRecords(context: AccessContext) {
    let query = supabase
      .from('medical_records')
      .select(`
        id,
        diagnosis,
        notes,
        created_at,
        patient:patients(
          id,
          user:users(id, name, email)
        ),
        doctor:doctors(
          id,
          specialty,
          user:users(id, name)
        ),
        appointment:appointments(
          id,
          appointment_date,
          service_type
        ),
        prescriptions(
          id,
          medication_name,
          dosage,
          instructions,
          created_at
        )
      `);

    switch (context.role) {
      case 'patient':
        if (!context.patientId) return { data: [], error: null };
        query = query.eq('patient_id', context.patientId);
        break;
        
      case 'doctor':
        if (!context.doctorId) return { data: [], error: null };
        query = query.eq('doctor_id', context.doctorId);
        break;
        
      case 'staff':
      case 'admin':
        // Full access
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('created_at', { ascending: false });
  }

  // ============================================
  // LAB TESTS - Role-based Access
  // ============================================
  
  async getLabTests(context: AccessContext) {
    let query = supabase
      .from('lab_tests')
      .select(`
        id,
        test_type,
        result,
        created_at,
        patient:patients(
          id,
          user:users(id, name, email)
        ),
        doctor:doctors(
          id,
          specialty,
          user:users(id, name)
        ),
        appointment:appointments(
          id,
          appointment_date,
          service_type
        )
      `);

    switch (context.role) {
      case 'patient':
        if (!context.patientId) return { data: [], error: null };
        query = query.eq('patient_id', context.patientId);
        break;
        
      case 'doctor':
        if (!context.doctorId) return { data: [], error: null };
        query = query.eq('doctor_id', context.doctorId);
        break;
        
      case 'staff':
      case 'admin':
        // Full access
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('created_at', { ascending: false });
  }

  // ============================================
  // PAYMENTS - Role-based Access
  // ============================================
  
  async getPayments(context: AccessContext) {
    let query = supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        provider,
        transaction_ref,
        created_at,
        appointment:appointments(
          id,
          appointment_date,
          service_type,
          patient:patients(
            id,
            user:users(id, name, email)
          ),
          doctor:doctors(
            id,
            specialty,
            user:users(id, name)
          )
        )
      `);

    switch (context.role) {
      case 'patient':
        if (!context.patientId) return { data: [], error: null };
        // Join through appointments to filter by patient
        query = query
          .eq('appointments.patient_id', context.patientId);
        break;
        
      case 'doctor':
        if (!context.doctorId) return { data: [], error: null };
        // Join through appointments to filter by doctor
        query = query
          .eq('appointments.doctor_id', context.doctorId);
        break;
        
      case 'staff':
      case 'admin':
        // Full access
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('created_at', { ascending: false });
  }

  // ============================================
  // DOCTORS - Public and Role-based Access
  // ============================================
  
  async getDoctors(context: AccessContext) {
    let selectFields: string;
    
    switch (context.role) {
      case 'patient':
        // Patients see limited public info only
        selectFields = `
          id,
          specialty,
          consultation_fee,
          rating,
          user:users(id, name)
        `;
        break;
        
      case 'doctor':
        if (!context.doctorId) return { data: [], error: null };
        // Doctors see their own full profile only
        selectFields = `
          id,
          specialty,
          consultation_fee,
          rating,
          user:users(id, name, email, phone)
        `;
        break;
        
      case 'staff':
      case 'admin':
        // Staff/Admin see full doctor profiles
        selectFields = `
          id,
          specialty,
          consultation_fee,
          rating,
          user:users(id, name, email, phone, created_at)
        `;
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    let query = supabase
      .from('doctors')
      .select(selectFields);
      
    // Doctors only see themselves
    if (context.role === 'doctor' && context.doctorId) {
      query = query.eq('id', context.doctorId);
    }

    return await query.order('user(name)', { ascending: true });
  }

  // ============================================
  // SERVICES - Public and Role-based Access
  // ============================================
  
  async getServices(context: AccessContext) {
    let query = supabase
      .from('services')
      .select(`
        id,
        name,
        category,
        description,
        duration,
        price,
        preparation,
        requirements,
        home_service_available,
        equipment_required,
        popular,
        doctor_specialty,
        created_at
      `);

    switch (context.role) {
      case 'patient':
        // Patients see only available services
        query = query.eq('is_available', true);
        break;
        
      case 'doctor':
        // Get doctor's specialty
        const { data: doctor } = await supabase
          .from('doctors')
          .select('specialty')
          .eq('id', context.doctorId)
          .single();
          
        if (doctor) {
          // Doctors see services matching their specialty or general services
          query = query.or(`doctor_specialty.eq.${doctor.specialty},doctor_specialty.is.null`);
        }
        query = query.eq('is_available', true);
        break;
        
      case 'staff':
      case 'admin':
        // Staff/Admin see all services
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('name', { ascending: true });
  }

  // ============================================
  // SERVICE PACKAGES - Public Access
  // ============================================
  
  async getServicePackages(context: AccessContext) {
    let query = supabase
      .from('service_packages')
      .select(`
        id,
        name,
        description,
        original_price,
        package_price,
        savings,
        duration,
        popular,
        display_order,
        package_services(
          service:services(
            id,
            name,
            category,
            duration,
            price
          )
        )
      `);

    // All authenticated users can see active packages
    if (context.role === 'patient' || context.role === 'doctor') {
      query = query.eq('is_active', true);
    }
    // Staff/Admin see all packages

    return await query.order('display_order', { ascending: true });
  }

  // ============================================
  // PATIENTS - Role-based Access
  // ============================================
  
  async getPatients(context: AccessContext) {
    switch (context.role) {
      case 'patient':
        // Patients see only their own profile
        if (!context.patientId) return { data: [], error: null };
        
        return await supabase
          .from('patients')
          .select(`
            id,
            date_of_birth,
            gender,
            address,
            user:users(id, name, email, phone)
          `)
          .eq('id', context.patientId);
          
      case 'doctor':
        // Doctors see only their assigned patients
        if (!context.doctorId) return { data: [], error: null };
        
        // First get patient IDs from appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', context.doctorId);
          
        if (!appointments || appointments.length === 0) {
          return { data: [], error: null };
        }
        
        const patientIds = [...new Set(appointments.map(a => a.patient_id))]; // Remove duplicates
        
        return await supabase
          .from('patients')
          .select(`
            id,
            date_of_birth,
            gender,
            address,
            user:users(id, name, email, phone)
          `)
          .in('id', patientIds);
          
      case 'staff':
      case 'admin':
        // Staff/Admin see all patients
        return await supabase
          .from('patients')
          .select(`
            id,
            date_of_birth,
            gender,
            address,
            user:users(id, name, email, phone, created_at)
          `)
          .order('user(name)', { ascending: true });
          
      default:
        return { data: [], error: { message: 'Access denied' } };
    }
  }

  // ============================================
  // HEALTH METRICS - Personal Data
  // ============================================
  
  async getHealthMetrics(context: AccessContext) {
    let query = supabase
      .from('health_metrics')
      .select(`
        id,
        metric_type,
        value,
        recorded_at,
        patient:patients(
          id,
          user:users(id, name)
        )
      `);

    switch (context.role) {
      case 'patient':
        if (!context.patientId) return { data: [], error: null };
        query = query.eq('patient_id', context.patientId);
        break;
        
      case 'doctor':
        // Doctors see metrics for their assigned patients only
        if (!context.doctorId) return { data: [], error: null };
        
        const { data: assignedPatients } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', context.doctorId);
          
        if (assignedPatients && assignedPatients.length > 0) {
          const patientIds = assignedPatients.map(a => a.patient_id);
          query = query.in('patient_id', patientIds);
        } else {
          return { data: [], error: null };
        }
        break;
        
      case 'staff':
      case 'admin':
        // Full access
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('recorded_at', { ascending: false });
  }

  // ============================================
  // NOTIFICATIONS - Personal
  // ============================================
  
  async getNotifications(context: AccessContext) {
    let query = supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        priority,
        is_read,
        related_appointment_id,
        related_test_id,
        created_at
      `);

    switch (context.role) {
      case 'patient':
      case 'doctor':
        // Users see only their own notifications
        query = query.eq('user_id', context.userId);
        break;
        
      case 'staff':
      case 'admin':
        // Staff/Admin see all notifications
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('created_at', { ascending: false });
  }

  // ============================================
  // TASKS - Role-based Access
  // ============================================
  
  async getTasks(context: AccessContext) {
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        due_date,
        completed_at,
        task_type,
        related_patient_id,
        related_equipment_id,
        created_at,
        assigned_to_user:users!tasks_assigned_to_fkey(id, name),
        created_by_user:users!tasks_created_by_fkey(id, name)
      `);

    switch (context.role) {
      case 'patient':
        // Patients don't see tasks
        return { data: [], error: { message: 'Access denied' } };
        
      case 'doctor':
        // Doctors see only tasks assigned to them
        query = query.eq('assigned_to', context.userId);
        break;
        
      case 'staff':
      case 'admin':
        // Staff/Admin see all tasks
        break;
        
      default:
        return { data: [], error: { message: 'Access denied' } };
    }

    return await query.order('created_at', { ascending: false });
  }

  // ============================================
  // EQUIPMENT - Staff/Admin Only
  // ============================================
  
  async getEquipment(context: AccessContext) {
    if (context.role !== 'staff' && context.role !== 'admin') {
      return { data: [], error: { message: 'Access denied' } };
    }

    return await supabase
      .from('equipment')
      .select(`
        id,
        name,
        type,
        model,
        serial_number,
        location,
        status,
        last_maintenance,
        next_maintenance,
        purchase_date,
        warranty_expiry,
        created_at,
        updated_at
      `)
      .order('name', { ascending: true });
  }

  // ============================================
  // DASHBOARD DATA - Aggregated Views
  // ============================================
  
  async getPatientDashboard(context: AccessContext) {
    if (context.role !== 'patient' || !context.patientId) {
      return { error: { message: 'Access denied' } };
    }

    const [appointments, labTests, healthMetrics, notifications, payments] = await Promise.all([
      this.getAppointments(context),
      this.getLabTests(context),
      this.getHealthMetrics(context),
      this.getNotifications(context),
      this.getPayments(context)
    ]);

    return {
      appointments: appointments.data || [],
      labTests: labTests.data || [],
      healthMetrics: healthMetrics.data || [],
      notifications: notifications.data || [],
      payments: payments.data || [],
      error: null
    };
  }

  async getDoctorDashboard(context: AccessContext) {
    if (context.role !== 'doctor' || !context.doctorId) {
      return { error: { message: 'Access denied' } };
    }

    const [appointments, medicalRecords, labTests, tasks, patients] = await Promise.all([
      this.getAppointments(context),
      this.getMedicalRecords(context),
      this.getLabTests(context),
      this.getTasks(context),
      this.getPatients(context)
    ]);

    return {
      appointments: appointments.data || [],
      medicalRecords: medicalRecords.data || [],
      labTests: labTests.data || [],
      tasks: tasks.data || [],
      patients: patients.data || [],
      error: null
    };
  }

  async getStaffDashboard(context: AccessContext) {
    if (context.role !== 'staff' && context.role !== 'admin') {
      return { error: { message: 'Access denied' } };
    }

    const [appointments, patients, doctors, equipment, tasks, labTests] = await Promise.all([
      this.getAppointments(context),
      this.getPatients(context),
      this.getDoctors(context),
      this.getEquipment(context),
      this.getTasks(context),
      this.getLabTests(context)
    ]);

    return {
      appointments: appointments.data || [],
      patients: patients.data || [],
      doctors: doctors.data || [],
      equipment: equipment.data || [],
      tasks: tasks.data || [],
      labTests: labTests.data || [],
      error: null
    };
  }
}

// Export singleton instance
export const healthcareDataService = new HealthcareDataService();