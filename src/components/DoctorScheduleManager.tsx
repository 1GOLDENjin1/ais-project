/**
 * Doctor Schedule Manager Component
 * Handles doctor availability and schedule management in doctor_schedules table
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

import { 
  Calendar,
  Clock,
  Plus,
  Edit,
  Save,
  Trash2,
  AlertCircle
} from "lucide-react";

interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start?: string;
  break_end?: string;
  max_patients_per_day: number;
}

interface DoctorScheduleManagerProps {
  doctorId: string;
  onScheduleUpdate?: () => void;
}

const DoctorScheduleManager: React.FC<DoctorScheduleManagerProps> = ({ 
  doctorId, 
  onScheduleUpdate 
}) => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // New schedule form data
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1, // Monday by default
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    break_start: '12:00',
    break_end: '13:00',
    max_patients_per_day: 20
  });

  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    loadSchedules();
  }, [doctorId]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week');

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load schedule data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSchedule = async (scheduleData: Partial<DoctorSchedule>) => {
    try {
      const dataToSave = {
        ...scheduleData,
        doctor_id: doctorId
      };

      const { error } = await supabase
        .from('doctor_schedules')
        .upsert(dataToSave);

      if (error) throw error;

      toast({
        title: "Schedule Saved",
        description: "Your schedule has been updated successfully.",
      });

      await loadSchedules();
      setIsAddingNew(false);
      setEditingSchedule(null);
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Save Error",
        description: "Failed to save schedule changes.",
        variant: "destructive",
      });
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Schedule Deleted",
        description: "The schedule has been removed.",
      });

      await loadSchedules();
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete schedule.",
        variant: "destructive",
      });
    }
  };

  const updateScheduleField = (scheduleId: string, field: string, value: any) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, [field]: value }
        : schedule
    ));
  };

  const toggleAvailability = async (scheduleId: string, isAvailable: boolean) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    await saveSchedule({ ...schedule, is_available: isAvailable });
  };

  const getExistingDays = () => {
    return schedules.map(s => s.day_of_week);
  };

  const getAvailableDays = () => {
    const existingDays = getExistingDays();
    return Array.from({ length: 7 }, (_, i) => i).filter(day => 
      !existingDays.includes(day)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                Manage your availability and working hours for each day of the week
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddingNew(true)}
              disabled={getAvailableDays().length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing Schedules */}
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{dayNames[schedule.day_of_week]}</h4>
                    <Badge variant={schedule.is_available ? "default" : "secondary"}>
                      {schedule.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.is_available}
                      onCheckedChange={(checked) => toggleAvailability(schedule.id, checked)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSchedule(
                        editingSchedule === schedule.id ? null : schedule.id
                      )}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingSchedule === schedule.id ? (
                  // Edit Mode
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => updateScheduleField(schedule.id, 'start_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => updateScheduleField(schedule.id, 'end_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Max Patients/Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={schedule.max_patients_per_day}
                        onChange={(e) => updateScheduleField(schedule.id, 'max_patients_per_day', parseInt(e.target.value) || 20)}
                      />
                    </div>
                    <div>
                      <Label>Break Start</Label>
                      <Input
                        type="time"
                        value={schedule.break_start || ''}
                        onChange={(e) => updateScheduleField(schedule.id, 'break_start', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Break End</Label>
                      <Input
                        type="time"
                        value={schedule.break_end || ''}
                        onChange={(e) => updateScheduleField(schedule.id, 'break_end', e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => saveSchedule(schedule)}
                        className="w-full"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Working Hours</p>
                      <p className="font-medium">
                        {schedule.start_time} - {schedule.end_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Break Time</p>
                      <p className="font-medium">
                        {schedule.break_start && schedule.break_end 
                          ? `${schedule.break_start} - ${schedule.break_end}`
                          : 'No break'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max Patients</p>
                      <p className="font-medium">{schedule.max_patients_per_day}/day</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className={`font-medium ${schedule.is_available ? 'text-green-600' : 'text-red-600'}`}>
                        {schedule.is_available ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Schedule Form */}
            {isAddingNew && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Day of Week</Label>
                      <Select 
                        value={newSchedule.day_of_week.toString()} 
                        onValueChange={(value) => setNewSchedule(prev => ({
                          ...prev, 
                          day_of_week: parseInt(value)
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableDays().map(day => (
                            <SelectItem key={day} value={day.toString()}>
                              {dayNames[day]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Max Patients per Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={newSchedule.max_patients_per_day}
                        onChange={(e) => setNewSchedule(prev => ({
                          ...prev,
                          max_patients_per_day: parseInt(e.target.value) || 20
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={newSchedule.start_time}
                        onChange={(e) => setNewSchedule(prev => ({
                          ...prev,
                          start_time: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={newSchedule.end_time}
                        onChange={(e) => setNewSchedule(prev => ({
                          ...prev,
                          end_time: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Break Start (Optional)</Label>
                      <Input
                        type="time"
                        value={newSchedule.break_start}
                        onChange={(e) => setNewSchedule(prev => ({
                          ...prev,
                          break_start: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Break End (Optional)</Label>
                      <Input
                        type="time"
                        value={newSchedule.break_end}
                        onChange={(e) => setNewSchedule(prev => ({
                          ...prev,
                          break_end: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingNew(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => saveSchedule(newSchedule)}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {schedules.length === 0 && !isAddingNew && (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Schedule Set</h3>
                <p className="text-muted-foreground mb-4">
                  Add your weekly schedule to start accepting appointments.
                </p>
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            )}

            {/* Schedule Summary */}
            {schedules.length > 0 && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Schedule Summary</h4>
                      <div className="text-sm text-blue-800 mt-1">
                        <p>• You have {schedules.filter(s => s.is_available).length} available days</p>
                        <p>• Total weekly capacity: {schedules.reduce((sum, s) => sum + (s.is_available ? s.max_patients_per_day : 0), 0)} patients</p>
                        <p>• Average working hours: {
                          schedules.length > 0 
                            ? Math.round(
                                schedules.reduce((sum, s) => {
                                  const start = new Date(`2000-01-01T${s.start_time}`);
                                  const end = new Date(`2000-01-01T${s.end_time}`);
                                  return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                }, 0) / schedules.length
                              )
                            : 0
                        } hours/day</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Set standard business hours for all weekdays
                const weekdaySchedules = [1, 2, 3, 4, 5].map(day => ({
                  doctor_id: doctorId,
                  day_of_week: day,
                  start_time: '09:00',
                  end_time: '17:00',
                  is_available: true,
                  break_start: '12:00',
                  break_end: '13:00',
                  max_patients_per_day: 20
                }));
                
                weekdaySchedules.forEach(schedule => saveSchedule(schedule));
              }}
              disabled={schedules.some(s => [1, 2, 3, 4, 5].includes(s.day_of_week))}
            >
              Set Weekday Hours (9-5)
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                schedules.forEach(schedule => {
                  if (schedule.is_available) {
                    saveSchedule({ ...schedule, is_available: false });
                  }
                });
              }}
            >
              Disable All Days
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                schedules.forEach(schedule => {
                  if (!schedule.is_available) {
                    saveSchedule({ ...schedule, is_available: true });
                  }
                });
              }}
            >
              Enable All Days
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorScheduleManager;