import React, { useEffect, useMemo, useState } from 'react';
import DoctorManagementService, { DoctorAppointment, DoctorProfile } from '@/services/doctorDatabaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';

interface DoctorPatientsProps {
  doctorProfile: DoctorProfile;
}

const DoctorPatients: React.FC<DoctorPatientsProps> = ({ doctorProfile }) => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await DoctorManagementService.getMyAppointments(doctorProfile.id);
      setAppointments(data);
    };
    load();
  }, [doctorProfile.id]);

  const patients = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string; phone?: string; lastVisit?: string }>();
    appointments.forEach((a) => {
      const p = a.patient;
      if (!p) return;
      const id = p.id;
      const name = p.users?.name || 'Patient';
      const email = p.users?.email;
      const phone = p.users?.phone;
      const last = a.appointment_date;
      const existing = map.get(id);
      if (!existing || new Date(last) > new Date(existing.lastVisit || 0)) {
        map.set(id, { id, name, email, phone, lastVisit: last });
      }
    });
    const arr = Array.from(map.values());
    if (!query) return arr;
    return arr.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || (p.email || '').toLowerCase().includes(query.toLowerCase()));
  }, [appointments, query]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span>My Patients</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {patients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No patients found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4">{p.email || '-'}</td>
                      <td className="py-2 pr-4">{p.phone || '-'}</td>
                      <td className="py-2 pr-4">{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorPatients;