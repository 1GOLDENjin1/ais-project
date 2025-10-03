/**
 * Healthcare Management Service
 * Implements role-based access control in application layer
 * No RLS policies - all access control handled here
 */

import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// Types for database entities
export interface HealthcareUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  created_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating: number;
  video_consultation_available: boolean;
  video_consultation_fee: number;
}

export interface Staff {
  id: string;
  user_id: string;
  position: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  reason?: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: 'in-person' | 'video';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
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

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  provider: string;
  transaction_ref?: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  preparation?: string;
  requirements?: string[];
  is_available: boolean;
  home_service_available: boolean;
  equipment_required?: string[];
  status: string;
  popular: boolean;
  display_order: number;
  doctor_specialty?: string;
  created_at: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  original_price: number;
  package_price: number;
  savings: number;
  duration: string;
  is_active: boolean;
  popular: boolean;
  display_order: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  related_appointment_id?: string;
  related_test_id?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  model?: string;
  serial_number?: string;
  location?: string;
  status: string;
  last_maintenance?: string;
  next_maintenance?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  created_at: string;
}

export interface Task {
  id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  task_type: string;
  related_patient_id?: string;
  related_equipment_id?: string;
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

// Access control context
export interface AccessContext {
  user: HealthcareUser;
  patientProfile?: Patient;
  doctorProfile?: Doctor;
  staffProfile?: Staff;
}

export class HealthcareService {
  /**
   * Get user access context - determines what data user can access
   */
  async getAccessContext(userId: string): Promise<AccessContext | null> {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('Failed to get user:', userError);
        return null;
      }

      const context: AccessContext = { user };

      // Get role-specific profile
      if (user.role === 'patient') {
        const { data: patient } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .single();
        context.patientProfile = patient;
      } else if (user.role === 'doctor') {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', userId)
          .single();
        context.doctorProfile = doctor;
      } else if (user.role === 'staff' || user.role === 'admin') {
        const { data: staff } = await supabase
          .from('staff')
          .select('*')
          .eq('user_id', userId)
          .single();
        context.staffProfile = staff;
      }

