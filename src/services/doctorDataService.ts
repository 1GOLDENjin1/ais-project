import { supabase } from '@/lib/supabase';
import DoctorManagementService, {
  DoctorAppointment,
  DoctorLabTest,
  DoctorMedicalRecord,
  DoctorMessageThread,
  DoctorPrescription,
  DoctorProfile,
  DoctorSchedule,
  DoctorTask,
  DoctorVideoCall,
} from './doctorDatabaseService';
import { notificationService, type Notification } from './notificationService';

export interface DoctorSnapshot {
  profile: DoctorProfile;
  // Core data
  appointments: DoctorAppointment[];
  todaysAppointments: DoctorAppointment[];
  patients: Array<{
    id: string;
    user_id?: string;
    name?: string;
    email?: string;
    phone?: string;
  }>;
  medicalRecords: DoctorMedicalRecord[];
  prescriptions: DoctorPrescription[];
  labTests: DoctorLabTest[];
  videoCalls: DoctorVideoCall[];
  schedule: DoctorSchedule[];
  messageThreads: DoctorMessageThread[];
  tasks: DoctorTask[];
  notifications: Notification[];
  // Derived stats
  stats: {
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    todaysAppointments: number;
    uniquePatients: number;
    unreadNotifications: number;
    pendingTasks: number;
  };
}

class DoctorDataService {
  /**
   * Resolve the doctor profile by userId then load the full snapshot.
   */
  async getDoctorSnapshotByUserId(userId: string): Promise<{ data?: DoctorSnapshot; error?: string }> {
    try {
      const profile = await DoctorManagementService.getDoctorProfileByUserId(userId);
      if (!profile) {
        return { error: 'Doctor profile not found for this user.' };
      }
      return this.getDoctorSnapshotByDoctorId(profile.id, userId);
    } catch (e: unknown) {
      console.error('getDoctorSnapshotByUserId error:', e);
      const message = e instanceof Error ? e.message : 'Failed to load doctor snapshot.';
      return { error: message };
    }
  }

  /**
   * Load all doctor-related data in parallel using doctorId. Optionally pass userId for notifications.
   */
  async getDoctorSnapshotByDoctorId(doctorId: string, userIdForNotifications?: string): Promise<{ data?: DoctorSnapshot; error?: string }> {
    try {
      // Fetch core in parallel
      const [
        profile,
        appointments,
        todaysAppointments,
        medicalRecords,
        prescriptions,
        labTests,
        videoCalls,
        schedule,
        messageThreads,
        tasks,
      ] = await Promise.all([
        DoctorManagementService.getMyProfile(doctorId),
        DoctorManagementService.getMyAppointments(doctorId),
        DoctorManagementService.getTodaysAppointments(doctorId),
        DoctorManagementService.getMyMedicalRecords(doctorId),
        DoctorManagementService.getMyPrescriptions(doctorId),
        DoctorManagementService.getMyLabTests(doctorId),
        DoctorManagementService.getMyVideoCalls(doctorId),
        DoctorManagementService.getMySchedule(doctorId),
        DoctorManagementService.getMyMessageThreads(doctorId),
        DoctorManagementService.getMyTasks(doctorId),
      ]);

      if (!profile) {
        return { error: 'Doctor profile not found.' };
      }

      // Derive unique patients from appointments to avoid relying on subqueries unsupported by the JS client
      const patientMap = new Map<string, { id: string; user_id?: string; name?: string; email?: string; phone?: string }>();
      (appointments || []).forEach((apt) => {
        const p = apt.patient;
        if (p && !patientMap.has(p.id)) {
          patientMap.set(p.id, {
            id: p.id,
            user_id: undefined,
            name: p.users?.name,
            email: p.users?.email,
            phone: p.users?.phone,
          });
        }
      });
      const patients = Array.from(patientMap.values());

      // Notifications (by user id, not doctor id). If not provided, resolve doctor.user_id via a lightweight query
      let notifications: Notification[] = [];
      try {
        let userId = userIdForNotifications;
        if (!userId) {
          const { data: doctorUser } = await supabase
            .from('doctors')
            .select('user_id')
            .eq('id', doctorId)
            .single();
          userId = doctorUser?.user_id;
        }
        if (userId) {
          const notifRes = await notificationService.getNotifications(userId, { limit: 50 });
          notifications = notifRes.notifications;
        }
      } catch (e) {
        console.warn('Notifications fetch failed, continuing without:', e);
      }

      // Derived stats
      const totalAppointments = appointments?.length || 0;
      const upcomingAppointments = (appointments || []).filter((a) => {
        // If appointment_date is YYYY-MM-DD, compare as date
        try {
          const d = new Date(a.appointment_date + 'T00:00:00');
          return d.getTime() >= new Date().setHours(0, 0, 0, 0) && a.status !== 'cancelled';
        } catch {
          return false;
        }
      }).length;
      const completedAppointments = (appointments || []).filter((a) => a.status === 'completed').length;
      const todaysAppointmentsCount = todaysAppointments?.length || 0;
      const uniquePatients = patients.length;
      const unreadNotifications = notifications.filter((n) => !n.is_read).length;
      const pendingTasks = (tasks || []).filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

      const data: DoctorSnapshot = {
        profile,
        appointments: appointments || [],
        todaysAppointments: todaysAppointments || [],
        patients,
        medicalRecords: medicalRecords || [],
        prescriptions: prescriptions || [],
        labTests: labTests || [],
        videoCalls: videoCalls || [],
        schedule: schedule || [],
        messageThreads: messageThreads || [],
        tasks: tasks || [],
        notifications,
        stats: {
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
          todaysAppointments: todaysAppointmentsCount,
          uniquePatients,
          unreadNotifications,
          pendingTasks,
        },
      };

      return { data };
    } catch (e: unknown) {
      console.error('getDoctorSnapshotByDoctorId error:', e);
      const message = e instanceof Error ? e.message : 'Failed to load doctor snapshot.';
      return { error: message };
    }
  }
}

export const doctorDataService = new DoctorDataService();
