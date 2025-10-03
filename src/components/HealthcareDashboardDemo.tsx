// Healthcare Dashboard Demo Component
// Shows role-based data access using the healthcare data hooks

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useHealthcareData,
  usePatientDashboard, 
  useDoctorDashboard, 
  useStaffDashboard,
  useAppointments,
  useMedicalRecords,
  useDoctors 
} from '@/hooks/useHealthcareData';

const HealthcareDashboardDemo: React.FC = () => {
  const { user } = useAuth();
  const { context, loading: contextLoading } = useHealthcareData();

  if (contextLoading) {
    return <div className="p-4">Loading access context...</div>;
  }

  if (!context) {
    return <div className="p-4">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Healthcare Dashboard Demo
        </h1>
        <p className="text-gray-600">
          Logged in as: <strong>{user?.email}</strong> | Role: <strong>{context.role}</strong>
        </p>
      </div>

      {/* Patient Dashboard */}
      {context.role === 'patient' && <PatientDashboardSection />}
      
      {/* Doctor Dashboard */}
      {context.role === 'doctor' && <DoctorDashboardSection />}
      
      {/* Staff/Admin Dashboard */}
      {(context.role === 'staff' || context.role === 'admin') && <StaffDashboardSection />}
      
      {/* Common Components for all roles */}
      <div className="mt-8">
        <AppointmentsSection />
        <DoctorsSection />
      </div>
    </div>
  );
};

const PatientDashboardSection: React.FC = () => {
  const { dashboardData, loading, error } = usePatientDashboard();
  const { records, loading: recordsLoading } = useMedicalRecords();

  if (loading) return <div>Loading patient dashboard...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-900">Patient Dashboard</h2>
      
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Total Appointments</h3>
            <p className="text-2xl font-bold text-blue-600">{dashboardData.totalAppointments || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Upcoming Appointments</h3>
            <p className="text-2xl font-bold text-green-600">{dashboardData.upcomingAppointments || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Medical Records</h3>
            <p className="text-2xl font-bold text-purple-600">{records?.length || 0}</p>
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-600">
        <p>✅ Viewing only your own appointments and medical records</p>
        <p>✅ Can book new appointments with available doctors</p>
      </div>
    </div>
  );
};

const DoctorDashboardSection: React.FC = () => {
  const { dashboardData, loading, error } = useDoctorDashboard();

  if (loading) return <div>Loading doctor dashboard...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-green-50 p-4 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-green-900">Doctor Dashboard</h2>
      
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Today's Appointments</h3>
            <p className="text-2xl font-bold text-green-600">{dashboardData.todaysAppointments || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Total Patients</h3>
            <p className="text-2xl font-bold text-blue-600">{dashboardData.totalPatients || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Pending Tasks</h3>
            <p className="text-2xl font-bold text-orange-600">{dashboardData.pendingTasks || 0}</p>
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-600">
        <p>✅ Viewing only appointments assigned to you</p>
        <p>✅ Can access medical records of your patients only</p>
        <p>✅ Can manage your schedule and availability</p>
      </div>
    </div>
  );
};

const StaffDashboardSection: React.FC = () => {
  const { dashboardData, loading, error } = useStaffDashboard();

  if (loading) return <div>Loading staff dashboard...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-yellow-50 p-4 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-yellow-900">Staff Dashboard</h2>
      
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Total Appointments</h3>
            <p className="text-2xl font-bold text-blue-600">{dashboardData.totalAppointments || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Total Patients</h3>
            <p className="text-2xl font-bold text-green-600">{dashboardData.totalPatients || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Active Doctors</h3>
            <p className="text-2xl font-bold text-purple-600">{dashboardData.activeDoctors || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-medium text-gray-700">Pending Payments</h3>
            <p className="text-2xl font-bold text-red-600">{dashboardData.pendingPayments || 0}</p>
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-600">
        <p>✅ Full access to all appointments and patient records</p>
        <p>✅ Can manage doctor schedules and availability</p>
        <p>✅ Can view financial reports and analytics</p>
        <p>✅ Administrative access to system settings</p>
      </div>
    </div>
  );
};

const AppointmentsSection: React.FC = () => {
  const { appointments, loading, error, refetch } = useAppointments();

  if (loading) return <div>Loading appointments...</div>;
  if (error) return <div className="text-red-500">Error loading appointments: {error}</div>;

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
        <button 
          onClick={refetch}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
      
      {appointments && appointments.length > 0 ? (
        <div className="space-y-2">
          {appointments.slice(0, 5).map((appointment: any, index: number) => (
            <div key={appointment.id || index} className="bg-white p-3 rounded shadow-sm border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{appointment.service_name || 'Consultation'}</p>
                  <p className="text-sm text-gray-600">
                    {appointment.appointment_date} at {appointment.appointment_time}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {appointment.status || 'scheduled'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status || 'scheduled'}
                </span>
              </div>
            </div>
          ))}
          {appointments.length > 5 && (
            <p className="text-sm text-gray-500 text-center">
              Showing 5 of {appointments.length} appointments
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No appointments found
        </div>
      )}
    </div>
  );
};

const DoctorsSection: React.FC = () => {
  const { doctors, loading, error } = useDoctors();
  const { context } = useHealthcareData();

  if (loading) return <div>Loading doctors...</div>;
  if (error) return <div className="text-red-500">Error loading doctors: {error}</div>;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Doctors</h2>
      
      {doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.slice(0, 6).map((doctor: any, index: number) => (
            <div key={doctor.id || index} className="bg-white p-3 rounded shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {(doctor.first_name || 'Dr')[0]}{(doctor.last_name || 'X')[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{doctor.specialization}</p>
                  {context?.role === 'patient' && (
                    <p className="text-xs text-gray-500">Available for booking</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {doctors.length > 6 && (
            <div className="col-span-full text-center text-sm text-gray-500">
              Showing 6 of {doctors.length} doctors
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No doctors found
        </div>
      )}
    </div>
  );
};

export default HealthcareDashboardDemo;