import { db } from './connection';
import { users, patients, doctors, staff, appointments, medicalRecords, labTests, prescriptions, healthMetrics, equipment, tasks, notifications, payments, doctorSchedules } from './schema';
import type { 
  User, NewUser, Patient, NewPatient, Doctor, NewDoctor, Staff, NewStaff,
  Appointment, NewAppointment, MedicalRecord, NewMedicalRecord,
  LabTest, NewLabTest, Prescription, NewPrescription,
  HealthMetric, NewHealthMetric, Equipment, NewEquipment,
  Task, NewTask, Notification, NewNotification,
  Payment, NewPayment, DoctorSchedule, NewDoctorSchedule
} from './schema';
import { eq, and, desc, asc } from 'drizzle-orm';

// User operations
export const userService = {
  // Create new user
  async create(userData: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  // Get user by ID
  async getById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  // Get user by email
  async getByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  // Update user
  async update(id: string, userData: Partial<NewUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  },

  // Delete user
  async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  },

  // Get all users by role
  async getByRole(role: 'patient' | 'doctor' | 'staff' | 'admin'): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
};

// Patient operations
export const patientService = {
  // Create new patient
  async create(patientData: NewPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(patientData).returning();
    return patient;
  },

  // Get patient by ID
  async getById(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  },

  // Get patient by user ID
  async getByUserId(userId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient;
  },

  // Update patient
  async update(id: string, patientData: Partial<NewPatient>): Promise<Patient | undefined> {
    const [patient] = await db.update(patients).set(patientData).where(eq(patients.id, id)).returning();
    return patient;
  },

  // Get all patients
  async getAll(): Promise<Patient[]> {
    return await db.select().from(patients);
  }
};

// Doctor operations
export const doctorService = {
  // Create new doctor
  async create(doctorData: NewDoctor): Promise<Doctor> {
    const [doctor] = await db.insert(doctors).values(doctorData).returning();
    return doctor;
  },

  // Get doctor by ID
  async getById(id: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  },

  // Get doctor by user ID
  async getByUserId(userId: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
    return doctor;
  },

  // Get available doctors
  async getAvailable(): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.isAvailable, true));
  },

  // Get doctors by specialty
  async getBySpecialty(specialty: string): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.specialty, specialty));
  },

  // Update doctor
  async update(id: string, doctorData: Partial<NewDoctor>): Promise<Doctor | undefined> {
    const [doctor] = await db.update(doctors).set(doctorData).where(eq(doctors.id, id)).returning();
    return doctor;
  }
};

// Staff operations
export const staffService = {
  // Create new staff
  async create(staffData: NewStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffData).returning();
    return newStaff;
  },

  // Get staff by ID
  async getById(id: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember;
  },

  // Get staff by user ID
  async getByUserId(userId: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.userId, userId));
    return staffMember;
  },

  // Get staff by department
  async getByDepartment(department: string): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.department, department));
  }
};

// Appointment operations
export const appointmentService = {
  // Create new appointment
  async create(appointmentData: NewAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(appointmentData).returning();
    return appointment;
  },

  // Get appointment by ID
  async getById(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  },

  // Get appointments by patient ID
  async getByPatientId(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));
  },

  // Get appointments by doctor ID
  async getByDoctorId(doctorId: string): Promise<Appointment[]> {
    return await db.select().from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.appointmentDate));
  },

  // Get today's appointments for a doctor
  async getTodayByDoctorId(doctorId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(appointments)
      .where(and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.appointmentDate, today)
      ))
      .orderBy(asc(appointments.appointmentTime));
  },

  // Update appointment status
  async updateStatus(id: string, status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'): Promise<Appointment | undefined> {
    const [appointment] = await db.update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }
};

// Medical Records operations
export const medicalRecordService = {
  // Create new medical record
  async create(recordData: NewMedicalRecord): Promise<MedicalRecord> {
    const [record] = await db.insert(medicalRecords).values(recordData).returning();
    return record;
  },

  // Get records by patient ID
  async getByPatientId(patientId: string): Promise<MedicalRecord[]> {
    return await db.select().from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.recordDate));
  },

  // Get records by doctor ID
  async getByDoctorId(doctorId: string): Promise<MedicalRecord[]> {
    return await db.select().from(medicalRecords)
      .where(eq(medicalRecords.doctorId, doctorId))
      .orderBy(desc(medicalRecords.recordDate));
  }
};

// Lab Test operations
export const labTestService = {
  // Create new lab test
  async create(testData: NewLabTest): Promise<LabTest> {
    const [test] = await db.insert(labTests).values(testData).returning();
    return test;
  },

  // Get tests by patient ID
  async getByPatientId(patientId: string): Promise<LabTest[]> {
    return await db.select().from(labTests)
      .where(eq(labTests.patientId, patientId))
      .orderBy(desc(labTests.testDate));
  },

  // Get pending tests
  async getPending(): Promise<LabTest[]> {
    return await db.select().from(labTests)
      .where(eq(labTests.status, 'ordered'))
      .orderBy(asc(labTests.testDate));
  },

  // Update test status
  async updateStatus(id: string, status: 'ordered' | 'in-progress' | 'completed' | 'reviewed' | 'cancelled'): Promise<LabTest | undefined> {
    const [test] = await db.update(labTests)
      .set({ status })
      .where(eq(labTests.id, id))
      .returning();
    return test;
  }
};

// Health Metrics operations
export const healthMetricService = {
  // Create new health metric
  async create(metricData: NewHealthMetric): Promise<HealthMetric> {
    const [metric] = await db.insert(healthMetrics).values(metricData).returning();
    return metric;
  },

  // Get metrics by patient ID
  async getByPatientId(patientId: string): Promise<HealthMetric[]> {
    return await db.select().from(healthMetrics)
      .where(eq(healthMetrics.patientId, patientId))
      .orderBy(desc(healthMetrics.recordedDate));
  },

  // Get latest metrics by patient ID and type
  async getLatestByType(patientId: string, metricType: string): Promise<HealthMetric | undefined> {
    const [metric] = await db.select().from(healthMetrics)
      .where(and(
        eq(healthMetrics.patientId, patientId),
        eq(healthMetrics.metricType, metricType)
      ))
      .orderBy(desc(healthMetrics.recordedDate))
      .limit(1);
    return metric;
  }
};

// Task operations
export const taskService = {
  // Create new task
  async create(taskData: NewTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  },

  // Get tasks by assigned user ID
  async getByAssignedTo(userId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  },

  // Get pending tasks by user ID
  async getPendingByAssignedTo(userId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(and(
        eq(tasks.assignedTo, userId),
        eq(tasks.status, 'pending')
      ))
      .orderBy(desc(tasks.dueDate));
  },

  // Update task status
  async updateStatus(id: string, status: 'pending' | 'in-progress' | 'completed' | 'cancelled'): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ status, completedAt: status === 'completed' ? new Date().getTime() / 1000 : undefined })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }
};

// Notification operations
export const notificationService = {
  // Create new notification
  async create(notificationData: NewNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  },

  // Get notifications by user ID
  async getByUserId(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  },

  // Get unread notifications by user ID
  async getUnreadByUserId(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }
};