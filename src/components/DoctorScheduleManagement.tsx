import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DoctorManagementService from '@/services/doctorDatabaseService';

interface Schedule {
  id: string;
  doctor_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  max_appointments?: number;
  location?: string;
  notes?: string;
  current_appointments?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
  patientName?: string;
}

const DoctorScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    available_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    max_appointments: 8,
    location: 'Main Office',
    notes: '',
    is_available: true
  });

  // Edit schedule form state
  const [editSchedule, setEditSchedule] = useState({
    start_time: '',
    end_time: '',
    max_appointments: 0,
    location: '',
    notes: '',
    is_available: true
  });

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const loadSchedules = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await DoctorManagementService.getMySchedule(user.id);
      // Filter by selected date
      const filteredData = data?.filter(schedule => 
        schedule.available_date.includes(selectedDate)
      ) || [];
      setSchedules(filteredData);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load schedules. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!user?.id) return;

    try {
      await DoctorManagementService.addScheduleSlot(
        user.id,
        newSchedule.available_date,
        newSchedule.start_time,
        newSchedule.end_time
      );

      toast({
        title: "Schedule Created",
        description: "New schedule has been added successfully.",
      });

      await loadSchedules();
      setIsNewScheduleOpen(false);
      
      // Reset form
      setNewSchedule({
        available_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        max_appointments: 8,
        location: 'Main Office',
        notes: '',
        is_available: true
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create schedule.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSchedule = async () => {
    if (!selectedSchedule || !user?.id) return;

    try {
      await DoctorManagementService.updateScheduleSlot(
        selectedSchedule.id,
        selectedSchedule.available_date,
        editSchedule.start_time,
        editSchedule.end_time
      );

      toast({
        title: "Schedule Updated",
        description: "Schedule has been updated successfully.",
      });

      await loadSchedules();
      setIsEditScheduleOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await DoctorManagementService.deleteScheduleSlot(scheduleId);
      
      toast({
        title: "Schedule Deleted",
        description: "Schedule has been removed successfully.",
      });

      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete schedule.",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setEditSchedule({
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_appointments: schedule.max_appointments || 8,
      location: schedule.location || '',
      notes: schedule.notes || '',
      is_available: schedule.is_available ?? true
    });
    setIsEditScheduleOpen(true);
  };

  const generateTimeSlots = (startTime: string, endTime: string, interval: number = 30): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    while (start < end) {
      const timeString = start.toTimeString().substring(0, 5);
      slots.push({
        time: timeString,
        available: Math.random() > 0.3, // Random availability for demo
        booked: Math.random() > 0.7,
        patientName: Math.random() > 0.7 ? 'John Doe' : undefined
      });
      start.setMinutes(start.getMinutes() + interval);
    }
    
    return slots;
  };

  const getWeekDays = (date: string) => {
    const currentDate = new Date(date);
    const week = [];
    
    // Get Monday of current week
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      week.push({
        date: day.toISOString().split('T')[0],
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day.getDate(),
        isToday: day.toDateString() === new Date().toDateString(),
        isSelected: day.toISOString().split('T')[0] === selectedDate
      });
    }
    
    return week;
  };

  const weekDays = getWeekDays(selectedDate);
  const todaySchedules = schedules.filter(s => s.available_date === selectedDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{todaySchedules.length}</p>
                <p className="text-sm text-gray-600">Today's Schedule Blocks</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {todaySchedules.reduce((acc, s) => acc + (s.max_appointments || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Available Slots Today</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {todaySchedules.reduce((acc, s) => acc + (s.current_appointments || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Booked Appointments</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Schedule Management</CardTitle>
          <Button onClick={() => setIsNewScheduleOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily View</TabsTrigger>
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4 mt-6">
              {/* Date Selector */}
              <div className="flex items-center space-x-4 mb-6">
                <Label>Select Date:</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>

              {/* Schedule Blocks for Selected Date */}
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No schedules found for this date.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsNewScheduleOpen(true)}
                  >
                    Create Schedule
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySchedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold">
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                          
                          {schedule.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{schedule.location}</span>
                            </div>
                          )}
                          
                          <Badge className={
                            schedule.is_available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }>
                            {schedule.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Max Appointments:</strong> {schedule.max_appointments || 'Not set'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Current Bookings:</strong> {schedule.current_appointments || 0}
                          </p>
                          {schedule.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Notes:</strong> {schedule.notes}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Time Slots:</p>
                          <div className="grid grid-cols-4 gap-1">
                            {generateTimeSlots(schedule.start_time, schedule.end_time).slice(0, 8).map((slot) => (
                              <div
                                key={slot.time}
                                className={`text-xs p-1 rounded text-center ${
                                  slot.booked 
                                    ? 'bg-red-100 text-red-800' 
                                    : slot.available 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {slot.time}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-6">
              {/* Weekly Calendar */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      day.isSelected
                        ? 'bg-blue-500 text-white border-blue-500'
                        : day.isToday
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{day.day}</div>
                    <div className="text-sm">{day.dayNumber}</div>
                  </button>
                ))}
              </div>

              {/* Weekly Schedule Overview */}
              <div className="space-y-2">
                {weekDays.map((day) => {
                  const daySchedules = schedules.filter(s => s.available_date === day.date);
                  
                  return (
                    <div key={day.date} className="flex items-center space-x-4 p-3 border rounded">
                      <div className="w-20 text-sm font-medium">
                        {day.day} {day.dayNumber}
                      </div>
                      
                      <div className="flex-1">
                        {daySchedules.length === 0 ? (
                          <span className="text-gray-500 text-sm">No schedule</span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {daySchedules.map((schedule) => (
                              <Badge
                                key={schedule.id}
                                className={
                                  schedule.is_available 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {schedule.start_time} - {schedule.end_time}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDate(day.date);
                          setNewSchedule({
                            ...newSchedule,
                            available_date: day.date
                          });
                          setIsNewScheduleOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Schedule Dialog */}
      <Dialog open={isNewScheduleOpen} onOpenChange={setIsNewScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Add a new schedule block for your availability
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newSchedule.available_date}
                onChange={(e) => setNewSchedule({...newSchedule, available_date: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_appointments">Max Appointments</Label>
                <Input
                  id="max_appointments"
                  type="number"
                  min="1"
                  value={newSchedule.max_appointments}
                  onChange={(e) => setNewSchedule({...newSchedule, max_appointments: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})}
                  placeholder="e.g., Main Office, Room 101"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={newSchedule.notes}
                onChange={(e) => setNewSchedule({...newSchedule, notes: e.target.value})}
                placeholder="Any special notes or instructions"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_available"
                checked={newSchedule.is_available}
                onCheckedChange={(checked) => setNewSchedule({...newSchedule, is_available: checked as boolean})}
              />
              <Label htmlFor="is_available">Available for appointments</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewScheduleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule}>
                Create Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update schedule details for {selectedSchedule?.available_date}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_start_time">Start Time</Label>
                <Input
                  id="edit_start_time"
                  type="time"
                  value={editSchedule.start_time}
                  onChange={(e) => setEditSchedule({...editSchedule, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_end_time">End Time</Label>
                <Input
                  id="edit_end_time"
                  type="time"
                  value={editSchedule.end_time}
                  onChange={(e) => setEditSchedule({...editSchedule, end_time: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_max_appointments">Max Appointments</Label>
                <Input
                  id="edit_max_appointments"
                  type="number"
                  min="1"
                  value={editSchedule.max_appointments}
                  onChange={(e) => setEditSchedule({...editSchedule, max_appointments: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="edit_location">Location</Label>
                <Input
                  id="edit_location"
                  value={editSchedule.location}
                  onChange={(e) => setEditSchedule({...editSchedule, location: e.target.value})}
                  placeholder="e.g., Main Office, Room 101"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_notes">Notes (Optional)</Label>
              <Input
                id="edit_notes"
                value={editSchedule.notes}
                onChange={(e) => setEditSchedule({...editSchedule, notes: e.target.value})}
                placeholder="Any special notes or instructions"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_available"
                checked={editSchedule.is_available}
                onCheckedChange={(checked) => setEditSchedule({...editSchedule, is_available: checked as boolean})}
              />
              <Label htmlFor="edit_is_available">Available for appointments</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditScheduleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSchedule}>
                Update Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorScheduleManagement;