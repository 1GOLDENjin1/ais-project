import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, Heart, Calendar, MapPin, Phone, Plus, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db, HealthMetric, Appointment, Notification, Patient, Doctor } from "@/lib/db/supabase-service";

const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<{[key: string]: {name: string, specialty: string}}>({});
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({
    metric_type: 'blood-pressure' as HealthMetric['metric_type'],
    value: '',
    unit: 'mmHg',
    recorded_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (user && user.role === 'patient') {
      loadPatientData();
    }
  }, [user]);

  const loadPatientData = async () => {
    try {
      const patient = await db.getPatientByUserId(user!.id);
      if (patient) {
        // Load upcoming appointments
        const appointments = await db.getAppointmentsByPatientId(patient.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = appointments.filter(app => {
          const appointmentDate = new Date(app.appointment_date);
          return appointmentDate >= today && (app.status === 'confirmed' || app.status === 'pending');
        }).slice(0, 2);
        setUpcomingAppointments(upcoming);

        // Load health metrics
        const metrics = await db.getHealthMetricsByPatientId(patient.id);
        setHealthMetrics(metrics || []);

        // Load notifications
        const userNotifications = await db.getNotificationsByUserId(user!.id);
        setNotifications(userNotifications.filter(n => !n.is_read).slice(0, 3) || []);

        // Load doctor information for appointments
        const doctorData: {[key: string]: {name: string, specialty: string}} = {};
        for (const appointment of upcoming) {
          try {
            const doctor = await db.getDoctorById(appointment.doctor_id);
            if (doctor) {
              const doctorUser = await db.getUserById(doctor.user_id);
              if (doctorUser) {
                doctorData[appointment.doctor_id] = {
                  name: doctorUser.name,
                  specialty: doctor.specialty
                };
              }
            }
          } catch (error) {
            console.error('Error loading doctor info:', error);
            doctorData[appointment.doctor_id] = {
              name: 'Dr. Unknown',
              specialty: 'General'
            };
          }
        }
        setDoctorInfo(doctorData);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const getLatestMetricValue = (metricType: HealthMetric['metric_type']) => {
    const metric = healthMetrics
      .filter(m => m.metric_type === metricType)
      .sort((a, b) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime())[0];
    return metric ? metric.value : 'N/A';
  };

  const handleAddMetric = async () => {
    try {
      const patient = await db.getPatientByUserId(user!.id);
      if (!patient) {
        toast({
          title: "Error",
          description: "Patient record not found",
          variant: "destructive",
        });
        return;
      }

      const metricData = {
        patient_id: patient.id,
        ...newMetric,
        recorded_by: 'patient' as const
      };

      await db.createHealthMetric(metricData);
      
      toast({
        title: "Success",
        description: "Health metric added successfully",
      });

      // Reset form
      setNewMetric({
        metric_type: 'blood-pressure',
        value: '',
        unit: 'mmHg',
        recorded_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setIsAddingMetric(false);

      // Reload data
      loadPatientData();
    } catch (error) {
      console.error('Error adding health metric:', error);
      toast({
        title: "Error",
        description: "Failed to add health metric",
        variant: "destructive",
      });
    }
  };

  const getMetricUnit = (metricType: string) => {
    const units: {[key: string]: string} = {
      'blood-pressure': 'mmHg',
      'heart-rate': 'bpm',
      'weight': 'kg',
      'height': 'cm',
      'bmi': '',
      'temperature': '°C',
      'blood-sugar': 'mg/dL',
      'cholesterol': 'mg/dL'
    };
    return units[metricType] || '';
  };

  const formatAppointmentDate = (date: string, time: string) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    let dateStr = '';
    if (appointmentDate.getTime() === today.getTime()) {
      dateStr = 'Today';
    } else if (appointmentDate.getTime() === tomorrow.getTime()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = appointmentDate.toLocaleDateString();
    }
    
    return `${dateStr}, ${time}`;
  };

  const displayHealthMetrics = [
    { 
      label: "Blood Pressure", 
      value: getLatestMetricValue('blood-pressure'), 
      status: "normal", 
      icon: Activity 
    },
    { 
      label: "Heart Rate", 
      value: getLatestMetricValue('heart-rate') + (getLatestMetricValue('heart-rate') !== 'N/A' ? ' bpm' : ''), 
      status: "normal", 
      icon: Heart 
    },
    { 
      label: "Weight", 
      value: getLatestMetricValue('weight') + (getLatestMetricValue('weight') !== 'N/A' ? ' kg' : ''), 
      status: "stable", 
      icon: Activity 
    },
    { 
      label: "BMI", 
      value: getLatestMetricValue('bmi'), 
      status: "healthy", 
      icon: Activity 
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-muted-foreground">Here's an overview of your health and upcoming appointments.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="medical-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Upcoming Appointments</span>
                </CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground">
                          {doctorInfo[appointment.doctor_id]?.name || 'Loading...'}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{doctorInfo[appointment.doctor_id]?.specialty || 'General'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatAppointmentDate(appointment.appointment_date, appointment.appointment_time)}
                          </span>
                        </div>
                        {appointment.reason && (
                          <div className="text-xs">
                            <span className="font-medium">Reason:</span> {appointment.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming appointments</p>
                    <p className="text-sm">Book an appointment to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>Health Metrics</span>
                  </div>
                  <Dialog open={isAddingMetric} onOpenChange={setIsAddingMetric}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Metric
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Health Metric</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="metric_type">Metric Type</Label>
                          <Select 
                            value={newMetric.metric_type} 
                            onValueChange={(value: HealthMetric['metric_type']) => 
                              setNewMetric(prev => ({ 
                                ...prev, 
                                metric_type: value,
                                unit: getMetricUnit(value)
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select metric type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blood-pressure">Blood Pressure</SelectItem>
                              <SelectItem value="heart-rate">Heart Rate</SelectItem>
                              <SelectItem value="weight">Weight</SelectItem>
                              <SelectItem value="height">Height</SelectItem>
                              <SelectItem value="bmi">BMI</SelectItem>
                              <SelectItem value="temperature">Temperature</SelectItem>
                              <SelectItem value="blood-sugar">Blood Sugar</SelectItem>
                              <SelectItem value="cholesterol">Cholesterol</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="value">Value</Label>
                            <Input
                              id="value"
                              value={newMetric.value}
                              onChange={(e) => setNewMetric(prev => ({ ...prev, value: e.target.value }))}
                              placeholder="Enter value"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                              id="unit"
                              value={newMetric.unit}
                              onChange={(e) => setNewMetric(prev => ({ ...prev, unit: e.target.value }))}
                              placeholder="Unit"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recorded_date">Date Recorded</Label>
                          <Input
                            id="recorded_date"
                            type="date"
                            value={newMetric.recorded_date}
                            onChange={(e) => setNewMetric(prev => ({ ...prev, recorded_date: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Input
                            id="notes"
                            value={newMetric.notes}
                            onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleAddMetric} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Save Metric
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddingMetric(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>Track your health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {displayHealthMetrics.map((metric, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <metric.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{metric.label}</span>
                      </div>
                      <div className="text-xl font-bold text-foreground">{metric.value}</div>
                      <Badge variant="secondary" className="text-xs">
                        {metric.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="border border-border rounded-lg p-3 space-y-1">
                      <div className="text-sm font-medium">{notification.title}</div>
                      <div className="text-xs text-muted-foreground">{notification.message}</div>
                      <Badge variant="secondary" className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  View Health Records
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientDashboard;