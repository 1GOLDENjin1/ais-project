import { supabase, type Database } from '../supabase';

// Types from database - Updated for simplified schema
export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // Changed from password_hash
  phone?: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  created_at: string;
};

export type Patient = {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
};

export type Doctor = {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating?: number;
};

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string; // Changed from appointment_type
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason?: string | null;
  created_at: string;
};

export type HealthMetric = {
  id: string;
  patient_id?: string;
  metric_type: string;
  value: string;
  recorded_at: string;
};

export type Notification = {
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
};

export type Task = {
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
  updated_at: string;
};

export type MedicalRecord = {
  id: string;
  patient_id?: string;
  doctor_id?: string;
  appointment_id?: string;
  diagnosis?: string;
  notes?: string;
  created_at: string;
};

export type LabTest = {
  id: string;
  patient_id?: string;
  doctor_id?: string;
  appointment_id?: string;
  test_type: string;
  result?: string;
  created_at: string;
};

export type Payment = {
  id: string;
  appointment_id?: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'failed'; // Match actual schema
  provider?: string | null;
  transaction_ref?: string | null;
  created_at: string;
};

// Services types (since they're not in Database type yet)
export interface Service {
  id: string;
  name: string;
  category: 'laboratory' | 'imaging' | 'consultation' | 'examination' | 'vaccination' | 'testing';
  description: string;
  duration: string;
  price: number;
  preparation?: string;
  requirements?: string[];
  is_available: boolean;
  home_service_available?: boolean;
  equipment_required?: string[];
  status: 'available' | 'limited' | 'unavailable' | 'maintenance';
  popular: boolean;
  display_order: number;
  doctor_specialty?: string;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
}

// User operations
export const userService = {
  async create(userData: {
    email: string;
    password: string;
    role: 'patient' | 'doctor' | 'staff' | 'admin';
    name: string;
    phone?: string;
  }): Promise<User | null> {
    try {
      // Store password as plain text for this simplified schema
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password: userData.password, // Direct password storage (not recommended for production)
          role: userData.role,
          name: userData.name,
          phone: userData.phone,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      console.log('Getting user by email:', email); // Debug log

      // Query actual Supabase database (simplified schema)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        // If error means no rows found, return null; otherwise throw
        if ((error as any).code === 'PGRST116') {
          console.log('User not found in database');
          return null;
        }
        throw error;
      }

      if (data) {
        console.log('Found user in database:', data.name); // Debug log
        return data as unknown as User;
      }

      console.log('User not found'); // Debug log
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  async getById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  },

  async update(id: string, userData: {
    name?: string;
    phone?: string;
    avatar?: string;
  }): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      console.log('=== AUTHENTICATION DEBUG START ===');
      console.log('Authenticating user:', email);
      console.log('Password provided:', password);
      // First try server-side RPC authenticate (avoids RLS blocking anon selects)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_authenticate_user', { p_email: email, p_password: password });
        console.log('RPC auth response:', { rpcData, rpcError });
        if (!rpcError && rpcData) {
          // supabase.rpc may return an array of rows or a single object depending on function
          const rpcUser = Array.isArray(rpcData) ? (rpcData.length > 0 ? rpcData[0] : null) : rpcData;
          if (rpcUser) {
            console.log('✅ RPC authentication successful for:', rpcUser.email);
            console.log('=== AUTHENTICATION DEBUG END ===');
            return rpcUser as User;
          }
        }
      } catch (rpcErr) {
        console.warn('RPC auth failed, falling back to client-side select:', rpcErr);
      }

      const user = await userService.getByEmail(email);
      
      if (!user) {
        console.log('❌ User not found:', email);
        console.log('=== AUTHENTICATION DEBUG END ===');
        return null;
      }

      console.log('✅ User found:', user.name, user.role);
      console.log('Stored password:', user.password);

      // Direct password comparison for simplified schema
      const isValidPassword = user.password === password;
      console.log('Password match:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Password validation failed');
        console.log('Expected:', user.password);
        console.log('Got:', password);
        console.log('=== AUTHENTICATION DEBUG END ===');
        return null;
      }

      console.log('✅ Authentication successful for:', user.name);
      console.log('=== AUTHENTICATION DEBUG END ===');
      return user;
    } catch (error) {
      console.error('❌ Error authenticating user:', error);
      console.log('=== AUTHENTICATION DEBUG END ===');
      return null;
    }
  },

  async getUsersByRole(role: 'doctor' | 'staff' | 'patient' | 'admin'): Promise<User[]> {
    try {
      console.log(`Getting users with role: ${role}`);

      // Get from database (simplified schema)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role);

      if (data && data.length > 0) {
        console.log(`Found ${data.length} ${role} users in database`);
        return data;
      }
      if (error && error.code !== 'PGRST116') {
        throw error; // Throw if it's a real error, not just "no data found"
      }

      console.log(`No ${role} users found in database`);
      return [];
    } catch (error) {
      console.error(`Error getting users by role ${role}:`, error);
      return [];
    }
  }
};

