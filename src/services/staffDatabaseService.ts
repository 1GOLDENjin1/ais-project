import { supabase } from '../lib/supabase';
import CrossRoleConnectionService from './crossRoleConnectionService';

// Enhanced interfaces for staff operations
export interface Staff {
  id: string;
  user_id: string;
  position: string;
  hire_date?: string;
  salary?: number;
  department?: string;
  supervisor_id?: string;
  performance_rating?: number;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  license_number: string;
  consultation_fee: number;
  rating?: number;
  years_experience?: number;
  education?: string;
  certifications?: string;
  availability_schedule?: any;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
}

// Extended Doctor interface for staff management
export interface StaffDoctor extends Doctor {
  years_of_experience?: number;
  room_number?: string;
  availability_status?: 'available' | 'busy' | 'break';
  bio?: string;
  qualifications?: string;
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
    role: string;
  };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category: string;
  is_active: boolean;
  requirements?: string;
  preparation_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  maintenance_schedule?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  created_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    name: string;
    email: string;
  };
  creator?: {
    name: string;
    email: string;
  };
}

// Complete appointment interface for staff operations
export interface StaffAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  reason?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  appointment_type?: string;
  consultation_type?: string;
  duration_minutes?: number;
  fee?: number;
  notes?: string;
  created_at: string;
  patient?: {
    id: string;
    users?: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  doctor?: {
    id: string;
    specialty: string;
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
    payment_date?: string;
  }>;
}

export interface StaffMedicalRecord {
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
      email: string;
    };
  };
  doctor?: {
    specialty: string;
    users?: {
      name: string;
    };
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
  }>;
}

export interface StaffPayment {
  id: string;
  appointment_id?: string;
  patient_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_date?: string;
  transaction_ref?: string;
  description?: string;
  created_at: string;
  patient?: {
    users?: {
      name: string;
      email: string;
    };
  };
  appointment?: {
    appointment_date: string;
    service_type: string;
    doctor?: {
      users?: {
        name: string;
      };
    };
  };
}

/**
 * Staff Management Operations
 */
export class StaffManagementService {
  // Get all staff members
  static async getAllStaff(): Promise<Staff[]> {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          users:user_id (
            id,
            name,
            email,
            phone,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  }

  // Get all appointments with complete details for staff dashboard
  static async getAllAppointments(): Promise<StaffAppointment[]> {
    try {
      console.log('🔍 Fetching appointments...');
      
      // Try simple query first to avoid 400 errors
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('❌ Simple appointments query failed:', error);
        throw error;
      }

      console.log('✅ Appointments fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      
      // Return mock data if database fails
      return [
        {
          id: 'mock-appointment-1',
          patient_id: 'patient-1',
          doctor_id: 'doctor-1',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '09:00:00',
          status: 'pending',
          service_type: 'consultation',
          created_at: new Date().toISOString(),
          notes: 'Database connection error - showing mock data',
          patient: {
            id: 'patient-1',
            users: {
              name: 'Database Error',
              email: 'error@example.com',
              phone: 'N/A'
            }
          },
          doctor: {
            id: 'doctor-1',
            specialty: 'General Medicine',
            users: {
              name: 'Dr. Error Handler',
              email: 'error@clinic.com',
              phone: 'N/A'
            }
          }
        } as any
      ];
    }
  }

  // Get all medical records with complete details
  static async getAllMedicalRecords(): Promise<StaffMedicalRecord[]> {
    try {
      console.log('🔍 Fetching medical records...');
      
      // Try simple query first
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Simple medical records query failed:', error);
        throw error;
      }

      console.log('✅ Medical records fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching medical records:', error);
      
      // Return mock data if database fails
      return [
        {
          id: 'mock-1',
          patient_id: 'patient-1',
          doctor_id: 'doctor-1',
          visit_date: new Date().toISOString().split('T')[0],
          diagnosis: 'Unable to load medical records',
          treatment: 'Please check database connection',
          notes: 'Database error occurred',
          created_at: new Date().toISOString(),
          patient: {
            users: {
              name: 'Database Error',
              email: 'error@example.com'
            }
          },
          doctor: {
            specialty: 'System',
            users: {
              name: 'Error Handler'
            }
          }
        } as any
      ];
    }
  }

