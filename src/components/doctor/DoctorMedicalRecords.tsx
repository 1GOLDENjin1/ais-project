import React, { useEffect, useMemo, useState } from 'react';
import DoctorManagementService, { DoctorAppointment, DoctorMedicalRecord, DoctorProfile } from '@/services/doctorDatabaseService';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface DoctorMedicalRecordsProps {
  doctorProfile: DoctorProfile;
}

const DoctorMedicalRecords: React.FC<DoctorMedicalRecordsProps> = ({ doctorProfile }) => {
  const { toast } = useToast();
  const [records, setRecords] = useState<DoctorMedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [recData, apptData] = await Promise.all([
          DoctorManagementService.getMyMedicalRecords(doctorProfile.id),
          DoctorManagementService.getMyAppointments(doctorProfile.id)
        ]);
        setAppointments(apptData);

        if (recData && recData.length > 0) {
          setRecords(recData);
        } else if (apptData && apptData.length > 0) {
          // Fallback: fetch records for patients this doctor sees (handles schemas where doctor_id differs)
          const patientIds = Array.from(new Set(apptData.map((a) => a.patient_id))).filter(Boolean);
          if (patientIds.length > 0) {
            const { data: fallback, error } = await supabase
              .from('medical_records')
              .select(`
                *,
                appointment:appointments!appointment_id (
                  appointment_date,
                  service_type
                ),
                patient:patients!patient_id (
                  users:user_id (name)
                )
              `)
              .in('patient_id', patientIds)
              .order('created_at', { ascending: false });
            if (!error && fallback) {
              setRecords(fallback as unknown as DoctorMedicalRecord[]);
            } else {
              setRecords([]);
            }
          } else {
            setRecords([]);
          }
        } else {
          setRecords([]);
        }
      } catch (e) {
        console.error('Failed to load medical records:', e);
        toast({ title: 'Failed to load records', description: 'Please try again later.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorProfile.id]);

  const patientOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    appointments.forEach((a) => {
      const p = a.patient;
      if (p && !map.has(p.id)) {
        map.set(p.id, { id: p.id, name: p.users?.name || 'Patient' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const appointmentOptions = useMemo(() => {
    return appointments
      .filter((a) => a.patient_id === patientId)
      .sort((a, b) => (a.appointment_date < b.appointment_date ? 1 : -1))
      .map((a) => ({
        id: a.id,
        label: `${a.appointment_date} ${a.appointment_time} • ${a.service_type}`
      }));
  }, [appointments, patientId]);

  const canSubmit = patientId && appointmentId;

  const handleCreate = async () => {
    if (!canSubmit) return;
    try {
      const id = await DoctorManagementService.createMedicalRecord(
        patientId,
        doctorProfile.id,
        appointmentId,
        diagnosis || undefined,
        notes || undefined
      );
      if (id) {
        toast({ title: 'Medical record created', description: 'The new record has been saved.' });
        // reset form and refresh records
        setDiagnosis('');
        setNotes('');
        setAppointmentId('');
        // reload records list
        const recData = await DoctorManagementService.getMyMedicalRecords(doctorProfile.id);
        setRecords(recData);
      } else {
        toast({ title: 'Failed to create record', description: 'Please try again.', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Create record failed:', e);
      toast({ title: 'Error', description: 'Failed to create record.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading medical records...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Create Medical Record */}
      <Card>
        <CardHeader>
          <CardTitle>Create Medical Record</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm text-gray-600 mb-1">Patient</Label>
              <Select
                value={patientId}
                onValueChange={(value) => {
                  setPatientId(value);
                  setAppointmentId('');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm text-gray-600 mb-1">Appointment</Label>
              <Select
                value={appointmentId}
                onValueChange={setAppointmentId}
                disabled={!patientId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Diagnosis</label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Hypertension" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Notes</label>
              <textarea
                className="w-full border rounded px-3 py-2 h-24"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add examination findings or care plan"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleCreate} disabled={!canSubmit}>Create Record</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span>Medical Records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No medical records found.</div>
          ) : (
            <div className="divide-y">
              {records.map((r) => (
                <div key={r.id} className="py-3">
                  <div className="font-medium text-gray-900 flex items-center justify-between">
                    <span>{r.patient?.users?.name || 'Patient'}</span>
                    <span className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {r.appointment ? `${r.appointment.appointment_date} • ${r.appointment.service_type}` : '—'}
                  </div>
                  {r.diagnosis && (
                    <div className="text-sm mt-1"><span className="font-medium">Diagnosis: </span>{r.diagnosis}</div>
                  )}
                  {r.notes && (
                    <div className="text-sm text-gray-700 mt-1 line-clamp-2">{r.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorMedicalRecords;