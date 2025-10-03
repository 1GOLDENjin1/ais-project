// rls-types.ts
// TypeScript interfaces for RLS-secured database schema
// These types align with the role-based access control implementation

export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin';

// ===============================================
// CORE USER TYPES
// ===============================================

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating?: number;
}

export interface Staff {
  id: string;
  user_id: string;
  position: string;
}

// ===============================================
// HEALTHCARE DATA TYPES
// ===============================================

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_type: string;
  reason?: string;
  appointment_date: string;
  appointment_time: string;
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

export interface LabTest {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  test_type: string;
  result?: string;
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

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  provider?: string;
  transaction_ref?: string;
  created_at: string;
}

export interface HealthMetric {
  id: string;
  patient_id: string;
  metric_type: string;
  value: string;
  recorded_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority?: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
}

// ===============================================
// SERVICES AND PACKAGES
// ===============================================

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

// ===============================================
// VIEW-BASED TYPES (for frontend convenience)
// ===============================================

export interface PatientAppointmentView {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  reason?: string;
  status: string;
  created_at: string;
  doctor_id: string;
  doctor_specialty: string;
  consultation_fee: number;
  doctor_rating?: number;
  doctor_name: string;
  doctor_phone?: string;
  patient_id: string;
}

export interface DoctorAppointmentView {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  reason?: string;
  status: string;
  created_at: string;
  patient_id: string;
  date_of_birth?: string;
  gender?: string;
  patient_name: string;
  patient_phone?: string;
  patient_email: string;
  doctor_id: string;
}

export interface StaffAppointmentView {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  reason?: string;
  status: string;
  created_at: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_email: string;
  date_of_birth?: string;
  gender?: string;
  doctor_id: string;
  doctor_name: string;
  doctor_phone?: string;
  doctor_email: string;
  doctor_specialty: string;
  consultation_fee: number;
}

export interface AvailableDoctorView {
  doctor_id: string;
  user_id: string;
  specialty: string;
  consultation_fee: number;
  rating?: number;
  doctor_name: string;
  doctor_phone?: string;
}

export interface AvailableServiceView {
  service_id: string;
  service_name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  doctor_specialty?: string;
  home_service_available: boolean;
  status?: string;
  is_available?: boolean;
}

export interface ActivePackageView {
  package_id: string;
  package_name: string;
  description: string;
  original_price: number;
  package_price: number;
  savings: number;
  duration: string;
  popular: boolean;
  included_services?: string;
}

// ===============================================
// DASHBOARD SUMMARY TYPES
// ===============================================

export interface PatientDashboardSummary {
  patient_id: string;
  upcoming_appointments: number;
  recent_lab_tests: number;
  active_prescriptions: number;
  unread_notifications: number;
  next_appointment_date?: string;
}

export interface DoctorDashboardSummary {
  doctor_id: string;
  today_appointments: number;
  week_appointments: number;
  pending_tasks: number;
  total_patients: number;
  pending_lab_results: number;
}

export interface StaffDashboardSummary {
  today_appointments: number;
  pending_appointments: number;
  total_patients: number;
  total_doctors: number;
  pending_tasks: number;
  equipment_needing_maintenance: number;
}

// ===============================================
// API RESPONSE TYPES
// ===============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ===============================================
// FORM INPUT TYPES
// ===============================================

export interface CreateAppointmentInput {
  doctor_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  reason?: string;
}

export interface CreateMedicalRecordInput {
  patient_id: string;
  appointment_id?: string;
  diagnosis?: string;
  notes?: string;
}

export interface CreateLabTestInput {
  patient_id: string;
  appointment_id?: string;
  test_type: string;
}

export interface CreatePrescriptionInput {
  medical_record_id: string;
  medication_name: string;
  dosage?: string;
  instructions?: string;
}

export interface CreateHealthMetricInput {
  metric_type: string;
  value: string;
}

// ===============================================
// FILTER AND SEARCH TYPES
// ===============================================

export interface AppointmentFilters {
  status?: string[];
  date_from?: string;
  date_to?: string;
  doctor_id?: string;
  patient_id?: string;
}

export interface DoctorFilters {
  specialty?: string;
  rating_min?: number;
  fee_max?: number;
}

export interface ServiceFilters {
  category?: string;
  price_max?: number;
  home_service?: boolean;
}

// ===============================================
// ROLE-BASED PERMISSION HELPERS
// ===============================================

export interface RolePermissions {
  canViewAllPatients: boolean;
  canViewAllDoctors: boolean;
  canViewAllAppointments: boolean;
  canModifyAnyRecord: boolean;
  canAccessEquipment: boolean;
  canManageTasks: boolean;
  canViewReports: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'patient':
      return {
        canViewAllPatients: false,
        canViewAllDoctors: false,
        canViewAllAppointments: false,
        canModifyAnyRecord: false,
        canAccessEquipment: false,
        canManageTasks: false,
        canViewReports: false,
      };
    case 'doctor':
      return {
        canViewAllPatients: false, // Only assigned patients
        canViewAllDoctors: false,
        canViewAllAppointments: false, // Only their appointments
        canModifyAnyRecord: false, // Only records they created
        canAccessEquipment: false,
        canManageTasks: true, // Tasks assigned to them
        canViewReports: false,
      };
    case 'staff':
    case 'admin':
      return {
        canViewAllPatients: true,
        canViewAllDoctors: true,
        canViewAllAppointments: true,
        canModifyAnyRecord: true,
        canAccessEquipment: true,
        canManageTasks: true,
        canViewReports: true,
      };
    default:
      return {
        canViewAllPatients: false,
        canViewAllDoctors: false,
        canViewAllAppointments: false,
        canModifyAnyRecord: false,
        canAccessEquipment: false,
        canManageTasks: false,
        canViewReports: false,
      };
  }
}

// ===============================================
// DATA ACCESS HELPERS
// ===============================================

export const VIEW_NAMES = {
  // Patient views
  PATIENT_APPOINTMENTS: 'patient_appointments_view',
  PATIENT_MEDICAL_RECORDS: 'patient_medical_records_view',
  PATIENT_LAB_TESTS: 'patient_lab_tests_view',
  PATIENT_PRESCRIPTIONS: 'patient_prescriptions_view',
  PATIENT_PAYMENTS: 'patient_payments_view',
  
  // Doctor views
  DOCTOR_APPOINTMENTS: 'doctor_appointments_view',
  DOCTOR_PATIENTS: 'doctor_patients_view',
  DOCTOR_MEDICAL_RECORDS: 'doctor_medical_records_view',
  DOCTOR_LAB_TESTS: 'doctor_lab_tests_view',
  
  // Staff views
  STAFF_APPOINTMENTS: 'staff_appointments_view',
  STAFF_PATIENTS: 'staff_patients_view',
  STAFF_DOCTORS: 'staff_doctors_view',
  
  // Public views
  AVAILABLE_DOCTORS: 'available_doctors_view',
  AVAILABLE_SERVICES: 'available_services_view',
  ACTIVE_PACKAGES: 'active_packages_view',
  
  // Dashboard summaries
  PATIENT_DASHBOARD: 'patient_dashboard_summary',
  DOCTOR_DASHBOARD: 'doctor_dashboard_summary',
  STAFF_DASHBOARD: 'staff_dashboard_summary',
} as const;

export const RPC_FUNCTIONS = {
  GET_PUBLIC_DOCTORS: 'get_public_doctors',
  GET_AVAILABLE_SERVICES: 'get_available_services',
  GET_ACTIVE_PACKAGES: 'get_active_packages',
} as const;