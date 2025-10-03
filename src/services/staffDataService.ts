import { supabase } from '@/lib/supabase';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'staff' | 'admin';
  is_active: boolean;
  created_at: string;
  staff?: {
    id: string;
    position: string;
  };
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating: number;
  license_number?: string;
  years_experience?: number;
  education?: string;
  certifications?: string;
  is_available: boolean;
  total_ratings: number;
  video_consultation_available: boolean;
  video_consultation_fee: number;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface Patient {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface Service {
  id: string;
  name: string;
  category: 'consultation' | 'laboratory' | 'imaging' | 'procedure' | 'therapy' | 'emergency';
  description: string;
  duration: string;
  price: number;
  preparation?: string;
  requirements?: string[];
  is_available: boolean;
  home_service_available: boolean;
  equipment_required?: string[];
  status: 'available' | 'unavailable' | 'maintenance';
  popular: boolean;
  display_order: number;
  doctor_specialty?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'diagnostic' | 'treatment' | 'monitoring' | 'laboratory' | 'surgical';
  model?: string;
  serial_number?: string;
  location?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  last_maintenance?: string;
  next_maintenance?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  task_type: 'patient_care' | 'equipment_maintenance' | 'administrative' | 'training' | 'other';
  related_patient_id?: string;
  related_equipment_id?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    name: string;
    email: string;
  };
  creator_user?: {
    name: string;
    email: string;
  };
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  reason?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  appointment_type: 'consultation' | 'follow-up' | 'check-up' | 'emergency';
  consultation_type: 'in-person' | 'video-call' | 'phone';
  duration_minutes: number;
  fee?: number;
  notes?: string;
  created_at: string;
  patients?: {
    users: { name: string; email: string; phone?: string };
  };
  doctors?: {
    users: { name: string; email: string };
    specialty: string;
  };
}

export class StaffDataService {
  // User Management
  static async getAllUsers(role?: 'patient' | 'doctor' | 'staff' | 'admin') {
    let query = supabase
      .from('users')
      .select(`
        *,
        staff:staff(id, position),
        doctors:doctors(id, specialty, is_available),
        patients:patients(id, date_of_birth, gender)
      `);
    
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'patient' | 'doctor' | 'staff' | 'admin';
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, userData: Partial<StaffUser>) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Doctor Management
  static async getAllDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        users!doctors_user_id_fkey(
          id, name, email, phone
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createDoctor(doctorData: {
    user_id: string;
    specialty: string;
    consultation_fee: number;
    license_number?: string;
    years_experience?: number;
    education?: string;
    certifications?: string;
    video_consultation_available?: boolean;
    video_consultation_fee?: number;
  }) {
    const { data, error } = await supabase
      .from('doctors')
      .insert(doctorData)
      .select(`
        *,
        users!doctors_user_id_fkey(
          id, name, email, phone
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateDoctor(id: string, doctorData: Partial<Doctor>) {
    const { data, error } = await supabase
      .from('doctors')
      .update(doctorData)
      .eq('id', id)
      .select(`
        *,
        users!doctors_user_id_fkey(
          id, name, email, phone
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteDoctor(id: string) {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Patient Management
  static async getAllPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        users!patients_user_id_fkey(
          id, name, email, phone
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createPatient(patientData: {
    user_id: string;
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
  }) {
    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select(`
        *,
        users!patients_user_id_fkey(
          id, name, email, phone
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePatient(id: string, patientData: Partial<Patient>) {
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id)
      .select(`
        *,
        users!patients_user_id_fkey(
          id, name, email, phone
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Service Management
  static async getAllServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async createService(serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateService(id: string, serviceData: Partial<Service>) {
    const { data, error } = await supabase
      .from('services')
      .update({ ...serviceData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteService(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Equipment Management
  static async getAllEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async createEquipment(equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('equipment')
      .insert(equipmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateEquipment(id: string, equipmentData: Partial<Equipment>) {
    const { data, error } = await supabase
      .from('equipment')
      .update({ ...equipmentData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Appointment Management
  static async getAllAppointments(filters?: {
    status?: string;
    doctor_id?: string;
    patient_id?: string;
    date_from?: string;
    date_to?: string;
  }) {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients!appointments_patient_id_fkey(
          users!patients_user_id_fkey(name, email, phone)
        ),
        doctors!appointments_doctor_id_fkey(
          users!doctors_user_id_fkey(name, email),
          specialty
        )
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }
    if (filters?.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters?.date_from) {
      query = query.gte('appointment_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('appointment_date', filters.date_to);
    }

    query = query.order('appointment_date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async updateAppointmentStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed', notes?: string) {
    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patients!appointments_patient_id_fkey(
          users!patients_user_id_fkey(name, email, phone)
        ),
        doctors!appointments_doctor_id_fkey(
          users!doctors_user_id_fkey(name, email),
          specialty
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Task Management
  static async getAllTasks(filters?: {
    assigned_to?: string;
    status?: string;
    priority?: string;
    task_type?: string;
  }) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:users!tasks_assigned_to_fkey(name, email),
        creator_user:users!tasks_created_by_fkey(name, email)
      `);

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.task_type) {
      query = query.eq('task_type', filters.task_type);
    }

    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async createTask(taskData: {
    assigned_to: string;
    created_by: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
    task_type: 'patient_care' | 'equipment_maintenance' | 'administrative' | 'training' | 'other';
    related_patient_id?: string;
    related_equipment_id?: string;
  }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select(`
        *,
        assigned_user:users!tasks_assigned_to_fkey(name, email),
        creator_user:users!tasks_created_by_fkey(name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_user:users!tasks_assigned_to_fkey(name, email),
        creator_user:users!tasks_created_by_fkey(name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Dashboard Statistics
  static async getDashboardStats() {
    const [
      appointmentsResult,
      patientsResult,
      doctorsResult,
      tasksResult
    ] = await Promise.all([
      supabase.from('appointments').select('status', { count: 'exact' }),
      supabase.from('patients').select('*', { count: 'exact' }),
      supabase.from('doctors').select('is_available', { count: 'exact' }),
      supabase.from('tasks').select('status', { count: 'exact' })
    ]);

    const appointments = appointmentsResult.data || [];
    const tasks = tasksResult.data || [];
    
    return {
      totalPatients: patientsResult.count || 0,
      totalDoctors: doctorsResult.count || 0,
      totalAppointments: appointmentsResult.count || 0,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      totalTasks: tasksResult.count || 0,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
    };
  }

  // Notification Management
  static async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    priority?: 'low' | 'medium' | 'high';
    related_appointment_id?: string;
    related_test_id?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}