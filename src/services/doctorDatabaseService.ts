import { supabase } from '../lib/supabase';

// Doctor-specific interfaces for healthcare operations
export interface DoctorAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  reason?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  appointment_type?: string;
  consultation_type?: 'in-person' | 'video-call' | 'phone';
  duration_minutes?: number;
  fee?: number;
  notes?: string;
  created_at: string;
  patient?: {
    id: string;
    date_of_birth?: string;
    gender?: string;
    blood_type?: string;
    allergies?: string;
    medical_history?: string;
    users?: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    payment_method?: string;
  }>;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
}

export interface DoctorPatient {
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
  users?: {
    name: string;
    email: string;
    phone?: string;
  };
  recent_appointments?: DoctorAppointment[];
  recent_records?: DoctorMedicalRecord[];
}

export interface DoctorMedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  diagnosis?: string;
  notes?: string;
  created_at: string;
  patient?: {
    users?: {
      name: string;
    };
  };
  appointment?: {
    appointment_date: string;
    service_type: string;
  };
  prescriptions?: Array<{
    id: string;
    medication_name: string;
    dosage?: string;
    instructions?: string;
  }>;
  lab_tests?: Array<{
    id: string;
    test_type: string;
    result?: string;
    created_at: string;
  }>;
}

export interface DoctorPrescription {
  id: string;
  medical_record_id: string;
  medication_name: string;
  dosage?: string;
  instructions?: string;
  created_at: string;
  medical_record?: {
    patient?: {
      users?: {
        name: string;
      };
    };
    appointment?: {
      appointment_date: string;
    };
  };
}

export interface DoctorLabTest {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  test_type: string;
  result?: string;
  created_at: string;
  patient?: {
    users?: {
      name: string;
    };
  };
  appointment?: {
    appointment_date: string;
    service_type: string;
  };
}

export interface DoctorMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  appointment_id?: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'voice';
  is_read: boolean;
  created_at: string;
  sender?: {
    name: string;
  };
  receiver?: {
    name: string;
  };
}

export interface DoctorMessageThread {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  last_message_at: string;
  is_active: boolean;
  patient?: {
    name: string;
    email: string;
  };
  last_message?: {
    message_text: string;
    sender_id: string;
  };
}

export interface DoctorVideoCall {
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
  notes?: string;
  patient?: {
    users?: {
      name: string;
    };
  };
  appointment?: {
    appointment_date: string;
    appointment_time: string;
    service_type: string;
  };
}

