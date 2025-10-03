// Healthcare Data Hooks
// React hooks for role-based data access in frontend components

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { healthcareDataService, AccessContext } from '@/services/healthcare-data-service';

// ============================================
// CUSTOM HOOKS FOR DATA ACCESS
// ============================================

export function useHealthcareData() {
  const { user } = useAuth();
  const [context, setContext] = useState<AccessContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContext() {
      if (user) {
        try {
          const accessContext = await healthcareDataService.getAccessContext(user.id);
          setContext(accessContext);
        } catch (error) {
          console.error('Failed to load access context:', error);
        }
      }
      setLoading(false);
    }
    
    loadContext();
  }, [user]);

  return { context, loading };
}

// ============================================
// APPOINTMENTS HOOKS
// ============================================

export function useAppointments() {
  const { context } = useHealthcareData();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getAppointments(context);
      if (error) {
        setError(error.message || 'Failed to fetch appointments');
      } else {
        setAppointments(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, error, refetch: fetchAppointments };
}

export function useAppointment(appointmentId: string) {
  const { context } = useHealthcareData();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointment() {
      if (!context || !appointmentId) return;
      
      try {
        setLoading(true);
        const { data, error } = await healthcareDataService.getAppointmentById(appointmentId, context);
        if (error) {
          setError(error.message || 'Failed to fetch appointment');
        } else {
          setAppointment(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch appointment');
      } finally {
        setLoading(false);
      }
    }

    fetchAppointment();
  }, [context, appointmentId]);

  return { appointment, loading, error };
}

// ============================================
// MEDICAL RECORDS HOOKS
// ============================================

export function useMedicalRecords() {
  const { context } = useHealthcareData();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getMedicalRecords(context);
      if (error) {
        setError(error.message || 'Failed to fetch medical records');
      } else {
        setRecords(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

// ============================================
// LAB TESTS HOOKS
// ============================================

export function useLabTests() {
  const { context } = useHealthcareData();
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabTests = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getLabTests(context);
      if (error) {
        setError(error.message || 'Failed to fetch lab tests');
      } else {
        setLabTests(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  return { labTests, loading, error, refetch: fetchLabTests };
}

// ============================================
// DOCTORS HOOKS
// ============================================

export function useDoctors() {
  const { context } = useHealthcareData();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getDoctors(context);
      if (error) {
        setError(error.message || 'Failed to fetch doctors');
      } else {
        setDoctors(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
}

// ============================================
// SERVICES HOOKS
// ============================================

export function useServices() {
  const { context } = useHealthcareData();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getServices(context);
      if (error) {
        setError(error.message || 'Failed to fetch services');
      } else {
        setServices(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}

// ============================================
// SERVICE PACKAGES HOOKS
// ============================================

export function useServicePackages() {
  const { context } = useHealthcareData();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getServicePackages(context);
      if (error) {
        setError(error.message || 'Failed to fetch service packages');
      } else {
        setPackages(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch service packages');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return { packages, loading, error, refetch: fetchPackages };
}

// ============================================
// PATIENTS HOOKS
// ============================================

export function usePatients() {
  const { context } = useHealthcareData();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getPatients(context);
      if (error) {
        setError(error.message || 'Failed to fetch patients');
      } else {
        setPatients(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, loading, error, refetch: fetchPatients };
}

// ============================================
// PAYMENTS HOOKS
// ============================================

export function usePayments() {
  const { context } = useHealthcareData();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getPayments(context);
      if (error) {
        setError(error.message || 'Failed to fetch payments');
      } else {
        setPayments(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, refetch: fetchPayments };
}

// ============================================
// HEALTH METRICS HOOKS
// ============================================

export function useHealthMetrics() {
  const { context } = useHealthcareData();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getHealthMetrics(context);
      if (error) {
        setError(error.message || 'Failed to fetch health metrics');
      } else {
        setMetrics(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch health metrics');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

// ============================================
// NOTIFICATIONS HOOKS
// ============================================

export function useNotifications() {
  const { context } = useHealthcareData();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getNotifications(context);
      if (error) {
        setError(error.message || 'Failed to fetch notifications');
      } else {
        setNotifications(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, error, refetch: fetchNotifications };
}

// ============================================
// TASKS HOOKS
// ============================================

export function useTasks() {
  const { context } = useHealthcareData();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getTasks(context);
      if (error) {
        setError(error.message || 'Failed to fetch tasks');
      } else {
        setTasks(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}

// ============================================
// EQUIPMENT HOOKS
// ============================================

export function useEquipment() {
  const { context } = useHealthcareData();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    if (!context) return;
    
    try {
      setLoading(true);
      const { data, error } = await healthcareDataService.getEquipment(context);
      if (error) {
        setError(error.message || 'Failed to fetch equipment');
      } else {
        setEquipment(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  return { equipment, loading, error, refetch: fetchEquipment };
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function usePatientDashboard() {
  const { context } = useHealthcareData();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!context || context.role !== 'patient') return;
      
      try {
        setLoading(true);
        const data = await healthcareDataService.getPatientDashboard(context);
        if (data.error) {
          setError(data.error.message || 'Failed to fetch dashboard data');
        } else {
          setDashboardData(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [context]);

  return { dashboardData, loading, error };
}

export function useDoctorDashboard() {
  const { context } = useHealthcareData();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!context || context.role !== 'doctor') return;
      
      try {
        setLoading(true);
        const data = await healthcareDataService.getDoctorDashboard(context);
        if (data.error) {
          setError(data.error.message || 'Failed to fetch dashboard data');
        } else {
          setDashboardData(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [context]);

  return { dashboardData, loading, error };
}

export function useStaffDashboard() {
  const { context } = useHealthcareData();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!context || (context.role !== 'staff' && context.role !== 'admin')) return;
      
      try {
        setLoading(true);
        const data = await healthcareDataService.getStaffDashboard(context);
        if (data.error) {
          setError(data.error.message || 'Failed to fetch dashboard data');
        } else {
          setDashboardData(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [context]);

  return { dashboardData, loading, error };
}