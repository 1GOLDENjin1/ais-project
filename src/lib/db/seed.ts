import { db } from './index';
import type { User, Patient, Doctor, Staff } from './index';
import bcrypt from 'bcryptjs';

// Sample data for seeding
const sampleUsers = [
  {
    email: 'doctor@test.com',
    passwordHash: '',
    role: 'doctor' as const,
    name: 'Dr. Sarah Johnson',
    avatar: '/lovable-uploads/95acf376-10b9-4fad-927e-89c2971dd7be.png',
    phone: '+1234567890',
    isActive: true,
  },
  {
    email: 'staff@test.com', 
    passwordHash: '',
    role: 'staff' as const,
    name: 'Mike Chen',
    phone: '+1234567891',
    isActive: true,
  },
  {
    email: 'admin@test.com',
    passwordHash: '',
    role: 'admin' as const,
    name: 'Admin User',
    phone: '+1234567892',
    isActive: true,
  },
  {
    email: 'patient@test.com',
    passwordHash: '',
    role: 'patient' as const,
    name: 'John Doe',
    phone: '+1234567893',
    isActive: true,
  }
];

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Hash passwords for all sample users
    for (const userData of sampleUsers) {
      userData.passwordHash = await bcrypt.hash('password123', 10);
    }

    // Create users
    const createdUsers: User[] = [];
    for (const userData of sampleUsers) {
      const existingUser = db.getUserByEmail(userData.email);
      if (!existingUser) {
        const user = db.createUser(userData);
        createdUsers.push(user);
        console.log(`Created user: ${user.name} (${user.email})`);
      } else {
        createdUsers.push(existingUser);
        console.log(`User already exists: ${existingUser.name} (${existingUser.email})`);
      }
    }

    // Create doctor profiles
    const doctorUser = createdUsers.find(u => u.role === 'doctor');
    if (doctorUser) {
      const existingDoctor = db.getDoctorByUserId(doctorUser.id);
      if (!existingDoctor) {
        db.createDoctor({
          userId: doctorUser.id,
          specialty: 'Internal Medicine',
          licenseNumber: 'MD-12345',
          yearsExperience: 10,
          education: 'Harvard Medical School',
          consultationFee: 150.00,
          isAvailable: true,
          rating: 4.9,
          totalRatings: 156
        });
        console.log('Created doctor profile for Dr. Sarah Johnson');
      }
    }

    // Create staff profiles  
    const staffUser = createdUsers.find(u => u.role === 'staff');
    if (staffUser) {
      const existingStaff = db.getStaffByUserId(staffUser.id);
      if (!existingStaff) {
        db.createStaff({
          userId: staffUser.id,
          department: 'Medical Technology',
          position: 'Senior Technician',
          employeeId: 'EMP-001',
          hireDate: '2020-01-15',
          shiftSchedule: '08:00-17:00'
        });
        console.log('Created staff profile for Mike Chen');
      }
    }

    // Create patient profile
    const patientUser = createdUsers.find(u => u.role === 'patient');
    if (patientUser) {
      const existingPatient = db.getPatientByUserId(patientUser.id);
      if (!existingPatient) {
        const patient = db.createPatient({
          userId: patientUser.id,
          dateOfBirth: '1985-06-15',
          gender: 'male',
          address: '123 Main St, City, State 12345',
          emergencyContactName: 'Jane Doe',
          emergencyContactPhone: '+1234567899',
          bloodType: 'O+',
          allergies: 'None',
          medicalHistory: 'No significant medical history',
          insuranceProvider: 'Health Insurance Co.',
          insuranceNumber: 'INS-123456789'
        });
        console.log('Created patient profile for John Doe');

        // Add some sample health metrics for the patient
        const today = new Date().toISOString().split('T')[0];
        db.createHealthMetric({
          patientId: patient.id,
          metricType: 'blood-pressure',
          value: '120/80',
          unit: 'mmHg',
          recordedDate: today,
          recordedBy: 'patient',
          notes: 'Self-measured at home'
        });

        db.createHealthMetric({
          patientId: patient.id,
          metricType: 'heart-rate',
          value: '72',
          unit: 'bpm',
          recordedDate: today,
          recordedBy: 'patient'
        });

        db.createHealthMetric({
          patientId: patient.id,
          metricType: 'weight',
          value: '165',
          unit: 'lbs',
          recordedDate: today,
          recordedBy: 'patient'
        });

        db.createHealthMetric({
          patientId: patient.id,
          metricType: 'bmi',
          value: '22.1',
          unit: '',
          recordedDate: today,
          recordedBy: 'patient'
        });

        console.log('Added sample health metrics for patient');
      }
    }

    // Create sample appointments
    const doctor = db.getDoctorByUserId(doctorUser?.id || '');
    const patient = db.getPatientByUserId(patientUser?.id || '');
    
    if (doctor && patient) {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Today's appointment
      db.createAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: today,
        appointmentTime: '14:00',
        appointmentType: 'consultation',
        status: 'confirmed',
        consultationType: 'in-person',
        reason: 'Regular checkup',
        durationMinutes: 30,
        fee: 150.00
      });

      // Tomorrow's appointment
      db.createAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: tomorrow,
        appointmentTime: '10:30',
        appointmentType: 'follow-up',
        status: 'confirmed',
        consultationType: 'video-call',
        reason: 'Follow-up consultation',
        durationMinutes: 30,
        fee: 150.00
      });

      console.log('Created sample appointments');
    }

    // Create sample tasks for staff
    if (staffUser) {
      db.createTask({
        assignedTo: staffUser.id,
        createdBy: doctorUser?.id || staffUser.id,
        title: 'Prepare equipment for MRI scan',
        description: 'Ensure MRI machine is calibrated and ready for afternoon appointments',
        priority: 'high',
        status: 'pending',
        taskType: 'equipment',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      });

      db.createTask({
        assignedTo: staffUser.id,
        createdBy: doctorUser?.id || staffUser.id,
        title: 'Update patient records',
        description: 'Enter test results into patient management system',
        priority: 'medium',
        status: 'pending',
        taskType: 'administrative',
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
      });

      db.createTask({
        assignedTo: staffUser.id,
        createdBy: staffUser.id,
        title: 'Clean radiology room',
        description: 'Sanitize equipment and prepare room for next patient',
        priority: 'low',
        status: 'pending',
        taskType: 'maintenance',
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
      });

      console.log('Created sample tasks for staff');
    }

    // Create sample notifications
    if (patientUser) {
      db.createNotification({
        userId: patientUser.id,
        title: 'Appointment Reminder',
        message: "Don't forget your appointment with Dr. Sarah Johnson today at 2:00 PM",
        type: 'appointment',
        priority: 'high',
        isRead: false
      });

      db.createNotification({
        userId: patientUser.id,
        title: 'New Test Results',
        message: 'Your blood work results are now available in your medical records',
        type: 'test-result',
        priority: 'medium',
        isRead: false
      });

      db.createNotification({
        userId: patientUser.id,
        title: 'Health Tip',
        message: 'Remember to stay hydrated and maintain your exercise routine',
        type: 'general',
        priority: 'low',
        isRead: true
      });

      console.log('Created sample notifications');
    }

    console.log('Database seeding completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
};