// Patient operations
export const patientService = {
  async create(patientData: {
    user_id: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
  }): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating patient:', error);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting patient by user id:', error);
      return null;
    }
  },

  async getById(id: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting patient by id:', error);
      return null;
    }
  },

  async update(id: string, patientData: {
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_type?: string;
    allergies?: string;
    medical_history?: string;
    insurance_provider?: string;
    insurance_number?: string;
  }): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating patient:', error);
      return null;
    }
  },

  async getAll(): Promise<Patient[]> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all patients:', error);
      return [];
    }
  }
};

// Doctor operations
export const doctorService = {
  async create(doctorData: {
    user_id: string;
    specialty: string;
    consultation_fee: number;
    rating?: number;
  }): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .insert(doctorData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating doctor:', error);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting doctor by user id:', error);
      return null;
    }
  },

  async getById(id: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting doctor by id:', error);
      return null;
    }
  },

  async getAllWithUsers(): Promise<(Doctor & { name: string; email: string })[]> {
    try {
      // Try SECURITY DEFINER RPC first (works even when RLS blocks anon selects)
      try {
        console.debug('Attempting RPC get_doctors_public() to fetch public doctor list');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_doctors_public');
        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          // rpc returns objects with id, user_id, specialty, consultation_fee, rating, display_name
          return (rpcData as any[]).map(d => ({
            id: d.id,
            user_id: d.user_id,
            specialty: d.specialty,
            consultation_fee: d.consultation_fee,
            rating: d.rating ?? null,
            // map display_name -> name/email unknown from RPC; keep email empty if not provided
            name: d.display_name || d.name || '',
            email: d.email || ''
          } as Doctor & { name: string; email: string }));
        }
        if (rpcError) {
          console.debug('RPC get_doctors_public() returned error or no rows, falling back to direct selects', rpcError);
        }
      } catch (rpcErr) {
        console.debug('RPC get_doctors_public() not available or failed, falling back to selects', rpcErr);
      }

      // Fallback: normal selects (may be blocked by RLS)
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*');

      if (error) throw error;
      if (!doctors || doctors.length === 0) {
        return [];
      }

      const userIds = doctors.map((doctor) => doctor.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users for doctors:', usersError);
        throw usersError;
      }

      if ((!users || users.length === 0) && userIds.length > 0) {
        console.warn('No user profiles returned for doctor user_ids. Possible causes: RLS blocking anon SELECTs, role value mismatch, or missing users. userIds=', userIds);
      }

      const userMap = new Map((users || []).map((user) => [user.id, user]));

      return doctors
        .map((doctor) => {
          const user = userMap.get(doctor.user_id);
          if (!user) {
            return null;
          }

          return {
            ...doctor,
            name: user.name,
            email: user.email
          };
        })
        .filter((doctor): doctor is Doctor & { name: string; email: string } => doctor !== null);
    } catch (error) {
      console.error('Error getting doctors with users:', error);
      return [];
    }
  },

  async getAll(): Promise<Doctor[]> {
    try {
      // Prefer RPC that returns public doctors when available (bypasses RLS)
      try {
        console.debug('Attempting RPC get_doctors_public() for getAll');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_doctors_public');
        if (!rpcError && rpcData) {
          // Map to Doctor[] shape
          return (rpcData as any[]).map(d => ({
            id: d.id,
            user_id: d.user_id,
            specialty: d.specialty,
            consultation_fee: d.consultation_fee,
            rating: d.rating ?? null
          } as Doctor));
        }
        if (rpcError) console.debug('get_doctors_public rpc error:', rpcError);
      } catch (rpcErr) {
        console.debug('get_doctors_public rpc not available', rpcErr);
      }

      const { data, error } = await supabase
        .from('doctors')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all doctors:', error);
      return [];
    }
  }
};

// Staff operations
export const staffService = {
  async create(staffData: {
    user_id: string;
    position: string;
  }): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert(staffData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating staff:', error);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting staff by user id:', error);
      return null;
    }
  }
};