export interface DoctorTask {
  id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  task_type: string;
  related_patient_id?: string;
  created_at: string;
  patient?: {
    users?: {
      name: string;
    };
  };
  creator?: {
    name: string;
  };
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating?: number;
  license_number?: string;
  years_experience?: number;
  education?: string;
  certifications?: string;
  is_available: boolean;
  video_consultation_available?: boolean;
  video_consultation_fee?: number;
  users?: {
    name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Doctor Management Service
 * Provides comprehensive database operations for doctor-specific workflows
 */
export class DoctorManagementService {
  // =================== DOCTOR LOOKUP ===================
  /**
   * Fetch doctor profile by the authenticated user's id (maps user_id -> doctors.id)
   */
  static async getDoctorProfileByUserId(userId: string): Promise<DoctorProfile | null> {
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
      return data as unknown as DoctorProfile;
    } catch (error) {
      console.error('Error fetching doctor profile by user id:', error);
      return null;
    }
  }

  
  // =================== APPOINTMENT OPERATIONS ===================
  
  /**
   * Get all appointments for the current doctor
   */
  static async getMyAppointments(doctorId: string): Promise<DoctorAppointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients!patient_id (
            id,
            date_of_birth,
            gender,
            blood_type,
            allergies,
            medical_history,
            users:user_id (
              name,
              email,
              phone
            )
          ),
          payments (
            id,
            amount,
            status,
            payment_method
          )
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      return [];
    }
  }

  /**
   * Get today's appointments for the doctor
   */
  static async getTodaysAppointments(doctorId: string): Promise<DoctorAppointment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients!patient_id (
            id,
            users:user_id (
              name,
              email,
              phone
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      return [];
    }
  }

  /**
   * Update appointment status (confirm, complete, cancel)
   */
  static async updateAppointmentStatus(
    appointmentId: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    notes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { status };
      if (notes) {
        updateData.notes = notes;
      }

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

  /**
   * Reschedule an appointment
   */
  static async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'confirmed'
      };
      
      if (reason) {
        updateData.notes = `Rescheduled: ${reason}`;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return false;
    }
  }

  // =================== SCHEDULE OPERATIONS ===================
  
  /**
   * Get doctor's own schedule
   */
  static async getMySchedule(doctorId: string): Promise<DoctorSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('available_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
      return [];
    }
  }

  /**
   * Add new schedule slot
   */
  static async addScheduleSlot(
    doctorId: string,
    availableDate: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .insert([{
          doctor_id: doctorId,
          available_date: availableDate,
          start_time: startTime,
          end_time: endTime
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding schedule slot:', error);
      return false;
    }
  }

  /**
   * Update schedule slot
   */
  static async updateScheduleSlot(
    scheduleId: string,
    availableDate?: string,
    startTime?: string,
    endTime?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      if (availableDate) updateData.available_date = availableDate;
      if (startTime) updateData.start_time = startTime;
      if (endTime) updateData.end_time = endTime;

      const { error } = await supabase
        .from('doctor_schedules')
        .update(updateData)
        .eq('id', scheduleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating schedule slot:', error);
      return false;
    }
  }

  /**
   * Delete schedule slot
   */
  static async deleteScheduleSlot(scheduleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting schedule slot:', error);
      return false;
    }
  }

  // =================== PATIENT OPERATIONS ===================
  
  /**
   * Get all patients assigned to this doctor (via appointments)
   */
  static async getMyPatients(doctorId: string): Promise<DoctorPatient[]> {
    try {
      // First get patient IDs from appointments
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorId);

      if (appointmentError) throw appointmentError;
      
      const patientIds = [...new Set(appointmentData?.map(apt => apt.patient_id) || [])];
      
      if (patientIds.length === 0) {
        return [];
      }

      // Then get patient details
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
        .in('id', patientIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }

  /**
   * Get detailed patient information including recent appointments and records
   */
  static async getPatientDetails(patientId: string, doctorId: string): Promise<DoctorPatient | null> {
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

      // Get recent appointments for this patient with this doctor
      const appointments = await this.getPatientAppointments(patientId, doctorId);
      const records = await this.getPatientMedicalRecords(patientId, doctorId);

      return {
        ...data,
        recent_appointments: appointments.slice(0, 5),
        recent_records: records.slice(0, 5)
      };
    } catch (error) {
      console.error('Error fetching patient details:', error);
      return null;
    }
  }

  /**
   * Get patient's appointments with this doctor
   */
  static async getPatientAppointments(patientId: string, doctorId: string): Promise<DoctorAppointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients!patient_id (
            users:user_id (name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  }

  // =================== MEDICAL RECORDS OPERATIONS ===================
  
  /**
   * Get all medical records created by this doctor
   */
  static async getMyMedicalRecords(doctorId: string): Promise<DoctorMedicalRecord[]> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients!patient_id (
            users:user_id (name)
          ),
          appointment:appointments!appointment_id (
            appointment_date,
            service_type
          ),
          prescriptions (
            id,
            medication_name,
            dosage,
            instructions
          )
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get lab tests separately and combine them
      if (data && data.length > 0) {
        const patientIds = [...new Set(data.map(record => record.patient_id))];
        const { data: labTests } = await supabase
          .from('lab_tests')
          .select('*')
          .in('patient_id', patientIds);

        // Group lab tests by patient_id
        const labTestsByPatient = (labTests || []).reduce((acc, test) => {
          if (!acc[test.patient_id]) acc[test.patient_id] = [];
          acc[test.patient_id].push(test);
          return acc;
        }, {} as Record<string, any[]>);

        // Add lab tests to medical records
        return data.map(record => ({
          ...record,
          lab_tests: labTestsByPatient[record.patient_id] || []
        }));
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return [];
    }
  }

  /**
   * Get medical records for a specific patient
   */
  static async getPatientMedicalRecords(patientId: string, doctorId: string): Promise<DoctorMedicalRecord[]> {
    try {
      // First get medical records
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          appointment:appointments!appointment_id (
            appointment_date,
            service_type
          ),
          prescriptions (
            id,
            medication_name,
            dosage,
            instructions
          )
        `)
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get lab tests separately for this patient
      const { data: labTests } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('patient_id', patientId);

      // Combine the data
      const recordsWithLabTests = (data || []).map(record => ({
        ...record,
        lab_tests: labTests || []
      }));

      return recordsWithLabTests;
    } catch (error) {
      console.error('Error fetching patient medical records:', error);
      return [];
    }
  }

  /**
   * Create new medical record
   */
  static async createMedicalRecord(
    patientId: string,
    doctorId: string,
    appointmentId: string,
    diagnosis?: string,
    notes?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert([{
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId,
          diagnosis,
          notes
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating medical record:', error);
      return null;
    }
  }

  /**
   * Update medical record
   */
  static async updateMedicalRecord(
    recordId: string,
    diagnosis?: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      if (diagnosis) updateData.diagnosis = diagnosis;
      if (notes) updateData.notes = notes;

      const { error } = await supabase
        .from('medical_records')
        .update(updateData)
        .eq('id', recordId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating medical record:', error);
      return false;
    }
  }

  // =================== PRESCRIPTION OPERATIONS ===================
  
  /**
   * Create prescription
   */
  static async createPrescription(
    medicalRecordId: string,
    medicationName: string,
    dosage?: string,
    instructions?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert([{
          medical_record_id: medicalRecordId,
          medication_name: medicationName,
          dosage,
          instructions
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating prescription:', error);
      return false;
    }
  }

  /**
   * Get all prescriptions by this doctor
   */
  static async getMyPrescriptions(doctorId: string): Promise<DoctorPrescription[]> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          medical_record:medical_records!medical_record_id (
            patient:patients!patient_id (
              users:user_id (name)
            ),
            appointment:appointments!appointment_id (
              appointment_date
            )
          )
        `)
        .eq('medical_record.doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
  }

  /**
   * Update prescription
   */
  static async updatePrescription(
    prescriptionId: string,
    medicationName?: string,
    dosage?: string,
    instructions?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      if (medicationName) updateData.medication_name = medicationName;
      if (dosage) updateData.dosage = dosage;
      if (instructions) updateData.instructions = instructions;

      const { error } = await supabase
        .from('prescriptions')
        .update(updateData)
        .eq('id', prescriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating prescription:', error);
      return false;
    }
  }

  // =================== LAB TEST OPERATIONS ===================
  
  /**
   * Order lab test for patient
   */
  static async orderLabTest(
    patientId: string,
    doctorId: string,
    appointmentId: string,
    testType: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lab_tests')
        .insert([{
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId,
          test_type: testType
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ordering lab test:', error);
      return false;
    }
  }

  /**
   * Get lab tests ordered by this doctor
   */
  static async getMyLabTests(doctorId: string): Promise<DoctorLabTest[]> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          patient:patients!patient_id (
            users:user_id (name)
          ),
          appointment:appointments!appointment_id (
            appointment_date,
            service_type
          )
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      return [];
    }
  }

  /**
   * Update lab test result
   */
  static async updateLabTestResult(testId: string, result: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lab_tests')
        .update({ result })
        .eq('id', testId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating lab test result:', error);
      return false;
    }
  }

  // =================== MESSAGING OPERATIONS ===================
  
  /**
   * Get message threads for this doctor
   */
  static async getMyMessageThreads(doctorId: string): Promise<DoctorMessageThread[]> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          patient:users!patient_id (
            name,
            email
          ),
          last_message:messages!last_message_id (
            message_text,
            sender_id
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message threads:', error);
      return [];
    }
  }

  /**
   * Send message to patient
   */
  static async sendMessage(
    doctorId: string,
    patientId: string,
    messageText: string,
    appointmentId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: doctorId,
          receiver_id: patientId,
          appointment_id: appointmentId,
          message_text: messageText,
          message_type: 'text'
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // =================== VIDEO CALL OPERATIONS ===================
  
  /**
   * Get video calls for this doctor
   */
  static async getMyVideoCalls(doctorId: string): Promise<DoctorVideoCall[]> {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .select(`
          *,
          patient:patients!patient_id (
            users:user_id (name)
          ),
          appointment:appointments!appointment_id (
            appointment_date,
            appointment_time,
            service_type
          )
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching video calls:', error);
      return [];
    }
  }

  /**
   * Start video call
   */
  static async startVideoCall(callId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'ongoing',
          started_at: new Date().toISOString()
        })
        .eq('id', callId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting video call:', error);
      return false;
    }
  }

  /**
   * End video call
   */
  static async endVideoCall(callId: string, notes?: string): Promise<boolean> {
    try {
      const endedAt = new Date().toISOString();
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'completed',
          ended_at: endedAt,
          notes
        })
        .eq('id', callId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ending video call:', error);
      return false;
    }
  }

  // =================== DOCTOR PROFILE OPERATIONS ===================
  
  /**
   * Get doctor's own profile
   */
  static async getMyProfile(doctorId: string): Promise<DoctorProfile | null> {
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
        .eq('id', doctorId)
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
  static async updateMyProfile(
    doctorId: string,
    updates: {
      specialty?: string;
      consultation_fee?: number;
      license_number?: string;
      years_experience?: number;
      education?: string;
      certifications?: string;
      is_available?: boolean;
      video_consultation_available?: boolean;
      video_consultation_fee?: number;
    }
  ): Promise<boolean> {
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

  // =================== TASK OPERATIONS ===================
  
  /**
   * Get tasks assigned to this doctor
   */
  static async getMyTasks(doctorId: string): Promise<DoctorTask[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          patient:patients!related_patient_id (
            users:user_id (name)
          ),
          creator:users!created_by (name)
        `)
        .eq('assigned_to', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor tasks:', error);
      return [];
    }
  }

  /**
   * Complete task
   */
  static async completeTask(taskId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    }
  }

  // =================== NOTIFICATIONS OPERATIONS ===================
  
  /**
   * Send notification to patient
   */
  static async sendNotificationToPatient(
    patientId: string,
    title: string,
    message: string,
    type: string = 'general',
    priority: 'low' | 'medium' | 'high' = 'medium',
    relatedAppointmentId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: patientId,
          title,
          message,
          type,
          priority,
          related_appointment_id: relatedAppointmentId
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // =================== REALTIME SUBSCRIPTIONS ===================
  
  /**
   * Subscribe to appointment changes for this doctor
   */
  static subscribeToMyAppointments(doctorId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel('doctor-appointments-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  /**
   * Subscribe to new messages for this doctor
   */
  static subscribeToMyMessages(doctorId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel('doctor-messages-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${doctorId}`
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  /**
   * Subscribe to lab test results
   */
  static subscribeToMyLabTests(doctorId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel('doctor-lab-tests-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'lab_tests',
          filter: `doctor_id=eq.${doctorId}`
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  /**
   * Subscribe to tasks assigned to this doctor
   */
  static subscribeToMyTasks(doctorId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel('doctor-tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `assigned_to=eq.${doctorId}`
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  /**
   * Unsubscribe helper
   */
  static unsubscribe(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

export default DoctorManagementService;
