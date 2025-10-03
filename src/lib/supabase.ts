import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://okwsgaseenyhlupnqewo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rd3NnYXNlZW55aGx1cG5xZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE3MzMsImV4cCI6MjA3NDUzNzczM30.CTyA-FkrFPEyYZ_0qg4BNWTznIfNrPJBXDWfs_zgSx4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Database types for TypeScript - matching actual schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          phone: string | null
          role: 'patient' | 'doctor' | 'staff' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          phone?: string | null
          role: 'patient' | 'doctor' | 'staff' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          phone?: string | null
          role?: 'patient' | 'doctor' | 'staff' | 'admin'
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          blood_type: string | null
          allergies: string | null
          medical_history: string | null
          insurance_provider: string | null
          insurance_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          blood_type?: string | null
          allergies?: string | null
          medical_history?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          blood_type?: string | null
          allergies?: string | null
          medical_history?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string
          specialty: string
          consultation_fee: number
          rating: number | null
        }
        Insert: {
          id?: string
          user_id: string
          specialty: string
          consultation_fee: number
          rating?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          specialty?: string
          consultation_fee?: number
          rating?: number | null
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          service_type: string
          reason: string | null
          appointment_date: string
          appointment_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_reschedule_confirmation'
          created_at: string
          cancellation_reason: string | null
          reschedule_requested_by: string | null
          reschedule_reason: string | null
          original_date: string | null
          original_time: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          service_type: string
          reason?: string | null
          appointment_date: string
          appointment_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_reschedule_confirmation'
          created_at?: string
          cancellation_reason?: string | null
          reschedule_requested_by?: string | null
          reschedule_reason?: string | null
          original_date?: string | null
          original_time?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          service_type?: string
          reason?: string | null
          appointment_date?: string
          appointment_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_reschedule_confirmation'
          created_at?: string
          cancellation_reason?: string | null
          reschedule_requested_by?: string | null
          reschedule_reason?: string | null
          original_date?: string | null
          original_time?: string | null
        }
      }
      health_metrics: {
        Row: {
          id: string
          patient_id: string
          metric_type: 'blood-pressure' | 'heart-rate' | 'weight' | 'height' | 'bmi' | 'temperature' | 'blood-sugar' | 'cholesterol'
          value: string
          unit: string | null
          recorded_date: string
          recorded_by: 'patient' | 'staff' | 'doctor' | 'device'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          metric_type: 'blood-pressure' | 'heart-rate' | 'weight' | 'height' | 'bmi' | 'temperature' | 'blood-sugar' | 'cholesterol'
          value: string
          unit?: string | null
          recorded_date: string
          recorded_by?: 'patient' | 'staff' | 'doctor' | 'device'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          metric_type?: 'blood-pressure' | 'heart-rate' | 'weight' | 'height' | 'bmi' | 'temperature' | 'blood-sugar' | 'cholesterol'
          value?: string
          unit?: string | null
          recorded_date?: string
          recorded_by?: 'patient' | 'staff' | 'doctor' | 'device'
          notes?: string | null
          created_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_id: string | null
          record_type: 'consultation' | 'lab-results' | 'imaging' | 'prescription' | 'diagnosis' | 'treatment-plan'
          title: string
          description: string | null
          diagnosis: string | null
          treatment: string | null
          medications: string | null
          follow_up_instructions: string | null
          record_date: string
          is_confidential: boolean
          status: 'draft' | 'final' | 'reviewed' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_id?: string | null
          record_type: 'consultation' | 'lab-results' | 'imaging' | 'prescription' | 'diagnosis' | 'treatment-plan'
          title: string
          description?: string | null
          diagnosis?: string | null
          treatment?: string | null
          medications?: string | null
          follow_up_instructions?: string | null
          record_date: string
          is_confidential?: boolean
          status?: 'draft' | 'final' | 'reviewed' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_id?: string | null
          record_type?: 'consultation' | 'lab-results' | 'imaging' | 'prescription' | 'diagnosis' | 'treatment-plan'
          title?: string
          description?: string | null
          diagnosis?: string | null
          treatment?: string | null
          medications?: string | null
          follow_up_instructions?: string | null
          record_date?: string
          is_confidential?: boolean
          status?: 'draft' | 'final' | 'reviewed' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      lab_tests: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          staff_id: string | null
          test_name: string
          test_type: 'blood-work' | 'urine' | 'x-ray' | 'mri' | 'ct-scan' | 'ecg' | 'ultrasound' | 'other'
          test_date: string
          status: 'ordered' | 'in-progress' | 'completed' | 'reviewed' | 'cancelled'
          results: string | null
          normal_ranges: string | null
          abnormal_findings: string | null
          priority: 'routine' | 'urgent' | 'stat'
          cost: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          staff_id?: string | null
          test_name: string
          test_type: 'blood-work' | 'urine' | 'x-ray' | 'mri' | 'ct-scan' | 'ecg' | 'ultrasound' | 'other'
          test_date: string
          status?: 'ordered' | 'in-progress' | 'completed' | 'reviewed' | 'cancelled'
          results?: string | null
          normal_ranges?: string | null
          abnormal_findings?: string | null
          priority?: 'routine' | 'urgent' | 'stat'
          cost?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          staff_id?: string | null
          test_name?: string
          test_type?: 'blood-work' | 'urine' | 'x-ray' | 'mri' | 'ct-scan' | 'ecg' | 'ultrasound' | 'other'
          test_date?: string
          status?: 'ordered' | 'in-progress' | 'completed' | 'reviewed' | 'cancelled'
          results?: string | null
          normal_ranges?: string | null
          abnormal_findings?: string | null
          priority?: 'routine' | 'urgent' | 'stat'
          cost?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'appointment' | 'test-result' | 'prescription' | 'general' | 'emergency'
          priority: 'low' | 'medium' | 'high'
          is_read: boolean
          related_appointment_id: string | null
          related_test_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'appointment' | 'test-result' | 'prescription' | 'general' | 'emergency'
          priority?: 'low' | 'medium' | 'high'
          is_read?: boolean
          related_appointment_id?: string | null
          related_test_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'appointment' | 'test-result' | 'prescription' | 'general' | 'emergency'
          priority?: 'low' | 'medium' | 'high'
          is_read?: boolean
          related_appointment_id?: string | null
          related_test_id?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          assigned_to: string
          created_by: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
          due_date: string | null
          completed_at: string | null
          task_type: 'maintenance' | 'patient-care' | 'administrative' | 'equipment' | 'other'
          related_patient_id: string | null
          related_equipment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assigned_to: string
          created_by: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
          due_date?: string | null
          completed_at?: string | null
          task_type: 'maintenance' | 'patient-care' | 'administrative' | 'equipment' | 'other'
          related_patient_id?: string | null
          related_equipment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assigned_to?: string
          created_by?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
          due_date?: string | null
          completed_at?: string | null
          task_type?: 'maintenance' | 'patient-care' | 'administrative' | 'equipment' | 'other'
          related_patient_id?: string | null
          related_equipment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}