// Appointment operations
export const appointmentService = {
  async create(appointmentData: {
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    service_type: string; // Changed from appointment_type
    reason?: string;
  }): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: appointmentData.patient_id,
          doctor_id: appointmentData.doctor_id,
          appointment_date: appointmentData.appointment_date,
          appointment_time: appointmentData.appointment_time,
          service_type: appointmentData.service_type,
          reason: appointmentData.reason,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      return null;
    }
  },

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting appointments by patient id:', error);
      return [];
    }
  },

  async getByDoctorId(doctorId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting appointments by doctor id:', error);
      return [];
    }
  },

  async getTodayByDoctorId(doctorId: string): Promise<Appointment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting today appointments by doctor id:', error);
      return [];
    }
  }
};

// Health Metrics operations
export const healthMetricService = {
  async create(metricData: {
    patient_id: string;
    metric_type: 'blood-pressure' | 'heart-rate' | 'weight' | 'height' | 'bmi' | 'temperature' | 'blood-sugar' | 'cholesterol';
    value: string;
    unit?: string;
    recorded_date: string;
    notes?: string;
  }): Promise<HealthMetric | null> {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .insert({
          ...metricData,
          recorded_by: 'patient'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating health metric:', error);
      return null;
    }
  },

  async getByPatientId(patientId: string): Promise<HealthMetric[]> {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting health metrics by patient id:', error);
      return [];
    }
  }
};

// Notification operations
export const notificationService = {
  async create(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type: 'appointment' | 'test-result' | 'prescription' | 'general' | 'emergency';
    priority?: 'low' | 'medium' | 'high';
  }): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notifications by user id:', error);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
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
};

// Task operations
export const taskService = {
  async create(taskData: {
    assigned_to: string;
    created_by: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    task_type: 'maintenance' | 'patient-care' | 'administrative' | 'equipment' | 'other';
    due_date?: string;
  }): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  },

  async getByAssignedTo(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tasks by assigned user:', error);
      return [];
    }
  },

  async updateStatus(taskId: string, status: 'pending' | 'in-progress' | 'completed' | 'cancelled'): Promise<boolean> {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }
};

// Medical Records operations
export const medicalRecordService = {
  async create(recordData: {
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    record_type: 'consultation' | 'lab-results' | 'imaging' | 'prescription' | 'diagnosis' | 'treatment-plan';
    title: string;
    description?: string;
    diagnosis?: string;
    treatment?: string;
    medications?: string;
    follow_up_instructions?: string;
    record_date: string;
    is_confidential?: boolean;
    status?: 'draft' | 'final' | 'reviewed' | 'archived';
  }): Promise<MedicalRecord | null> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert(recordData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating medical record:', error);
      return null;
    }
  },

  async getByPatientId(patientId: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctors (
            users (
              name
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('record_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return [];
    }
  },

  async getByDoctorId(doctorId: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patients (
            users (
              name
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .order('record_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return [];
    }
  }
};

// Prescription operations
export const prescriptionService = {
  async create(prescriptionData: {
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
    refills_allowed?: number;
    prescribed_date: string;
    expiry_date?: string;
  }): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert(prescriptionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating prescription:', error);
      return null;
    }
  },

  async getByPatientId(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors (
            users (
              name
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('prescribed_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
  },

  async getByDoctorId(doctorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (
            users (
              name
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .order('prescribed_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
  },

  async updateStatus(prescriptionId: string, status: 'active' | 'completed' | 'cancelled' | 'expired'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status })
        .eq('id', prescriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating prescription status:', error);
      return false;
    }
  }
};

// Lab Tests operations
export const labTestService = {
  async create(testData: {
    patient_id: string;
    doctor_id: string;
    staff_id?: string;
    test_name: string;
    test_type: 'blood-work' | 'urine' | 'x-ray' | 'mri' | 'ct-scan' | 'ecg' | 'ultrasound' | 'other';
    test_date: string;
    status?: 'ordered' | 'in-progress' | 'completed' | 'reviewed' | 'cancelled';
    results?: string;
    normal_ranges?: string;
    abnormal_findings?: string;
    priority?: 'routine' | 'urgent' | 'stat';
    cost?: number;
  }): Promise<LabTest | null> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .insert(testData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lab test:', error);
      return null;
    }
  },

  async getByPatientId(patientId: string): Promise<LabTest[]> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          doctors (
            users (
              name
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      return [];
    }
  },

  async getByDoctorId(doctorId: string): Promise<LabTest[]> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          patients (
            users (
              name
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      return [];
    }
  },

  async getRecentResults(doctorId: string, limit: number = 10): Promise<LabTest[]> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          patients (
            users (
              name
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .in('status', ['completed', 'reviewed'])
        .order('test_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent lab results:', error);
      return [];
    }
  },

  async getByStaffId(staffId: string): Promise<LabTest[]> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('staff_id', staffId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lab tests by staff:', error);
      return [];
    }
  },

  async updateResults(testId: string, updates: {
    results?: string;
    normal_ranges?: string;
    abnormal_findings?: string;
    status?: 'ordered' | 'in-progress' | 'completed' | 'reviewed' | 'cancelled';
  }): Promise<LabTest | null> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .update(updates)
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lab test results:', error);
      return null;
    }
  }
};

// Payment operations
export const paymentService = {
  async create(paymentData: {
    appointment_id?: string;
    amount: number;
    status?: 'pending' | 'paid' | 'failed';
    provider?: string;
    transaction_ref?: string;
  }): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          appointment_id: paymentData.appointment_id,
          amount: paymentData.amount,
          status: paymentData.status || 'pending',
          provider: paymentData.provider || 'PayMongo',
          transaction_ref: paymentData.transaction_ref
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      return null;
    }
  },

  async getByPatientId(patientId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          appointments (
            appointment_date,
            appointment_time,
            doctors (
              users (
                name
              )
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Payment[]) || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  async updateStatus(paymentId: string, status: 'pending' | 'paid' | 'failed'): Promise<boolean> {
    try {
      const updateData: any = { status };
      // Remove payment_date logic since that field doesn't exist in the database

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  },

  async update(paymentId: string, updates: Partial<Omit<Payment, 'id' | 'created_at'>>): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Payment;
    } catch (error) {
      console.error('Error updating payment:', error);
      return null;
    }
  }
};

// Services operations
export const serviceService = {
  async getAll(): Promise<Service[]> {
    try {
      // Try RPC-based staff_services or a public services RPC first (bypasses RLS)
      try {
        console.debug('Attempting RPC staff_services() to fetch services');
        // Try a few common RPC parameter shapes; fallback if RPC missing
        const tryRpc = async (params: any) => {
          const { data: rpcData, error: rpcError } = await supabase.rpc('staff_services', params as any);
          if (!rpcError && rpcData) return rpcData as any[];
          return null;
        };

        let rpcResult = await tryRpc({ p_limit: 100, p_offset: 0 }).catch(() => null);
        if (!rpcResult) rpcResult = await tryRpc({ limit: 100, offset: 0 }).catch(() => null);
        if (!rpcResult) rpcResult = await tryRpc({}).catch(() => null);

        if (rpcResult && Array.isArray(rpcResult)) {
          // Ensure we only return available services if RPC doesn't already filter
          const mapped = rpcResult.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            description: s.description,
            duration: s.duration,
            price: s.price,
            preparation: s.preparation,
            requirements: s.requirements,
            is_available: s.is_available === undefined ? true : !!s.is_available,
            home_service_available: s.home_service_available,
            equipment_required: s.equipment_required,
            status: s.status || 'available',
            popular: !!s.popular,
            display_order: s.display_order || 0,
            doctor_specialty: s.doctor_specialty,
            created_at: s.created_at,
            updated_at: s.updated_at
          } as Service));
          return mapped.sort((a,b) => (a.display_order - b.display_order) || a.name.localeCompare(b.name));
        }
      } catch (rpcErr) {
        console.debug('staff_services RPC not available or errored, falling back to direct select', rpcErr);
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_available', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting services:', error);
      return [];
    }
  },

  async getByCategory(category: string): Promise<Service[]> {
    try {
      if (category === 'all') {
        return await serviceService.getAll();
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', category)
        .eq('is_available', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting services by category:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Service | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting service by id:', error);
      return null;
    }
  },

  async getPopular(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('popular', true)
        .eq('is_available', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting popular services:', error);
      return [];
    }
  },

  async search(searchTerm: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,doctor_specialty.ilike.%${searchTerm}%`)
        .eq('is_available', true)
        .order('popular', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  }
};

// Service Packages operations
export const servicePackageService = {
  async getAll(): Promise<ServicePackage[]> {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting service packages:', error);
      return [];
    }
  },

  async getById(id: string): Promise<ServicePackage | null> {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting service package by id:', error);
      return null;
    }
  },

  async getPopular(): Promise<ServicePackage[]> {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('popular', true)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(4);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting popular service packages:', error);
      return [];
    }
  },

  async getServicesInPackage(packageId: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('package_services')
        .select(`
          services (*)
        `)
        .eq('package_id', packageId);

      if (error) throw error;
      return data?.map(item => (item as any).services).filter(Boolean) || [];
    } catch (error) {
      console.error('Error getting services in package:', error);
      return [];
    }
  }
};

// Combined database service
export const db = {
  // User methods
  getUserByEmail: userService.getByEmail,
  getUserById: userService.getById,
  getUsersByRole: userService.getUsersByRole,
  createUser: userService.create,
  updateUser: userService.update,
  authenticateUser: userService.authenticate,

  // Patient methods
  getPatientByUserId: patientService.getByUserId,
  getPatientById: patientService.getById,
  createPatient: patientService.create,
  updatePatient: patientService.update,

  // Doctor methods
  getDoctorByUserId: doctorService.getByUserId,
  getDoctorById: doctorService.getById,
  getAllDoctors: doctorService.getAll,
  getAllDoctorsWithUsers: doctorService.getAllWithUsers,
  createDoctor: doctorService.create,

  // Staff methods
  getStaffByUserId: staffService.getByUserId,
  createStaff: staffService.create,

  // Appointment methods
  getAppointmentsByPatientId: appointmentService.getByPatientId,
  getAppointmentsByDoctorId: appointmentService.getByDoctorId,
  getTodayAppointmentsByDoctorId: appointmentService.getTodayByDoctorId,
  createAppointment: appointmentService.create,

  // Health Metrics methods
  getHealthMetricsByPatientId: healthMetricService.getByPatientId,
  createHealthMetric: healthMetricService.create,

  // Notification methods
  getNotificationsByUserId: notificationService.getByUserId,
  createNotification: notificationService.create,
  markNotificationAsRead: notificationService.markAsRead,

  // Task methods
  getPendingTasksByAssignedTo: taskService.getByAssignedTo,
  createTask: taskService.create,
  updateTaskStatus: taskService.updateStatus,

  // Medical Records methods
  getMedicalRecordsByPatientId: medicalRecordService.getByPatientId,
  getMedicalRecordsByDoctorId: medicalRecordService.getByDoctorId,
  createMedicalRecord: medicalRecordService.create,

  // Prescription methods
  getPrescriptionsByPatientId: prescriptionService.getByPatientId,
  getPrescriptionsByDoctorId: prescriptionService.getByDoctorId,
  createPrescription: prescriptionService.create,
  updatePrescriptionStatus: prescriptionService.updateStatus,

  // Lab Tests methods
  getLabTestsByPatientId: labTestService.getByPatientId,
  getLabTestsByDoctorId: labTestService.getByDoctorId,
  getLabTestsByStaffId: labTestService.getByStaffId,
  getRecentLabResults: labTestService.getRecentResults,
  createLabTest: labTestService.create,
  updateLabTestResults: labTestService.updateResults,

  // Payment methods
  createPayment: paymentService.create,
  getPaymentsByPatientId: paymentService.getByPatientId,
  updatePaymentStatus: paymentService.updateStatus,
  updatePayment: paymentService.update,

  // Services methods
  getAllServices: serviceService.getAll,
  getServicesByCategory: serviceService.getByCategory,
  getServiceById: serviceService.getById,
  getPopularServices: serviceService.getPopular,
  searchServices: serviceService.search,

  // Service Packages methods
  getAllServicePackages: servicePackageService.getAll,
  getServicePackageById: servicePackageService.getById,
  getPopularServicePackages: servicePackageService.getPopular,
  getServicesInPackage: servicePackageService.getServicesInPackage,
};

// Debug function for testing - attach to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).testAuth = async (email: string, password: string) => {
    console.log('🧪 Testing authentication...');
    const result = await db.authenticateUser(email, password);
    console.log('🧪 Test result:', result);
    return result;
  };
  
  (window as any).testUsers = () => {
    console.log('🧪 Available test users:');
    console.log('doctor@mendoza-clinic.com / password123');
    console.log('staff@mendoza-clinic.com / password123');
    console.log('patient@test.com / password123');
    console.log('paenggineda471+1@gmail.com / qwertyu');
    console.log('---');
    console.log('Usage: testAuth("email", "password")');
  };
}