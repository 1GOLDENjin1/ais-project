import { supabase } from '@/lib/supabase';

// Centralized admin data access to fetch comprehensive datasets
// Note: This reads broadly across tables. Restrict usage to admin/staff contexts.

export class AdminDataService {
  // Appointments with patient/doctor and payments
  static async getAllAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients!patient_id(
          id,
          users:user_id(name,email,phone)
        ),
        doctor:doctors!doctor_id(
          id,
          users:user_id(name,email,phone),
          specialty
        ),
        payments:payments(*),
        medical_records:medical_records!appointments(*),
        video_calls:video_calls!appointments(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Patients with user and latest records
  static async getAllPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        users:user_id(name,email,phone),
        recent_records:medical_records(*),
        appointments(*),
        payments(*),
        health_metrics(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Doctors with user and schedules
  static async getAllDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        users:user_id(name,email,phone),
        doctor_schedules(*),
        doctor_analytics(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Medical records with patient, doctor, appointment, prescriptions, labs
  static async getAllMedicalRecords() {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients!patient_id(users:user_id(name,email)),
        doctor:doctors!doctor_id(users:user_id(name,email)),
        appointment:appointments!appointment_id(*),
        prescriptions(*),
        lab_tests(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllLabTests() {
    const { data, error } = await supabase
      .from('lab_tests')
      .select(`
        *,
        patient:patients!patient_id(users:user_id(name,email)),
        doctor:doctors!doctor_id(users:user_id(name,email)),
        appointment:appointments!appointment_id(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllVideoCalls() {
    const { data, error } = await supabase
      .from('video_calls')
      .select(`
        *,
        appointment:appointments!appointment_id(*),
        doctor:doctors!doctor_id(users:user_id(name,email)),
        patient:patients!patient_id(users:user_id(name,email)),
        participants:video_call_participants(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments!appointment_id(*),
        patient:patients!patient_id(users:user_id(name,email)),
        doctor:doctors!doctor_id(users:user_id(name,email))
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select(`*, user:users!user_id(name,email)`) // simple join for display
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(name,email),
        receiver:users!receiver_id(name,email),
        appointment:appointments!appointment_id(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllMessageThreads() {
    const { data, error } = await supabase
      .from('message_threads')
      .select(`
        *,
        patient:users!patient_id(name,email),
        doctor:users!doctor_id(name,email),
        last_message:messages!last_message_id(*)
      `)
      .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllSchedules() {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select(`*, doctor:doctors!doctor_id(users:user_id(name,email))`)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getAllTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!assigned_to(name,email),
        creator:users!created_by(name,email),
        patient:patients!related_patient_id(users:user_id(name))
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getAllServicePackages() {
    const { data, error } = await supabase
      .from('service_packages')
      .select(`*, package_services:package_services(*)`)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getAllStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select(`*, users:user_id(name,email,phone)`) 
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Aggregated snapshot (fetch major domains in parallel)
  static async getDatabaseSnapshot() {
    const [appointments, patients, doctors, medicalRecords, labTests, videoCalls, payments] = await Promise.all([
      this.getAllAppointments(),
      this.getAllPatients(),
      this.getAllDoctors(),
      this.getAllMedicalRecords(),
      this.getAllLabTests(),
      this.getAllVideoCalls(),
      this.getAllPayments(),
    ]);
    return { appointments, patients, doctors, medicalRecords, labTests, videoCalls, payments };
  }

  // Full dataset (can be heavy)
  static async getEverything() {
    const [appointments, patients, doctors, medicalRecords, labTests, videoCalls, payments, notifications, messages, threads, schedules, tasks, services, servicePackages, staff] = await Promise.all([
      this.getAllAppointments(),
      this.getAllPatients(),
      this.getAllDoctors(),
      this.getAllMedicalRecords(),
      this.getAllLabTests(),
      this.getAllVideoCalls(),
      this.getAllPayments(),
      this.getAllNotifications(),
      this.getAllMessages(),
      this.getAllMessageThreads(),
      this.getAllSchedules(),
      this.getAllTasks(),
      this.getAllServices(),
      this.getAllServicePackages(),
      this.getAllStaff(),
    ]);
    return { appointments, patients, doctors, medicalRecords, labTests, videoCalls, payments, notifications, messages, threads, schedules, tasks, services, servicePackages, staff };
  }
}

export default AdminDataService;