  // Get all payments with complete details
  static async getAllPayments(): Promise<StaffPayment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patient:patients!patient_id (
            users:user_id (
              name,
              email
            )
          ),
          appointment:appointments!appointment_id (
            appointment_date,
            service_type,
            doctor:doctors!doctor_id (
              users:user_id (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  // Get all doctors
  static async getAllDoctors(): Promise<Doctor[]> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id (
            id,
            name,
            email,
            phone,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  }

  // Get all patients
  static async getAllPatients(): Promise<Patient[]> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          users:user_id (
            id,
            name,
            email,
            phone,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  // Get all services
  static async getAllServices(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  // Get all equipment
  static async getAllEquipment(): Promise<Equipment[]> {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  }

  // Get all tasks
  static async getAllTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:users!assigned_to (
            name,
            email
          ),
          creator:users!created_by (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  // Dashboard statistics
  static async getDashboardStats() {
    try {
      const [
        appointmentsResult,
        patientsResult,
        doctorsResult,
        paymentsResult,
        recordsResult,
        tasksResult
      ] = await Promise.all([
        supabase.from('appointments').select('id, status'),
        supabase.from('patients').select('id'),
        supabase.from('doctors').select('id'),
        supabase.from('payments').select('id, status, amount'),
        supabase.from('medical_records').select('id'),
        supabase.from('tasks').select('id, status')
      ]);

      const appointments = appointmentsResult.data || [];
      const payments = paymentsResult.data || [];
      const tasks = tasksResult.data || [];

      return {
        totalAppointments: appointments.length,
        confirmedAppointments: appointments.filter(apt => apt.status === 'confirmed').length,
        pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
        completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
        totalPatients: patientsResult.data?.length || 0,
        totalDoctors: doctorsResult.data?.length || 0,
        totalPayments: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        paidPayments: payments.filter(payment => payment.status === 'paid').length,
        pendingPayments: payments.filter(payment => payment.status === 'pending').length,
        totalRecords: recordsResult.data?.length || 0,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(task => task.status === 'pending').length,
        completedTasks: tasks.filter(task => task.status === 'completed').length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalAppointments: 0,
        confirmedAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalPatients: 0,
        totalDoctors: 0,
        totalPayments: 0,
        paidPayments: 0,
        pendingPayments: 0,
        totalRecords: 0,
        totalTasks: 0,
        pendingTasks: 0,
        completedTasks: 0
      };
    }
  }

  // Staff can update appointment status but cannot delete appointments
  static async updateAppointmentStatus(
    appointmentId: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    notes?: string
  ): Promise<boolean> {
    try {
      // Staff permission: Can update status but not delete
      const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!allowedStatuses.includes(status)) {
        throw new Error('Invalid status for staff update');
      }

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

  // Staff can reschedule appointments
  static async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'pending' // Reset to pending for doctor confirmation
      };
      if (notes) updateData.notes = notes;

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

  // Staff can view doctor schedules but cannot create them
  static async getDoctorSchedules(doctorId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('doctor_schedules')
        .select(`
          *,
          doctor:doctors!doctor_id (
            specialty,
            users:user_id (
              name,
              email
            )
          )
        `)
        .order('available_date', { ascending: true });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctor schedules:', error);
      return [];
    }
  }

  // Staff can suggest schedule updates but cannot directly modify
  static async suggestScheduleUpdate(
    doctorId: string,
    scheduleData: {
      available_date: string;
      start_time: string;
      end_time: string;
      reason: string;
    }
  ): Promise<string | null> {
    try {
      // Create a task for doctor to review schedule suggestion
      return await this.createTask({
        title: 'Schedule Update Suggestion',
        description: `Staff suggests schedule update: ${scheduleData.reason}. Date: ${scheduleData.available_date}, Time: ${scheduleData.start_time}-${scheduleData.end_time}`,
        assigned_to: doctorId,
        created_by: 'staff-system', // This should be the actual staff user ID
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error suggesting schedule update:', error);
      return null;
    }
  }

  // Update payment status
  static async updatePaymentStatus(
    paymentId: string,
    status: 'pending' | 'paid' | 'failed' | 'refunded',
    transactionRef?: string,
    paymentMethod?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { 
        status,
        payment_date: status === 'paid' ? new Date().toISOString() : null
      };
      if (transactionRef) updateData.transaction_ref = transactionRef;
      if (paymentMethod) updateData.payment_method = paymentMethod;

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
  }

  // Create new task
  static async createTask(taskData: {
    title: string;
    description?: string;
    assigned_to: string;
    created_by: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  // Update task status
  static async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    notes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { 
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      };
      if (notes) updateData.notes = notes;

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

  // Create new service
  static async createService(serviceData: {
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    category: string;
    requirements?: string;
    preparation_instructions?: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          is_active: true
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating service:', error);
      return null;
    }
  }

  // Update service
  static async updateService(serviceId: string, serviceData: Partial<Service>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('services')
        .update({
          ...serviceData,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating service:', error);
      return false;
    }
  }

  // Create equipment record
  static async createEquipment(equipmentData: {
    name: string;
    type: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    purchase_date?: string;
    warranty_expiry?: string;
    maintenance_schedule?: string;
    location?: string;
    notes?: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert({
          ...equipmentData,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating equipment:', error);
      return null;
    }
  }

  // Update equipment status
  static async updateEquipmentStatus(
    equipmentId: string,
    status: 'active' | 'inactive' | 'maintenance' | 'retired',
    notes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      const { error } = await supabase
        .from('equipment')
        .update(updateData)
        .eq('id', equipmentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating equipment status:', error);
      return false;
    }
  }

  // Delete medical record
  static async deleteMedicalRecord(recordId: string): Promise<boolean> {
    try {
      // Delete related prescriptions first
      await supabase
        .from('prescriptions')
        .delete()
        .eq('medical_record_id', recordId);

      // Delete the medical record
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting medical record:', error);
      return false;
    }
  }

  // Staff can add lab test requests and update results if authorized
  static async addLabTestRequest(
    patientId: string,
    doctorId: string,
    appointmentId: string,
    testType: string,
    notes?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId,
          test_type: testType,
          result: notes ? `Staff note: ${notes}` : null
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error adding lab test request:', error);
      return null;
    }
  }

  static async updateLabTestResult(
    testId: string,
    result: string,
    staffId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lab_tests')
        .update({
          result: `${result} (Updated by staff: ${staffId})`
        })
        .eq('id', testId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating lab test result:', error);
      return false;
    }
  }

  // Staff can view and update payment status for manual confirmations
  static async getPaymentDetails(paymentId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          appointment:appointments!appointment_id (
            appointment_date,
            appointment_time,
            service_type,
            patient:patients!patient_id (
              users:user_id (name, email, phone)
            ),
            doctor:doctors!doctor_id (
              specialty,
              users:user_id (name, email)
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

  static async confirmManualPayment(
    paymentId: string,
    paymentMethod: 'cash' | 'bank_transfer' | 'insurance',
    transactionRef?: string,
    staffId?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status: 'paid',
        payment_method: paymentMethod,
        payment_date: new Date().toISOString()
      };
      
      if (transactionRef) updateData.transaction_ref = transactionRef;
      if (staffId) updateData.description = `${updateData.description || ''} (Confirmed by staff: ${staffId})`;

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error confirming manual payment:', error);
      return false;
    }
  }

  // Staff notification management
  static async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: 'appointment' | 'payment' | 'medical' | 'system' | 'reminder' = 'system',
    priority: 'low' | 'medium' | 'high' = 'medium',
    relatedAppointmentId?: string,
    relatedTestId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          priority,
          is_read: false,
          related_appointment_id: relatedAppointmentId,
          related_test_id: relatedTestId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Staff can send appointment reminders
  static async sendAppointmentReminder(appointmentId: string): Promise<boolean> {
    try {
      // Get appointment details
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients!patient_id (
            users:user_id (id, name, email, phone)
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) throw error;

      // Send notification to patient
      return await this.sendNotification(
        appointment.patient.users.id,
        'Appointment Reminder',
        `This is a reminder for your appointment on ${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time}`,
        'reminder',
        'medium',
        appointmentId
      );
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      return false;
    }
  }

  // Staff can view user online status for support
  static async getUserOnlineStatus(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_online_status')
        .select(`
          *,
          user:users!user_id (
            id,
            name,
            email,
            role
          )
        `)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user online status:', error);
      return [];
    }
  }

  // Staff can view video call logs but cannot start calls
  static async getVideoCallLogs(appointmentId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('video_calls')
        .select(`
          *,
          appointment:appointments!appointment_id (
            appointment_date,
            appointment_time,
            service_type
          ),
          doctor:doctors!doctor_id (
            users:user_id (name)
          ),
          patient:patients!patient_id (
            users:user_id (name)
          ),
          participants:video_call_participants (*)
        `)
        .order('created_at', { ascending: false });

      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching video call logs:', error);
      return [];
    }
  }

  // Staff can view message threads for support but cannot send messages
  static async getMessageThreadsForSupport(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          patient:users!patient_id (name, email),
          doctor:users!doctor_id (name, email),
          last_message:messages!last_message_id (
            message_text,
            created_at,
            sender:users!sender_id (name)
          )
        `)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message threads:', error);
      return [];
    }
  }

  // Staff equipment management
  static async requestEquipmentMaintenance(
    equipmentId: string,
    description: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    staffId: string
  ): Promise<string | null> {
    try {
      // Create maintenance task
      const taskId = await this.createTask({
        title: 'Equipment Maintenance Request',
        description: `Equipment maintenance required: ${description}`,
        assigned_to: 'maintenance-team', // This should be actual maintenance team ID
        created_by: staffId,
        priority
      });

      // Update equipment status if urgent
      if (priority === 'urgent') {
        await supabase
          .from('equipment')
          .update({ status: 'maintenance' })
          .eq('id', equipmentId);
      }

      return taskId;
    } catch (error) {
      console.error('Error requesting equipment maintenance:', error);
      return null;
    }
  }

  // Doctor management operations
  static async getAllStaffDoctors(): Promise<StaffDoctor[]> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id (
            id,
            name,
            email,
            phone,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  }

  static async addDoctor(doctorData: {
    name: string;
    email: string;
    phone?: string;
    specialty: string;
    license_number?: string;
    years_of_experience?: number;
    consultation_fee?: number;
    room_number?: string;
    availability_status?: 'available' | 'busy' | 'break';
    bio?: string;
    qualifications?: string;
  }): Promise<boolean> {
    try {
      // First create user
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: doctorData.email,
        password: 'tempPassword123!', // Temporary password - should be changed
      });

      if (userError) throw userError;

      // Insert user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: userData.user?.id,
          name: doctorData.name,
          email: doctorData.email,
          phone: doctorData.phone,
          role: 'doctor'
        }]);

      if (profileError) throw profileError;

      // Insert doctor profile
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert([{
          user_id: userData.user?.id,
          specialty: doctorData.specialty,
          license_number: doctorData.license_number,
          consultation_fee: doctorData.consultation_fee,
          years_experience: doctorData.years_of_experience,
          education: doctorData.qualifications,
          certifications: doctorData.bio,
        }]);

      if (doctorError) throw doctorError;
      return true;
    } catch (error) {
      console.error('Error adding doctor:', error);
      return false;
    }
  }

  static async updateDoctor(doctorId: string, updates: {
    specialty?: string;
    license_number?: string;
    years_of_experience?: number;
    consultation_fee?: number;
    room_number?: string;
    availability_status?: 'available' | 'busy' | 'break';
    bio?: string;
    qualifications?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          specialty: updates.specialty,
          license_number: updates.license_number,
          consultation_fee: updates.consultation_fee,
          years_experience: updates.years_of_experience,
          education: updates.qualifications,
          certifications: updates.bio,
        })
        .eq('id', doctorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating doctor:', error);
      return false;
    }
  }

  static async createScheduleSuggestion(
    doctorId: string, 
    suggestion: {
      available_date: string;
      start_time: string;
      end_time: string;
      reason: string;
    }
  ): Promise<boolean> {
    try {
      // Send notification to doctor about schedule suggestion
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: doctorId,
          title: 'Schedule Update Suggestion',
          message: `Schedule suggestion: ${suggestion.reason}. Suggested time: ${suggestion.available_date} ${suggestion.start_time}-${suggestion.end_time}`,
          type: 'schedule',
          priority: 'medium'
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending schedule suggestion:', error);
      return false;
    }
  }

  // Staff system support functions
  static async getSystemStats(): Promise<any> {
    try {
      const [
        usersOnline,
        activeAppointments,
        pendingPayments,
        urgentTasks
      ] = await Promise.all([
        supabase.from('user_online_status').select('*').eq('is_online', true),
        supabase.from('appointments').select('*').in('status', ['pending', 'confirmed']),
        supabase.from('payments').select('*').eq('status', 'pending'),
        supabase.from('tasks').select('*').eq('priority', 'urgent').eq('status', 'pending')
      ]);

      return {
        usersOnline: usersOnline.data?.length || 0,
        activeAppointments: activeAppointments.data?.length || 0,
        pendingPayments: pendingPayments.data?.length || 0,
        urgentTasks: urgentTasks.data?.length || 0
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        usersOnline: 0,
        activeAppointments: 0,
        pendingPayments: 0,
        urgentTasks: 0
      };
    }
  }

  // Real-time subscriptions for live updates
  static subscribeToAppointments(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToDoctors(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('doctors-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'doctors' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToPatients(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('patients-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'patients' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToStaff(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('staff-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'staff' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToTasks(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToEquipment(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('equipment-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'equipment' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToNotifications(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToPayments(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('payments-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToMedicalRecords(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('medical-records-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'medical_records' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  static subscribeToMessages(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('messages-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, 
        callback
      )
      .subscribe();
    
    return subscription;
  }

  // Unsubscribe helper
  static unsubscribe(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }

  // ==================== CROSS-ROLE CONNECTION METHODS ====================

  /**
   * Get all accessible patients for staff
   */
  static async getAccessiblePatients(staffId?: string) {
    return await CrossRoleConnectionService.getAccessiblePatients(staffId);
  }

  /**
   * Get patient full record for staff access
   */
  static async getPatientFullRecord(patientId: string) {
    return await CrossRoleConnectionService.getPatientFullRecord(patientId);
  }

  /**
   * Get all accessible doctors for staff
   */
  static async getAccessibleDoctors(staffId?: string) {
    return await CrossRoleConnectionService.getAccessibleDoctors(staffId);
  }

  /**
   * Get doctor full record for staff access
   */
  static async getDoctorFullRecord(doctorId: string) {
    return await CrossRoleConnectionService.getDoctorFullRecord(doctorId);
  }

  /**
   * Send message between roles
   */
  static async sendCrossRoleMessage(
    senderId: string,
    receiverId: string, 
    messageText: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    appointmentId?: string
  ) {
    return await CrossRoleConnectionService.sendCrossRoleMessage(
      senderId, receiverId, messageText, messageType, appointmentId
    );
  }

  /**
   * Get messages between staff and patients/doctors
   */
  static async getCrossRoleMessages(userId: string, contactId?: string) {
    return await CrossRoleConnectionService.getCrossRoleMessages(userId, contactId);
  }

  /**
   * Create appointment for patient (staff authority)
   */
  static async createAppointmentForPatient(
    patientId: string,
    doctorId: string,
    appointmentData: any,
    staffId: string
  ) {
    return await CrossRoleConnectionService.createAppointmentForPatient(
      patientId, doctorId, appointmentData, staffId
    );
  }

  /**
   * Process payment with staff oversight
   */
  static async processPaymentWithStaff(
    paymentId: string,
    paymentMethod: string,
    transactionRef: string,
    staffId: string
  ) {
    return await CrossRoleConnectionService.processPayment(
      paymentId, paymentMethod, transactionRef, staffId
    );
  }

  /**
   * Create medical record with staff oversight
   */
  static async createMedicalRecordWithStaff(
    patientId: string,
    doctorId: string,
    recordData: any,
    staffId: string
  ) {
    return await CrossRoleConnectionService.createMedicalRecord(
      patientId, doctorId, recordData, staffId
    );
  }

  /**
   * Universal search for staff
   */
  static async universalSearch(searchTerm: string, searchType?: 'all' | 'patients' | 'doctors' | 'appointments') {
    return await CrossRoleConnectionService.universalSearch(searchTerm, searchType);
  }

  /**
   * Subscribe to real-time staff updates
   */
  static subscribeToStaffUpdates(callback: (payload: any) => void) {
    return CrossRoleConnectionService.subscribeToStaffUpdates(callback);
  }
}

export default StaffManagementService;