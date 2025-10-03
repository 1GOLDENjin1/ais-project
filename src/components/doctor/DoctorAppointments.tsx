import React, { useEffect, useMemo, useState } from 'react';
import DoctorManagementService, { DoctorAppointment, DoctorProfile } from '@/services/doctorDatabaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface DoctorAppointmentsProps {
  doctorProfile: DoctorProfile;
}

const statusBadge = (status: DoctorAppointment['status']) => {
  const classes = {
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  } as const;
  const Icon =
    status === 'confirmed' ? CheckCircle : status === 'pending' ? AlertCircle : status === 'completed' ? CheckCircle : XCircle;
  return (
    <Badge className={`${classes[status]} flex items-center space-x-1 border`}> 
      <Icon className="h-3.5 w-3.5" />
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({ doctorProfile }) => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await DoctorManagementService.getMyAppointments(doctorProfile.id);
        setAppointments(data);
      } catch (e) {
        console.error('Failed to load appointments:', e);
        setError('Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorProfile.id]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const da = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const db = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return db.getTime() - da.getTime();
    });
  }, [appointments]);

  const updateStatus = async (
    appointmentId: string,
    status: DoctorAppointment['status']
  ) => {
    try {
      const ok = await DoctorManagementService.updateAppointmentStatus(appointmentId, status);
      if (ok) {
        setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status } : a)));
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600">
        <Clock className="h-5 w-5 mr-2 animate-spin" /> Loading appointments...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>All Appointments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No appointments found.</div>
          ) : (
            <div className="divide-y">
              {sortedAppointments.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {a.patient?.users?.name?.split(' ').map((n) => n[0]).join('') || 'P'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {a.patient?.users?.name || 'Patient'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {a.service_type} • {a.appointment_date} {a.appointment_time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {statusBadge(a.status)}
                    <div className="flex items-center space-x-2">
                      {a.status === 'pending' && (
                        <Button size="sm" onClick={() => updateStatus(a.id, 'confirmed')}>
                          Confirm
                        </Button>
                      )}
                      {a.status === 'confirmed' && (
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(a.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                      {a.status !== 'cancelled' && a.status !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'cancelled')}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAppointments;