// ===================================================
// STAFF/DOCTOR REAL-TIME PATIENT DISPLAY COMPONENT
// Shows how patient booking data is displayed for staff and doctors
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ohszhvaowidoohiqubqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oc3podmFvd2lkb29oaXF1YnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwODQ2ODksImV4cCI6MjA0NTY2MDY4OX0.OKlNpuURaQP8gJ7mXYnb67VdAExXoNOa7S-0Z5HP9VI'
);

const StaffDoctorPatientDisplay = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const subscriptionRef = useRef(null);

  // Real-time data fetching
  useEffect(() => {
    fetchPatientData();
    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments with complete patient data
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          doctor_id,
          service_type,
          reason,
          appointment_date,
          appointment_time,
          status,
          appointment_type,
          consultation_type,
          duration_minutes,
          fee,
          notes,
          created_at,
          updated_at,
          confirmed_at,
          patients (
            id,
            user_id,
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            blood_type,
            allergies,
            medical_history,
            insurance_provider,
            insurance_number,
            users (
              id,
              name,
              email,
              phone,
              profile_picture_url,
              created_at
            )
          ),
          doctors (
            id,
            specialty,
            consultation_fee,
            rating,
            users (
              id,
              name,
              email
            )
          ),
          patient_checkins (
            id,
            status,
            checkin_time,
            called_time,
            consultation_start_time,
            notes
          )
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Fetch standalone patient data
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id,
          user_id,
          date_of_birth,
          gender,
          address,
          emergency_contact_name,
          emergency_contact_phone,
          blood_type,
          allergies,
          medical_history,
          insurance_provider,
          insurance_number,
          created_at,
          updated_at,
          users (
            id,
            name,
            email,
            phone,
            profile_picture_url,
            role,
            created_at,
            last_login
          ),
          patient_preferences (
            id,
            language,
            email_notifications,
            sms_notifications,
            appointment_reminders
          )
        `)
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
      setRealtimeConnected(true);

    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to appointments changes
    subscriptionRef.current = supabase
      .channel('patient-data-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Real-time appointment change:', payload);
          fetchPatientData(); // Refresh data on changes
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          console.log('Real-time patient change:', payload);
          fetchPatientData(); // Refresh data on changes
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'patient_checkins' },
        (payload) => {
          console.log('Real-time check-in change:', payload);
          fetchPatientData(); // Refresh data on changes
        }
      )
      .subscribe();
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patients?.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patients?.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredPatients = patients.filter(patient => {
    return patient.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patient.users?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading patient data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error loading patient data:</strong> {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            📋 Staff/Doctor Patient Dashboard
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              realtimeConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                realtimeConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {realtimeConnected ? 'Real-time Connected' : 'Disconnected'}
            </div>
            <button 
              onClick={fetchPatientData}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mt-2">
          Real-time patient booking data display for healthcare staff and doctors
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'appointments'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'patients'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 All Patients ({patients.length})
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patients by name, email, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {activeTab === 'appointments' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'appointments' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📊 Appointments Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Total:</span> {appointments.length}
              </div>
              <div>
                <span className="text-green-600">Confirmed:</span> {appointments.filter(a => a.status === 'confirmed').length}
              </div>
              <div>
                <span className="text-yellow-600">Pending:</span> {appointments.filter(a => a.status === 'pending').length}
              </div>
              <div>
                <span className="text-blue-600">Today:</span> {appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length}
              </div>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No appointments found matching your criteria.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => {
                const patient = appointment.patients;
                const doctor = appointment.doctors;
                const checkin = appointment.patient_checkins?.[0];

                return (
                  <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient?.users?.name || 'Unknown Patient'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          {checkin && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              {checkin.status}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          📞 {patient?.users?.phone || 'No phone'} • 
                          📧 {patient?.users?.email || 'No email'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>{appointment.appointment_date}</p>
                        <p>{appointment.appointment_time}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Appointment Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">📋 Appointment Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Service:</span> {appointment.service_type}</p>
                          <p><span className="font-medium">Type:</span> {appointment.appointment_type}</p>
                          <p><span className="font-medium">Method:</span> {appointment.consultation_type}</p>
                          <p><span className="font-medium">Duration:</span> {appointment.duration_minutes} minutes</p>
                          <p><span className="font-medium">Fee:</span> ₱{appointment.fee || 'N/A'}</p>
                          {appointment.reason && (
                            <p><span className="font-medium">Reason:</span> {appointment.reason}</p>
                          )}
                          {doctor && (
                            <p><span className="font-medium">Doctor:</span> {doctor.users?.name} ({doctor.specialty})</p>
                          )}
                        </div>
                      </div>

                      {/* Patient Information */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">👤 Patient Information</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Age:</span> {calculateAge(patient?.date_of_birth)} years</p>
                          <p><span className="font-medium">Gender:</span> {patient?.gender || 'N/A'}</p>
                          <p><span className="font-medium">Blood Type:</span> {patient?.blood_type || 'N/A'}</p>
                          {patient?.allergies && (
                            <p><span className="font-medium">Allergies:</span> {patient.allergies}</p>
                          )}
                          <p><span className="font-medium">Emergency Contact:</span> {patient?.emergency_contact_name || 'N/A'}</p>
                          {patient?.emergency_contact_phone && (
                            <p><span className="font-medium">Emergency Phone:</span> {patient.emergency_contact_phone}</p>
                          )}
                          <p><span className="font-medium">Insurance:</span> {patient?.insurance_provider || 'None'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Check-in Information */}
                    {checkin && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">✅ Check-in Status</h4>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-purple-700">
                          <p><span className="font-medium">Checked in:</span> {new Date(checkin.checkin_time).toLocaleTimeString()}</p>
                          {checkin.called_time && (
                            <p><span className="font-medium">Called:</span> {new Date(checkin.called_time).toLocaleTimeString()}</p>
                          )}
                          {checkin.consultation_start_time && (
                            <p><span className="font-medium">Started:</span> {new Date(checkin.consultation_start_time).toLocaleTimeString()}</p>
                          )}
                        </div>
                        {checkin.notes && (
                          <p className="mt-2 text-sm text-purple-600">
                            <span className="font-medium">Notes:</span> {checkin.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">👥 Patients Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-600">Total Patients:</span> {patients.length}
              </div>
              <div>
                <span className="text-blue-600">With Appointments:</span> {appointments.filter((apt, index, self) => self.findIndex(a => a.patient_id === apt.patient_id) === index).length}
              </div>
              <div>
                <span className="text-purple-600">Recent Registrations:</span> {patients.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div>
                <span className="text-orange-600">Active Today:</span> {patients.filter(p => p.users?.last_login && new Date(p.users.last_login).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No patients found matching your search.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredPatients.map((patient) => {
                const user = patient.users;
                const preferences = patient.patient_preferences?.[0];
                const patientAppointments = appointments.filter(apt => apt.patient_id === patient.id);

                return (
                  <div key={patient.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user?.name || 'Unknown Patient'}
                        </h3>
                        <p className="text-gray-600">
                          📞 {user?.phone || 'No phone'} • 📧 {user?.email || 'No email'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Patient ID: {patient.id.slice(0, 8)}...</p>
                        <p>Registered: {new Date(patient.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Basic Information */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">📋 Basic Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <p><span className="font-medium">Age:</span> {calculateAge(patient.date_of_birth)}</p>
                          <p><span className="font-medium">Gender:</span> {patient.gender || 'N/A'}</p>
                          <p><span className="font-medium">Blood Type:</span> {patient.blood_type || 'N/A'}</p>
                          <p><span className="font-medium">Insurance:</span> {patient.insurance_provider || 'None'}</p>
                        </div>
                        {patient.address && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Address:</span> {patient.address}
                          </p>
                        )}
                      </div>

                      {/* Emergency Contact */}
                      {patient.emergency_contact_name && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🚨 Emergency Contact</h4>
                          <div className="text-sm text-gray-600">
                            <p>{patient.emergency_contact_name}</p>
                            {patient.emergency_contact_phone && (
                              <p>📞 {patient.emergency_contact_phone}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Appointments Summary */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">📅 Appointments</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <p className="font-medium text-blue-600">{patientAppointments.length}</p>
                            <p className="text-blue-500 text-xs">Total</p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <p className="font-medium text-green-600">
                              {patientAppointments.filter(apt => apt.status === 'completed').length}
                            </p>
                            <p className="text-green-500 text-xs">Completed</p>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 rounded">
                            <p className="font-medium text-yellow-600">
                              {patientAppointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed').length}
                            </p>
                            <p className="text-yellow-500 text-xs">Upcoming</p>
                          </div>
                        </div>
                      </div>

                      {/* Medical Alerts */}
                      {patient.allergies && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-medium text-red-900 mb-1">⚠️ Allergies</h4>
                          <p className="text-sm text-red-700">{patient.allergies}</p>
                        </div>
                      )}

                      {/* Preferences */}
                      {preferences && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">⚙️ Preferences</h4>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {preferences.email_notifications && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">📧 Email</span>
                            )}
                            {preferences.sms_notifications && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">📱 SMS</span>
                            )}
                            {preferences.appointment_reminders && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">🔔 Reminders</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDoctorPatientDisplay;