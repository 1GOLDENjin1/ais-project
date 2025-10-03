import React, { useEffect, useState } from 'react';
import DoctorManagementService, { DoctorProfile, DoctorSchedule } from '@/services/doctorDatabaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DoctorScheduleManagementProps {
  doctorProfile: DoctorProfile;
}

const DoctorScheduleManagement: React.FC<DoctorScheduleManagementProps> = ({ doctorProfile }) => {
  const [slots, setSlots] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', start: '', end: '' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await DoctorManagementService.getMySchedule(doctorProfile.id);
      setSlots(data);
    } catch (e) {
      toast({ title: 'Failed to load schedule', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorProfile.id]);

  const addSlot = async () => {
    if (!form.date || !form.start || !form.end) {
      toast({ title: 'Fill all fields', variant: 'destructive' });
      return;
    }
    const ok = await DoctorManagementService.addScheduleSlot(doctorProfile.id, form.date, form.start, form.end);
    if (ok) {
      toast({ title: 'Slot added' });
      setForm({ date: '', start: '', end: '' });
      load();
    } else {
      toast({ title: 'Failed to add slot', variant: 'destructive' });
    }
  };

  const deleteSlot = async (id: string) => {
    const ok = await DoctorManagementService.deleteScheduleSlot(id);
    if (ok) {
      toast({ title: 'Slot deleted' });
      load();
    } else {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Availability</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm">Date</label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm">Start</label>
            <Input type="time" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm">End</label>
            <Input type="time" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <Button onClick={addSlot} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add Slot</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : slots.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No schedule slots yet.</div>
          ) : (
            <div className="divide-y">
              {slots.map(s => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700 flex items-center gap-4">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {s.available_date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {s.start_time} - {s.end_time}</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteSlot(s.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorScheduleManagement;