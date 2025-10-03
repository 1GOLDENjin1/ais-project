import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['patient', 'doctor', 'staff', 'admin'] }).notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// Patients table
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender', { enum: ['male', 'female', 'other'] }),
  address: text('address'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  bloodType: text('blood_type'),
  allergies: text('allergies'),
  medicalHistory: text('medical_history'),
  insuranceProvider: text('insurance_provider'),
  insuranceNumber: text('insurance_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Doctors table
export const doctors = sqliteTable('doctors', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  specialty: text('specialty').notNull(),
  licenseNumber: text('license_number').unique().notNull(),
  yearsExperience: integer('years_experience'),
  education: text('education'),
  certifications: text('certifications'),
  consultationFee: real('consultation_fee'),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
  rating: real('rating').default(0.0),
  totalRatings: integer('total_ratings').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Staff table
export const staff = sqliteTable('staff', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  department: text('department').notNull(),
  position: text('position').notNull(),
  employeeId: text('employee_id').unique().notNull(),
  hireDate: text('hire_date'),
  shiftSchedule: text('shift_schedule'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Appointments table
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  appointmentDate: text('appointment_date').notNull(),
  appointmentTime: text('appointment_time').notNull(),
  appointmentType: text('appointment_type', { 
    enum: ['consultation', 'follow-up', 'check-up', 'emergency'] 
  }).notNull(),
  status: text('status', { 
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'] 
  }).default('pending'),
  consultationType: text('consultation_type', { 
    enum: ['in-person', 'video-call', 'phone'] 
  }).default('in-person'),
  reason: text('reason'),
  notes: text('notes'),
  durationMinutes: integer('duration_minutes').default(30),
  fee: real('fee'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Medical Records table
export const medicalRecords = sqliteTable('medical_records', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  appointmentId: text('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  recordType: text('record_type', { 
    enum: ['consultation', 'lab-results', 'imaging', 'prescription', 'diagnosis', 'treatment-plan'] 
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  medications: text('medications'),
  followUpInstructions: text('follow_up_instructions'),
  recordDate: text('record_date').notNull(),
  isConfidential: integer('is_confidential', { mode: 'boolean' }).default(false),
  status: text('status', { enum: ['draft', 'final', 'reviewed', 'archived'] }).default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Lab Tests table
export const labTests = sqliteTable('lab_tests', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  staffId: text('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  testName: text('test_name').notNull(),
  testType: text('test_type', { 
    enum: ['blood-work', 'urine', 'x-ray', 'mri', 'ct-scan', 'ecg', 'ultrasound', 'other'] 
  }).notNull(),
  testDate: text('test_date').notNull(),
  status: text('status', { 
    enum: ['ordered', 'in-progress', 'completed', 'reviewed', 'cancelled'] 
  }).default('ordered'),
  results: text('results'),
  normalRanges: text('normal_ranges'),
  abnormalFindings: text('abnormal_findings'),
  priority: text('priority', { enum: ['routine', 'urgent', 'stat'] }).default('routine'),
  cost: real('cost'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Prescriptions table
export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  appointmentId: text('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  medicationName: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  duration: text('duration').notNull(),
  instructions: text('instructions'),
  quantity: integer('quantity'),
  refillsAllowed: integer('refills_allowed').default(0),
  refillsUsed: integer('refills_used').default(0),
  status: text('status', { enum: ['active', 'completed', 'cancelled', 'expired'] }).default('active'),
  prescribedDate: text('prescribed_date').notNull(),
  expiryDate: text('expiry_date'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Health Metrics table
export const healthMetrics = sqliteTable('health_metrics', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  metricType: text('metric_type', { 
    enum: ['blood-pressure', 'heart-rate', 'weight', 'height', 'bmi', 'temperature', 'blood-sugar', 'cholesterol'] 
  }).notNull(),
  value: text('value').notNull(),
  unit: text('unit'),
  recordedDate: text('recorded_date').notNull(),
  recordedBy: text('recorded_by', { enum: ['patient', 'staff', 'doctor', 'device'] }).default('patient'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Equipment table
export const equipment = sqliteTable('equipment', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  type: text('type', { 
    enum: ['imaging', 'laboratory', 'monitoring', 'surgical', 'diagnostic', 'other'] 
  }).notNull(),
  model: text('model'),
  serialNumber: text('serial_number'),
  location: text('location'),
  status: text('status', { 
    enum: ['available', 'in-use', 'maintenance', 'out-of-order'] 
  }).default('available'),
  lastMaintenance: text('last_maintenance'),
  nextMaintenance: text('next_maintenance'),
  purchaseDate: text('purchase_date'),
  warrantyExpiry: text('warranty_expiry'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  assignedTo: text('assigned_to').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  status: text('status', { enum: ['pending', 'in-progress', 'completed', 'cancelled'] }).default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  taskType: text('task_type', { 
    enum: ['maintenance', 'patient-care', 'administrative', 'equipment', 'other'] 
  }).notNull(),
  relatedPatientId: text('related_patient_id').references(() => patients.id, { onDelete: 'set null' }),
  relatedEquipmentId: text('related_equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['appointment', 'test-result', 'prescription', 'general', 'emergency'] }).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  relatedAppointmentId: text('related_appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  relatedTestId: text('related_test_id').references(() => labTests.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Payments table
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  appointmentId: text('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),
  paymentType: text('payment_type', { 
    enum: ['consultation', 'test', 'procedure', 'medication', 'other'] 
  }).notNull(),
  paymentMethod: text('payment_method', { 
    enum: ['cash', 'card', 'insurance', 'online', 'bank-transfer'] 
  }).notNull(),
  status: text('status', { enum: ['pending', 'completed', 'failed', 'refunded'] }).default('pending'),
  paymentDate: integer('payment_date', { mode: 'timestamp' }),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Doctor Schedule table
export const doctorSchedules = sqliteTable('doctor_schedules', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  dayOfWeek: text('day_of_week', { 
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] 
  }).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
  breakStart: text('break_start'),
  breakEnd: text('break_end'),
  maxPatientsPerDay: integer('max_patients_per_day').default(20),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Type definitions for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;

export type LabTest = typeof labTests.$inferSelect;
export type NewLabTest = typeof labTests.$inferInsert;

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;

export type HealthMetric = typeof healthMetrics.$inferSelect;
export type NewHealthMetric = typeof healthMetrics.$inferInsert;

export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type DoctorSchedule = typeof doctorSchedules.$inferSelect;
export type NewDoctorSchedule = typeof doctorSchedules.$inferInsert;