      return context;
    } catch (error) {
      console.error('Error getting access context:', error);
      return null;
    }
  }

  /**
   * PATIENT FLOWS
   */

  // Patient Dashboard Data
  async getPatientDashboard(context: AccessContext) {
    if (context.user.role !== 'patient' || !context.patientProfile) {
      throw new Error('Access denied: Patient role required');
    }

    const patientId = context.patientProfile.id;

    // Get upcoming appointments
    const { data: upcomingAppointments } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!inner(id, specialty, consultation_fee, rating, users!inner(name))
      `)
      .eq('patient_id', patientId)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .eq('status', 'confirmed')
      .order('appointment_date', { ascending: true });

    // Get past appointments
    const { data: pastAppointments } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!inner(id, specialty, consultation_fee, rating, users!inner(name))
      `)
      .eq('patient_id', patientId)
      .lt('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: false })
      .limit(10);

    // Get medical records
    const { data: medicalRecords } = await supabase
      .from('medical_records')
      .select(`
        *,
        doctors!inner(users!inner(name)),
        prescriptions(*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    // Get lab tests
    const { data: labTests } = await supabase
      .from('lab_tests')
      .select(`
        *,
        doctors!inner(users!inner(name))
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    // Get health metrics
    const { data: healthMetrics } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    // Get notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      upcomingAppointments: upcomingAppointments || [],
      pastAppointments: pastAppointments || [],
      medicalRecords: medicalRecords || [],
      labTests: labTests || [],
      healthMetrics: healthMetrics || [],
      notifications: notifications || []
    };
  }

  // Book appointment (Patient)
  async bookAppointment(context: AccessContext, appointmentData: {
    doctor_id: string;
    service_type: string;
    reason?: string;
    appointment_date: string;
    appointment_time: string;
    consultation_type: 'in-person' | 'video';
  }) {
    if (context.user.role !== 'patient' || !context.patientProfile) {
      throw new Error('Access denied: Patient role required');
    }

    // Verify doctor supports video consultations if requested
    if (appointmentData.consultation_type === 'video') {
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('video_consultation_available')
        .eq('id', appointmentData.doctor_id)
        .single();

      if (doctorError || !doctor?.video_consultation_available) {
        throw new Error('Doctor does not offer video consultations');
      }
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: context.patientProfile.id,
        ...appointmentData,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // If video consultation, create video call record when appointment is confirmed
    // This will be handled by staff/admin when they confirm the appointment
    
    return appointment;
  }

  // Update patient profile (Patient)
  async updatePatientProfile(context: AccessContext, profileData: Partial<Patient>) {
    if (context.user.role !== 'patient' || !context.patientProfile) {
      throw new Error('Access denied: Patient role required');
    }

    const { data, error } = await supabase
      .from('patients')
      .update(profileData)
      .eq('id', context.patientProfile.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get patient's prescriptions
  async getPatientPrescriptions(context: AccessContext) {
    if (context.user.role !== 'patient' || !context.patientProfile) {
      throw new Error('Access denied: Patient role required');
    }

    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctors!inner(users!inner(name))
      `)
      .eq('patient_id', context.patientProfile.id)
      .order('prescribed_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get patient's payments
  async getPatientPayments(context: AccessContext) {
    if (context.user.role !== 'patient' || !context.patientProfile) {
      throw new Error('Access denied: Patient role required');
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointments!inner(
          id,
          appointment_date,
          appointment_time,
          service_type,
          doctors!inner(users!inner(name))
        )
      `)
      .eq('patient_id', context.patientProfile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Add health metric (Patient)
  async addHealthMetric(context: AccessContext, metricData: {
    metric_type: string;
    value: string;
    unit?: string;
    notes?: string;
  }) {
    if (context.user.role !== 'patient' || !context.patientProfile) {
      throw new Error('Access denied: Patient role required');
    }

    const { data, error } = await supabase
      .from('health_metrics')
      .insert({
        ...metricData,
        patient_id: context.patientProfile.id,
        recorded_date: new Date().toISOString().split('T')[0],
        recorded_by: 'patient'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // View doctor schedules (Patient/Public)
  async viewDoctorSchedules(doctorId?: string) {
    let query = supabase
      .from('doctor_schedules')
      .select(`
        *,
        doctors!inner(
          id,
          specialty,
          consultation_fee,
          users!inner(name)
        )
      `)
      .eq('is_available', true);

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query.order('day_of_week');

    if (error) throw error;
    return data || [];
  }

  // Get available doctors and services (Public access)
  async getAvailableDoctorsAndServices() {
    // Get available doctors with their specialties
    const { data: doctors } = await supabase
      .from('doctors')
      .select(`
        *,
        users!inner(name, email, phone)
      `)
      .eq('is_available', true)
      .order('rating', { ascending: false });

    // Get available services
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('is_available', true)
      .eq('status', 'available')
      .order('display_order');

    // Get service packages
    const { data: packages } = await supabase
      .from('service_packages')
      .select(`
        *,
        package_services!inner(
          services!inner(name, category, price)
        )
      `)
      .eq('is_active', true)
      .order('display_order');

    return {
      doctors: doctors || [],
      services: services || [],
      packages: packages || []
    };
  }

  /**
   * DOCTOR FLOWS
   */

  // Doctor Dashboard Data
  async getDoctorDashboard(context: AccessContext) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    const doctorId = context.doctorProfile.id;
    const today = new Date().toISOString().split('T')[0];

    // Get today's appointments
    const { data: todayAppointments } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(id, users!inner(name, phone))
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .order('appointment_time');

    // Get assigned patients
    const { data: assignedPatients } = await supabase
      .from('appointments')
      .select(`
        patients!inner(
          id,
          user_id,
          date_of_birth,
          gender,
          address,
          users!inner(name, email, phone)
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('status', 'confirmed');

    // Get doctor's tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', context.user.id)
      .neq('status', 'completed')
      .order('due_date');

    // Get payments from completed appointments
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        *,
        appointments!inner(id, patient_id, service_type)
      `)
      .eq('appointments.doctor_id', doctorId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get doctor's schedule
    const { data: schedule } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week');

    // Get patient health metrics for assigned patients
    const patientIds = assignedPatients?.map((ap: any) => ap.patients.id) || [];
    let healthMetrics = [];
    if (patientIds.length > 0) {
      const { data } = await supabase
        .from('health_metrics')
        .select(`
          *,
          patients!inner(users!inner(name))
        `)
        .in('patient_id', patientIds)
        .order('recorded_date', { ascending: false })
        .limit(20);
      healthMetrics = data || [];
    }

    return {
      todayAppointments: todayAppointments || [],
      assignedPatients: assignedPatients || [],
      tasks: tasks || [],
      payments: payments || [],
      schedule: schedule || [],
      patientHealthMetrics: healthMetrics
    };
  }

  // Manage doctor schedule
  async updateDoctorSchedule(context: AccessContext, scheduleData: {
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    break_start?: string;
    break_end?: string;
    max_patients_per_day?: number;
  }) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    const { data, error } = await supabase
      .from('doctor_schedules')
      .upsert({
        doctor_id: context.doctorProfile.id,
        ...scheduleData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get doctor schedule
  async getDoctorSchedule(context: AccessContext) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', context.doctorProfile.id)
      .order('day_of_week');

    if (error) throw error;
    return data || [];
  }

  // Update appointment status (Doctor)
  async updateAppointmentStatus(context: AccessContext, appointmentId: string, status: string) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    // Verify doctor owns this appointment
    const { data: appointment } = await supabase
      .from('appointments')
      .select('doctor_id')
      .eq('id', appointmentId)
      .eq('doctor_id', context.doctorProfile.id)
      .single();

    if (!appointment) {
      throw new Error('Appointment not found or access denied');
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create medical record (Doctor)
  async createMedicalRecord(context: AccessContext, recordData: {
    patient_id: string;
    appointment_id?: string;
    diagnosis?: string;
    notes?: string;
  }) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        ...recordData,
        doctor_id: context.doctorProfile.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create prescription (Doctor)
  async createPrescription(context: AccessContext, prescriptionData: {
    patient_id: string;
    appointment_id?: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
    refills_allowed?: number;
  }) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        ...prescriptionData,
        doctor_id: context.doctorProfile.id,
        prescribed_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Order lab test (Doctor)
  async orderLabTest(context: AccessContext, testData: {
    patient_id: string;
    test_name: string;
    test_type: string;
    priority?: string;
    cost?: number;
  }) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    const { data, error } = await supabase
      .from('lab_tests')
      .insert({
        ...testData,
        doctor_id: context.doctorProfile.id,
        test_date: new Date().toISOString().split('T')[0],
        status: 'ordered',
        priority: testData.priority || 'routine'
      })
      .select()
      .single();

    if (error) throw error;

    // Notify patient
    await this.createNotification(context, {
      user_id: testData.patient_id,
      title: 'Lab Test Ordered',
      message: `Your doctor has ordered a ${testData.test_name}. Please visit the laboratory.`,
      type: 'test-result',
      priority: 'medium'
    });

    return data;
  }

  // View lab test results (Doctor)
  async getLabTestResults(context: AccessContext, patientId?: string) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    let query = supabase
      .from('lab_tests')
      .select(`
        *,
        patients!inner(users!inner(name))
      `)
      .eq('doctor_id', context.doctorProfile.id);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query
      .order('test_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get doctor's prescriptions
  async getDoctorPrescriptions(context: AccessContext, patientId?: string) {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        patients!inner(users!inner(name))
      `)
      .eq('doctor_id', context.doctorProfile.id);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query
      .order('prescribed_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * STAFF/ADMIN FLOWS
   */

  // Staff/Admin Dashboard Data
  async getStaffDashboard(context: AccessContext) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    // Get all appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(users!inner(name)),
        doctors!inner(users!inner(name))
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get all patients
    const { data: patients } = await supabase
      .from('patients')
      .select(`
        *,
        users!inner(name, email, phone)
      `)
      .order('created_at', { ascending: false });

    // Get all doctors
    const { data: doctors } = await supabase
      .from('doctors')
      .select(`
        *,
        users!inner(name, email, phone)
      `)
      .order('created_at', { ascending: false });

    // Get all staff
    const { data: staff } = await supabase
      .from('staff')
      .select(`
        *,
        users!inner(name, email, phone)
      `)
      .order('created_at', { ascending: false });

    // Get all payments
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        *,
        appointments!inner(id, service_type, patients!inner(users!inner(name)))
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get equipment
    const { data: equipment } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });

    return {
      appointments: appointments || [],
      patients: patients || [],
      doctors: doctors || [],
      staff: staff || [],
      payments: payments || [],
      equipment: equipment || []
    };
  }

  // Create user (Staff/Admin)
  async createUser(context: AccessContext, userData: {
    name: string;
    email: string;
    phone?: string;
    role: 'patient' | 'doctor' | 'staff';
    password: string;
  }, profileData?: any) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) throw userError;

    // Create role-specific profile
    if (userData.role === 'patient' && profileData) {
      await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          ...profileData
        });
    } else if (userData.role === 'doctor' && profileData) {
      await supabase
        .from('doctors')
        .insert({
          user_id: user.id,
          ...profileData
        });
    } else if (userData.role === 'staff' && profileData) {
      await supabase
        .from('staff')
        .insert({
          user_id: user.id,
          ...profileData
        });
    }

    return user;
  }

  // Manage services (Staff/Admin)
  async createService(context: AccessContext, serviceData: Partial<Service>) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateService(context: AccessContext, serviceId: string, updates: Partial<Service>) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Manage equipment (Staff/Admin)
  async createEquipment(context: AccessContext, equipmentData: {
    name: string;
    type: string;
    model?: string;
    serial_number?: string;
    location?: string;
    purchase_date?: string;
    warranty_expiry?: string;
  }) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    const { data, error } = await supabase
      .from('equipment')
      .insert({
        ...equipmentData,
        status: 'available'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEquipmentStatus(context: AccessContext, equipmentId: string, status: string, notes?: string) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    const updates: any = { status };
    if (status === 'maintenance') {
      updates.last_maintenance = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', equipmentId)
      .select()
      .single();

    if (error) throw error;

    // Create maintenance task if needed
    if (status === 'maintenance') {
      await this.assignTask(context, {
        assigned_to: context.user.id,
        title: `Equipment Maintenance: ${data.name}`,
        description: notes || 'Routine equipment maintenance',
        priority: 'medium',
        task_type: 'maintenance'
      });
    }

    return data;
  }

  // Process payments (Staff/Admin)
  async processPayment(context: AccessContext, paymentData: {
    appointment_id: string;
    amount: number;
    payment_type: string;
    payment_method: string;
    description?: string;
  }) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    // Get appointment to verify patient
    const { data: appointment } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('id', paymentData.appointment_id)
      .single();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        patient_id: appointment.patient_id,
        status: 'completed',
        payment_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Notify patient
    await this.createNotification(context, {
      user_id: appointment.patient_id,
      title: 'Payment Processed',
      message: `Your payment of ₱${paymentData.amount.toFixed(2)} has been processed successfully.`,
      type: 'general',
      priority: 'low'
    });

    return data;
  }

  // Assist with lab tests (Staff)
  async updateLabTestResults(context: AccessContext, testId: string, results: string, abnormal_findings?: string) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    const { data, error } = await supabase
      .from('lab_tests')
      .update({
        results,
        abnormal_findings,
        status: 'completed',
        staff_id: context.staffProfile?.id
      })
      .eq('id', testId)
      .select(`
        *,
        patients!inner(users!inner(id, name)),
        doctors!inner(users!inner(id, name))
      `)
      .single();

    if (error) throw error;

    // Notify doctor and patient
    await Promise.all([
      this.createNotification(context, {
        user_id: (data as any).doctors.users.id,
        title: 'Lab Results Ready',
        message: `Lab test results are ready for ${(data as any).patients.users.name}`,
        type: 'test-result',
        priority: 'medium',
        related_test_id: testId
      }),
      this.createNotification(context, {
        user_id: (data as any).patients.users.id,
        title: 'Lab Results Available',
        message: 'Your lab test results are ready. Please check with your doctor.',
        type: 'test-result',
        priority: 'medium',
        related_test_id: testId
      })
    ]);

    return data;
  }

  // Assign tasks (Staff/Admin)
  async assignTask(context: AccessContext, taskData: {
    assigned_to: string;
    title: string;
    description?: string;
    priority: string;
    task_type: string;
    due_date?: string;
    related_patient_id?: string;
    related_equipment_id?: string;
  }) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_by: context.user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get staff tasks
  async getStaffTasks(context: AccessContext) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff or Admin role required');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:users!tasks_assigned_to_fkey(name),
        created_user:users!tasks_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update task status
  async updateTaskStatus(context: AccessContext, taskId: string, status: string) {
    // Users can update their own tasks, staff/admin can update any task
    const { data: task } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', taskId)
      .single();

    if (!task) {
      throw new Error('Task not found');
    }

    const canUpdate = 
      task.assigned_to === context.user.id ||
      context.user.role === 'staff' ||
      context.user.role === 'admin';

    if (!canUpdate) {
      throw new Error('Access denied: Cannot update this task');
    }

    const updates: any = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * ADMIN FLOWS - Full Access & Reporting
   */

  // Generate comprehensive reports (Admin)
  async generateReports(context: AccessContext, reportType: 'appointments' | 'payments' | 'users' | 'equipment', dateRange?: { start: string; end: string }) {
    if (context.user.role !== 'admin') {
      throw new Error('Access denied: Admin role required');
    }

    const { start, end } = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };

    switch (reportType) {
      case 'appointments': {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patients!inner(users!inner(name, email)),
            doctors!inner(users!inner(name), specialty),
            payments(amount, status)
          `)
          .gte('appointment_date', start)
          .lte('appointment_date', end)
          .order('appointment_date');

        if (error) throw error;

        // Generate statistics
        const stats = {
          total_appointments: data?.length || 0,
          completed_appointments: data?.filter(a => a.status === 'completed').length || 0,
          cancelled_appointments: data?.filter(a => a.status === 'cancelled').length || 0,
          total_revenue: data?.reduce((sum, a) => {
            const payment = (a as any).payments?.[0];
            return sum + (payment?.status === 'completed' ? payment.amount : 0);
          }, 0) || 0,
          by_consultation_type: {
            in_person: data?.filter(a => a.consultation_type === 'in-person').length || 0,
            video: data?.filter(a => a.consultation_type === 'video-call').length || 0
          }
        };

        return { data, stats };
      }

      case 'payments': {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            appointments!inner(
              appointment_date,
              service_type,
              patients!inner(users!inner(name)),
              doctors!inner(users!inner(name))
            )
          `)
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at');

        if (error) throw error;

        const stats = {
          total_payments: data?.length || 0,
          total_revenue: data?.reduce((sum, p) => sum + p.amount, 0) || 0,
          completed_payments: data?.filter(p => p.status === 'completed').length || 0,
          pending_payments: data?.filter(p => p.status === 'pending').length || 0,
          by_payment_method: data?.reduce((acc, p) => {
            acc[p.payment_method] = (acc[p.payment_method] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {}
        };

        return { data, stats };
      }

      case 'users': {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at');

        if (usersError) throw usersError;

        const { data: patients } = await supabase
          .from('patients')
          .select('*, users!inner(name, created_at)');

        const { data: doctors } = await supabase
          .from('doctors')
          .select('*, users!inner(name, created_at)');

        const { data: staff } = await supabase
          .from('staff')
          .select('*, users!inner(name, created_at)');

        const stats = {
          total_users: users?.length || 0,
          patients: patients?.length || 0,
          doctors: doctors?.length || 0,
          staff: staff?.length || 0,
          by_role: users?.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {}
        };

        return { 
          data: { users, patients, doctors, staff }, 
          stats 
        };
      }

      case 'equipment': {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .order('created_at');

        if (error) throw error;

        const stats = {
          total_equipment: data?.length || 0,
          available: data?.filter(e => e.status === 'available').length || 0,
          in_use: data?.filter(e => e.status === 'in-use').length || 0,
          maintenance: data?.filter(e => e.status === 'maintenance').length || 0,
          out_of_order: data?.filter(e => e.status === 'out-of-order').length || 0,
          by_type: data?.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {}
        };

        return { data, stats };
      }

      default:
        throw new Error('Invalid report type');
    }
  }

  // Delete user (Admin only)
  async deleteUser(context: AccessContext, userId: string) {
    if (context.user.role !== 'admin') {
      throw new Error('Access denied: Admin role required');
    }

    // Cannot delete admin users
    const { data: userToDelete } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userToDelete?.role === 'admin') {
      throw new Error('Cannot delete admin users');
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  }

  /**
   * SHARED UTILITIES
   */

  // Get user notifications
  async getNotifications(context: AccessContext) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Mark notification as read
  async markNotificationAsRead(context: AccessContext, notificationId: string) {
    // Verify user owns this notification
    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .eq('user_id', context.user.id)
      .single();

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create notification
  async createNotification(context: AccessContext, notificationData: {
    user_id: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
    related_appointment_id?: string;
    related_test_id?: string;
  }) {
    // Staff/Admin can create notifications for anyone
    // Other roles can only create notifications for themselves
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      if (notificationData.user_id !== context.user.id) {
        throw new Error('Access denied: Cannot create notifications for other users');
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        priority: notificationData.priority || 'medium',
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Video Call Management Methods

  // Generate video call room for confirmed appointment
  async createVideoCall(context: AccessContext, appointmentId: string) {
    if (context.user.role !== 'staff' && context.user.role !== 'admin') {
      throw new Error('Access denied: Staff/Admin role required');
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, consultation_type, doctor_id, patient_id')
      .eq('id', appointmentId)
      .eq('consultation_type', 'video')
      .eq('status', 'confirmed')
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Video appointment not found or not confirmed');
    }

    // Generate unique room ID and call link
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const callLink = `${window.location.origin}/video-call/${roomId}`;

    const { data, error } = await supabase
      .from('video_calls')
      .insert({
        appointment_id: appointmentId,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        call_link: callLink,
        room_id: roomId,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;

    // Notify both patient and doctor
    await Promise.all([
      this.createNotification(context, {
        user_id: appointment.patient_id,
        title: 'Video Call Ready',
        message: `Your video consultation is ready. You can join the call at your appointment time.`,
        type: 'video_call',
        priority: 'high',
        related_appointment_id: appointmentId
      }),
      this.createNotification(context, {
        user_id: appointment.doctor_id,
        title: 'Video Call Scheduled',
        message: `Video consultation room created for patient appointment.`,
        type: 'video_call',
        priority: 'medium',
        related_appointment_id: appointmentId
      })
    ]);

    return data;
  }

  // Get video call details for appointment
  async getVideoCall(context: AccessContext, appointmentId: string): Promise<VideoCall | null> {
    // Get appointment to check user access
    const { data: appointment } = await supabase
      .from('appointments')
      .select('patient_id, doctor_id')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if user has access to this video call
    const hasAccess = 
      context.user.role === 'staff' || 
      context.user.role === 'admin' ||
      (context.user.role === 'patient' && context.patientProfile?.id === appointment.patient_id) ||
      (context.user.role === 'doctor' && context.doctorProfile?.id === appointment.doctor_id);

    if (!hasAccess) {
      throw new Error('Access denied: No permission to view this video call');
    }

    const { data, error } = await supabase
      .from('video_calls')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data || null;
  }

  // Join video call (Patient/Doctor)
  async joinVideoCall(context: AccessContext, appointmentId: string) {
    const videoCall = await this.getVideoCall(context, appointmentId);
    
    if (!videoCall) {
      throw new Error('Video call not found');
    }

    if (videoCall.status !== 'scheduled' && videoCall.status !== 'ongoing') {
      throw new Error('Video call is not available for joining');
    }

    // Update status to ongoing if first person joins
    if (videoCall.status === 'scheduled') {
      const { error } = await supabase
        .from('video_calls')
        .update({ 
          status: 'ongoing', 
          started_at: new Date().toISOString() 
        })
        .eq('id', videoCall.id);

      if (error) throw error;
    }

    return {
      call_link: videoCall.call_link,
      room_id: videoCall.room_id,
      status: 'ongoing'
    };
  }

  // End video call
  async endVideoCall(context: AccessContext, appointmentId: string, duration_minutes?: number, notes?: string) {
    const videoCall = await this.getVideoCall(context, appointmentId);
    
    if (!videoCall) {
      throw new Error('Video call not found');
    }

    if (videoCall.status !== 'ongoing') {
      throw new Error('Video call is not active');
    }

    // Calculate duration if not provided
    let calculatedDuration = duration_minutes;
    if (!calculatedDuration && videoCall.started_at) {
      const startTime = new Date(videoCall.started_at);
      const endTime = new Date();
      calculatedDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    const { data, error } = await supabase
      .from('video_calls')
      .update({ 
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_minutes: calculatedDuration,
        notes: notes
      })
      .eq('id', videoCall.id)
      .select()
      .single();

    if (error) throw error;

    // Update appointment status to completed
    await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId);

    return data;
  }

  // Get patient's video calls
  async getPatientVideoCalls(context: AccessContext): Promise<VideoCall[]> {
    if (context.user.role !== 'patient' || !context.patientProfile) {
      throw new Error('Access denied: Patient role required');
    }

    const { data, error } = await supabase
      .from('video_calls')
      .select(`
        *,
        appointments!inner(appointment_date, appointment_time, service_type, status),
        doctors!inner(users!inner(name))
      `)
      .eq('patient_id', context.patientProfile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get doctor's video calls
  async getDoctorVideoCalls(context: AccessContext): Promise<VideoCall[]> {
    if (context.user.role !== 'doctor' || !context.doctorProfile) {
      throw new Error('Access denied: Doctor role required');
    }

    const { data, error } = await supabase
      .from('video_calls')
      .select(`
        *,
        appointments!inner(appointment_date, appointment_time, service_type, status),
        patients!inner(users!inner(name))
      `)
      .eq('doctor_id', context.doctorProfile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Export singleton instance
export const healthcareService = new HealthcareService();