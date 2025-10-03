// In-memory database implementation for healthcare system
// This is a simplified database that stores data in memory using localStorage for persistence

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  name: string;
  avatar?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  yearsExperience?: number;
  education?: string;
  certifications?: string;
  consultationFee?: number;
  isAvailable: boolean;
  rating: number;
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: string;
  userId: string;
  department: string;
  position: string;
  employeeId: string;
  hireDate?: string;
  shiftSchedule?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'follow-up' | 'check-up' | 'emergency';
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  consultationType: 'in-person' | 'video-call' | 'phone';
  reason?: string;
  notes?: string;
  durationMinutes: number;
  fee?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  recordType: 'consultation' | 'lab-results' | 'imaging' | 'prescription' | 'diagnosis' | 'treatment-plan';
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  followUpInstructions?: string;
  recordDate: string;
  isConfidential: boolean;
  status: 'draft' | 'final' | 'reviewed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface LabTest {
  id: string;
  patientId: string;
  doctorId: string;
  staffId?: string;
  testName: string;
  testType: 'blood-work' | 'urine' | 'x-ray' | 'mri' | 'ct-scan' | 'ecg' | 'ultrasound' | 'other';
  testDate: string;
  status: 'ordered' | 'in-progress' | 'completed' | 'reviewed' | 'cancelled';
  results?: string;
  normalRanges?: string;
  abnormalFindings?: string;
  priority: 'routine' | 'urgent' | 'stat';
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthMetric {
  id: string;
  patientId: string;
  metricType: 'blood-pressure' | 'heart-rate' | 'weight' | 'height' | 'bmi' | 'temperature' | 'blood-sugar' | 'cholesterol';
  value: string;
  unit?: string;
  recordedDate: string;
  recordedBy: 'patient' | 'staff' | 'doctor' | 'device';
  notes?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  assignedTo: string;
  createdBy: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedAt?: Date;
  taskType: 'maintenance' | 'patient-care' | 'administrative' | 'equipment' | 'other';
  relatedPatientId?: string;
  relatedEquipmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  patient_id: string;
  appointment_id?: string;
  amount: number;
  payment_type: 'consultation' | 'procedure' | 'package' | 'medication' | 'lab_test';
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'online' | 'insurance';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  description?: string;
  transaction_id?: string;
  paymongo_link_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'test-result' | 'prescription' | 'general' | 'emergency';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  relatedAppointmentId?: string;
  relatedTestId?: string;
  createdAt: Date;
}

// In-memory database class
class InMemoryDatabase {
  private users: User[] = [];
  private patients: Patient[] = [];
  private doctors: Doctor[] = [];
  private staff: Staff[] = [];
  private appointments: Appointment[] = [];
  private medicalRecords: MedicalRecord[] = [];
  private labTests: LabTest[] = [];
  private healthMetrics: HealthMetric[] = [];
  private tasks: Task[] = [];
  private notifications: Notification[] = [];
  private payments: Payment[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem('healthcare_db');
        if (data) {
          const parsed = JSON.parse(data);
          this.users = parsed.users || [];
          this.patients = parsed.patients || [];
          this.doctors = parsed.doctors || [];
          this.staff = parsed.staff || [];
          this.appointments = parsed.appointments || [];
          this.medicalRecords = parsed.medicalRecords || [];
          this.labTests = parsed.labTests || [];
          this.healthMetrics = parsed.healthMetrics || [];
          this.tasks = parsed.tasks || [];
          this.notifications = parsed.notifications || [];
          this.payments = parsed.payments || [];
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          users: this.users,
          patients: this.patients,
          doctors: this.doctors,
          staff: this.staff,
          appointments: this.appointments,
          medicalRecords: this.medicalRecords,
          labTests: this.labTests,
          healthMetrics: this.healthMetrics,
          tasks: this.tasks,
          notifications: this.notifications,
          payments: this.payments,
        };
        localStorage.setItem('healthcare_db', JSON.stringify(data));
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
    }
  }

  // User operations
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    this.saveToStorage();
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  updateUser(id: string, userData: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex >= 0) {
      this.users[userIndex] = { ...this.users[userIndex], ...userData, updatedAt: new Date() };
      this.saveToStorage();
      return this.users[userIndex];
    }
    return undefined;
  }

  deleteUser(id: string): void {
    this.users = this.users.filter(u => u.id !== id);
    this.saveToStorage();
  }

  getUsersByRole(role: User['role']): User[] {
    return this.users.filter(u => u.role === role);
  }

  // Patient operations
  createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Patient {
    const patient: Patient = {
      ...patientData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.patients.push(patient);
    this.saveToStorage();
    return patient;
  }

  getPatientById(id: string): Patient | undefined {
    return this.patients.find(p => p.id === id);
  }

  getPatientByUserId(userId: string): Patient | undefined {
    return this.patients.find(p => p.userId === userId);
  }

  updatePatient(id: string, patientData: Partial<Patient>): Patient | undefined {
    const patientIndex = this.patients.findIndex(p => p.id === id);
    if (patientIndex >= 0) {
      this.patients[patientIndex] = { ...this.patients[patientIndex], ...patientData, updatedAt: new Date() };
      this.saveToStorage();
      return this.patients[patientIndex];
    }
    return undefined;
  }

  getAllPatients(): Patient[] {
    return this.patients;
  }

  // Doctor operations
  createDoctor(doctorData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Doctor {
    const doctor: Doctor = {
      ...doctorData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.doctors.push(doctor);
    this.saveToStorage();
    return doctor;
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.doctors.find(d => d.id === id);
  }

  getDoctorByUserId(userId: string): Doctor | undefined {
    return this.doctors.find(d => d.userId === userId);
  }

  getAllDoctorsWithUsers(): (Doctor & { name: string; email: string })[] {
    return this.doctors
      .map(doctor => {
        const user = this.users.find(u => u.id === doctor.userId);
        if (!user) return null;
        return {
          ...doctor,
          name: user.name,
          email: user.email
        };
      })
      .filter((doctor): doctor is Doctor & { name: string; email: string } => doctor !== null);
  }

  getDoctorWithUser(doctorId: string): (Doctor & { name: string; email: string }) | null {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) return null;
    
    const user = this.users.find(u => u.id === doctor.userId);
    if (!user) return null;
    
    return {
      ...doctor,
      name: user.name,
      email: user.email
    };
  }

  getAvailableDoctors(): Doctor[] {
    return this.doctors.filter(d => d.isAvailable);
  }

  getDoctorsBySpecialty(specialty: string): Doctor[] {
    return this.doctors.filter(d => d.specialty === specialty);
  }

  updateDoctor(id: string, doctorData: Partial<Doctor>): Doctor | undefined {
    const doctorIndex = this.doctors.findIndex(d => d.id === id);
    if (doctorIndex >= 0) {
      this.doctors[doctorIndex] = { ...this.doctors[doctorIndex], ...doctorData, updatedAt: new Date() };
      this.saveToStorage();
      return this.doctors[doctorIndex];
    }
    return undefined;
  }

  // Staff operations
  createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Staff {
    const staff: Staff = {
      ...staffData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.staff.push(staff);
    this.saveToStorage();
    return staff;
  }

  getStaffById(id: string): Staff | undefined {
    return this.staff.find(s => s.id === id);
  }

  getStaffByUserId(userId: string): Staff | undefined {
    return this.staff.find(s => s.userId === userId);
  }

  getStaffByDepartment(department: string): Staff[] {
    return this.staff.filter(s => s.department === department);
  }

  // Appointment operations
  createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment {
    const appointment: Appointment = {
      ...appointmentData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appointments.push(appointment);
    this.saveToStorage();
    return appointment;
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find(a => a.id === id);
  }

  getAppointmentsByPatientId(patientId: string): Appointment[] {
    return this.appointments.filter(a => a.patientId === patientId)
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }

  getAppointmentsByDoctorId(doctorId: string): Appointment[] {
    return this.appointments.filter(a => a.doctorId === doctorId)
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }

  getTodayAppointmentsByDoctorId(doctorId: string): Appointment[] {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments.filter(a => a.doctorId === doctorId && a.appointmentDate === today)
      .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): Appointment | undefined {
    const appointmentIndex = this.appointments.findIndex(a => a.id === id);
    if (appointmentIndex >= 0) {
      this.appointments[appointmentIndex] = { 
        ...this.appointments[appointmentIndex], 
        status, 
        updatedAt: new Date() 
      };
      this.saveToStorage();
      return this.appointments[appointmentIndex];
    }
    return undefined;
  }

  // Health Metrics operations
  createHealthMetric(metricData: Omit<HealthMetric, 'id' | 'createdAt'>): HealthMetric {
    const metric: HealthMetric = {
      ...metricData,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.healthMetrics.push(metric);
    this.saveToStorage();
    return metric;
  }

  getHealthMetricsByPatientId(patientId: string): HealthMetric[] {
    return this.healthMetrics.filter(m => m.patientId === patientId)
      .sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
  }

  getLatestHealthMetricByType(patientId: string, metricType: HealthMetric['metricType']): HealthMetric | undefined {
    return this.healthMetrics
      .filter(m => m.patientId === patientId && m.metricType === metricType)
      .sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime())[0];
  }

  // Task operations
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const task: Task = {
      ...taskData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(task);
    this.saveToStorage();
    return task;
  }

  getTasksByAssignedTo(userId: string): Task[] {
    return this.tasks.filter(t => t.assignedTo === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getPendingTasksByAssignedTo(userId: string): Task[] {
    return this.tasks.filter(t => t.assignedTo === userId && t.status === 'pending')
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  updateTaskStatus(id: string, status: Task['status']): Task | undefined {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex >= 0) {
      this.tasks[taskIndex] = { 
        ...this.tasks[taskIndex], 
        status, 
        completedAt: status === 'completed' ? new Date() : undefined,
        updatedAt: new Date() 
      };
      this.saveToStorage();
      return this.tasks[taskIndex];
    }
    return undefined;
  }

  // Notification operations
  createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const notification: Notification = {
      ...notificationData,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.notifications.push(notification);
    this.saveToStorage();
    return notification;
  }

  getNotificationsByUserId(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUnreadNotificationsByUserId(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId && !n.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markNotificationAsRead(id: string): Notification | undefined {
    const notificationIndex = this.notifications.findIndex(n => n.id === id);
    if (notificationIndex >= 0) {
      this.notifications[notificationIndex] = { 
        ...this.notifications[notificationIndex], 
        isRead: true 
      };
      this.saveToStorage();
      return this.notifications[notificationIndex];
    }
    return undefined;
  }

  // Payment operations
  createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Payment {
    const payment: Payment = {
      ...paymentData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.push(payment);
    this.saveToStorage();
    return payment;
  }

  getPaymentById(id: string): Payment | undefined {
    return this.payments.find(p => p.id === id);
  }

  getPaymentsByPatientId(patientId: string): Payment[] {
    return this.payments.filter(p => p.patient_id === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getPaymentsByAppointmentId(appointmentId: string): Payment[] {
    return this.payments.filter(p => p.appointment_id === appointmentId);
  }

  updatePayment(id: string, paymentData: Partial<Payment>): Payment | undefined {
    const paymentIndex = this.payments.findIndex(p => p.id === id);
    if (paymentIndex >= 0) {
      this.payments[paymentIndex] = { 
        ...this.payments[paymentIndex], 
        ...paymentData, 
        updatedAt: new Date() 
      };
      this.saveToStorage();
      return this.payments[paymentIndex];
    }
    return undefined;
  }

  updatePaymentStatus(id: string, status: Payment['status'], transactionId?: string): Payment | undefined {
    const paymentIndex = this.payments.findIndex(p => p.id === id);
    if (paymentIndex >= 0) {
      this.payments[paymentIndex] = { 
        ...this.payments[paymentIndex], 
        status,
        transaction_id: transactionId || this.payments[paymentIndex].transaction_id,
        updatedAt: new Date() 
      };
      this.saveToStorage();
      return this.payments[paymentIndex];
    }
    return undefined;
  }

  // Utility method to generate unique IDs
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Clear all data (for testing)
  clearAll(): void {
    this.users = [];
    this.patients = [];
    this.doctors = [];
    this.staff = [];
    this.appointments = [];
    this.medicalRecords = [];
    this.labTests = [];
    this.healthMetrics = [];
    this.tasks = [];
    this.notifications = [];
    this.payments = [];
    this.saveToStorage();
  }
}

// Export singleton instance
export const db = new InMemoryDatabase();