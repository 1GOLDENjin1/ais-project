import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PatientSummary {
  id: string;
  name: string;
  email: string;
  gender?: string;
  date_of_birth?: string;
}

interface MedicalRecordEntry {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  record_type: string | null;
}

const StaffPatientRecords: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'history' | 'add'>('personal');
  const [records, setRecords] = useState<MedicalRecordEntry[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [newResult, setNewResult] = useState({ diagnosis: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) return;
    loadPatients();
  }, [user]);

  async function loadPatients() {
    setLoadingPatients(true);
    const { data, error } = await supabase
      .from('patients')
      .select('id, user:users(name,email), gender, date_of_birth')
      .limit(50);

    if (!error && data) {
      const mapped: PatientSummary[] = data.map((p: any) => ({
        id: p.id,
        name: p.user?.name || 'Unknown',
        email: p.user?.email || 'n/a',
        gender: p.gender,
        date_of_birth: p.date_of_birth
      }));
      setPatients(mapped);
    }
    setLoadingPatients(false);
  }

  async function loadMedicalRecords(patientId: string) {
    setRecordsLoading(true);
    const { data, error } = await supabase
      .from('medical_records')
      .select('id, diagnosis, notes, created_at, record_type')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(25);
    if (!error && data) setRecords(data as any);
    setRecordsLoading(false);
  }

  function selectPatient(p: PatientSummary) {
    setSelectedPatient(p);
    setActiveTab('personal');
    loadMedicalRecords(p.id);
  }

  async function saveNewResult() {
    if (!selectedPatient || !user) return;
    if (!newResult.diagnosis && !newResult.notes) return;
    setSaving(true);
    const { error } = await supabase.from('medical_records').insert({
      patient_id: selectedPatient.id,
      doctor_id: null, // optional for staff entry
      diagnosis: newResult.diagnosis || null,
      notes: newResult.notes || null,
      record_type: 'staff_note'
    });
    if (!error) {
      setNewResult({ diagnosis: '', notes: '' });
      loadMedicalRecords(selectedPatient.id);
      setActiveTab('history');
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-100">
      {/* Header Navigation - Simple */}
      <header className="bg-gradient-to-r from-cyan-400 to-blue-400 shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/staff/dashboard')} className="text-white hover:text-blue-100">
              Home
            </button>
            <span className="text-white">Services</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!selectedPatient ? (
          // Patient Selection Screen
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">Select Patient</h1>
            </div>
            
            {loadingPatients && <div className="text-center text-gray-500">Loading patients...</div>}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  className="bg-white hover:bg-blue-50 border border-gray-200 rounded-xl p-4 text-left transition-colors shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.email}</p>
                    </div>
                  </div>
                </button>
              ))}
              {!loadingPatients && patients.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">No patients found.</div>
              )}
            </div>
          </div>
        ) : (
          // Selected Patient Record View - Match Image Layout
          <div className="space-y-6">
            {/* Blue Header Pill - "Patient Record" */}
            <div className="flex justify-center">
              <div className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg">
                Patient Record
              </div>
            </div>

            {/* Patient Avatar Section */}
            <div className="flex justify-center">
              <div className="bg-gray-300 w-20 h-20 rounded-full flex items-center justify-center shadow-md">
                <User className="h-10 w-10 text-gray-600" />
              </div>
            </div>

            {/* Vertical Action Cards - Match Image Style */}
            <div className="max-w-sm mx-auto space-y-3">
              {/* Personal Information Card */}
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all shadow-md ${
                  activeTab === 'personal' 
                    ? 'bg-blue-500 text-white transform scale-105' 
                    : 'bg-blue-400 hover:bg-blue-500 text-white hover:transform hover:scale-105'
                }`}
              >
                Personal Information
              </button>

              {/* Medical History Card */}
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all shadow-md ${
                  activeTab === 'history' 
                    ? 'bg-blue-500 text-white transform scale-105' 
                    : 'bg-blue-400 hover:bg-blue-500 text-white hover:transform hover:scale-105'
                }`}
              >
                Medical History
              </button>

              {/* Add Result Card */}
              <button
                onClick={() => setActiveTab('add')}
                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all shadow-md ${
                  activeTab === 'add' 
                    ? 'bg-blue-500 text-white transform scale-105' 
                    : 'bg-blue-400 hover:bg-blue-500 text-white hover:transform hover:scale-105'
                }`}
              >
                Add Result
              </button>
            </div>

            {/* Content Area Based on Selected Tab */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
              {/* Personal Information Content */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 text-center mb-6">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-500 text-xs uppercase font-medium">Full Name</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.name}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-500 text-xs uppercase font-medium">Email</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.email}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-500 text-xs uppercase font-medium">Gender</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.gender || 'Not specified'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-500 text-xs uppercase font-medium">Birth Date</p>
                      <p className="font-semibold text-gray-900">{selectedPatient.date_of_birth || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical History Content */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 text-center mb-6">Medical History</h3>
                  {recordsLoading && <p className="text-center text-gray-500">Loading records...</p>}
                  {!recordsLoading && records.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No medical records found.</p>
                  )}
                  <div className="space-y-3">
                    {records.map(r => (
                      <div key={r.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-800">{r.diagnosis || 'General Note'}</p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {r.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-blue-300">
                            {r.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Result Content */}
              {activeTab === 'add' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 text-center mb-6">Add Result</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnosis / Title</label>
                      <input
                        type="text"
                        value={newResult.diagnosis}
                        onChange={e => setNewResult({...newResult, diagnosis: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="e.g., Follow-up consultation, Blood pressure check"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Notes / Details</label>
                      <textarea
                        value={newResult.notes}
                        onChange={e => setNewResult({...newResult, notes: e.target.value})}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                        placeholder="Enter detailed observations, vital signs, recommendations, or follow-up instructions..."
                      />
                    </div>
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={saveNewResult}
                        disabled={saving || (!newResult.diagnosis && !newResult.notes)}
                        className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      >
                        {saving ? 'Saving...' : 'Save Result'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ← Back to Patient List
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffPatientRecords;
