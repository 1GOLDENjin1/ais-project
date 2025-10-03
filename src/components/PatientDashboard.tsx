import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Heart, Calendar, MapPin, Phone, Plus, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rlsDataService } from "@/lib/rls-data-service";
import type { PatientAppointmentView, PatientDashboardSummary, AvailableDoctorView, CreateHealthMetricInput, CreateAppointmentInput } from "@/types/rls-types";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingAppointments, setUpcomingAppointments] = useState<PatientAppointmentView[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<{[key: string]: {name: string, specialty: string}}>({});
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctorView[]>([]);
  const [isBookingAppointment, setIsBookingAppointment] = useState(false);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    appointment_type: 'consultation',
    consultation_type: 'in-person',
    reason: '',
    duration_minutes: 30,
    fee: 0,
    notes: ''
  });
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({
    metric_type: 'blood-pressure',
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
      // Load available doctors for appointment booking
      console.log('Loading doctors for patient dashboard...');
      const doctors = await rlsDataService.getPublicDoctors();
      console.log('Loaded doctors:', doctors);
      console.log('Number of doctors loaded:', doctors?.length || 0);
      
      if (doctors && doctors.length > 0) {
        console.log('Sample doctor data:', doctors[0]);
      } else {
        console.warn('No doctors loaded! Check database and user roles.');
      }
      
      setAvailableDoctors(doctors || []);
      
      // Load upcoming appointments using RLS service
      const appointments = await rlsDataService.getPatientAppointments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = appointments.filter(app => {
        const appointmentDate = new Date(app.appointment_date);
        return appointmentDate >= today && (app.status === 'confirmed' || app.status === 'pending');
      }).slice(0, 2);
      setUpcomingAppointments(upcoming);

      // Load health metrics (using RLS service - will need to create method)
      try {
        // Note: RLS service doesn't have getHealthMetrics yet - will create placeholder
        setHealthMetrics([]);
      } catch (error) {
        console.error('Health metrics not yet implemented in RLS service:', error);
        setHealthMetrics([]);
      }

      // Load notifications using RLS service
      const userNotifications = await rlsDataService.getUserNotifications();
      setNotifications(userNotifications.filter((n: any) => !n.is_read).slice(0, 3) || []);

      // Doctor info is already included in PatientAppointmentView
      const doctorData: {[key: string]: {name: string, specialty: string}} = {};
      for (const appointment of upcoming) {
        doctorData[appointment.doctor_id] = {
          name: appointment.doctor_name,
          specialty: appointment.doctor_specialty
        };
      }
      setDoctorInfo(doctorData);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const getLatestMetricValue = (metricType: string) => {
    const metric = healthMetrics
      .filter((m: any) => m.metric_type === metricType)
      .sort((a: any, b: any) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime())[0];
    return metric ? metric.value : 'N/A';
  };

  const handleAddMetric = async () => {
    try {
      // TODO: Implement health metrics with RLS service
      toast({
        title: "Feature Coming Soon",
        description: "Health metrics functionality will be available soon.",
        variant: "default",
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
    } catch (error) {
      console.error('Error adding health metric:', error);
      toast({
        title: "Error",
        description: "Failed to add health metric",
        variant: "destructive",
      });
    }
  };

  const handleBookAppointment = async () => {
    setIsSubmittingAppointment(true);
    try {
      if (!appointmentData.doctor_id || !appointmentData.appointment_date || !appointmentData.appointment_time) {
        toast({
          title: "Incomplete Information",
          description: "Please select a doctor, date, and time for your appointment.",
          variant: "destructive",
        });
        return;
      }

      // Validate appointment date is not in the past
      const appointmentDateTime = new Date(`${appointmentData.appointment_date}T${appointmentData.appointment_time}`);
      if (appointmentDateTime < new Date()) {
        toast({
          title: "Invalid Date/Time",
          description: "Please select a future date and time for your appointment.",
          variant: "destructive", 
        });
        return;
      }

      // Get selected doctor for fee calculation
      const selectedDoctor = availableDoctors.find(d => d.doctor_id === appointmentData.doctor_id);

      // Create appointment using RLS service
      const appointmentInput: CreateAppointmentInput = {
        doctor_id: appointmentData.doctor_id,
        service_type: appointmentData.reason || 'General consultation',
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        reason: appointmentData.reason
      };

      const result = await rlsDataService.createAppointment(appointmentInput);

      if (result.success) {
        toast({
          title: "Appointment Booked Successfully! 🎉",
          description: `Your appointment with Dr. ${selectedDoctor?.doctor_name} is confirmed.`,
        });

        // Reset form
        setAppointmentData({
          doctor_id: '',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '',
          appointment_type: 'consultation',
          consultation_type: 'in-person',
          reason: '',
          duration_minutes: 30,
          fee: 0,
          notes: ''
        });
        setIsBookingAppointment(false);

        // Reload data to show new appointment
        loadPatientData();
      } else {
        throw new Error(result.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAppointment(false);
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
                            onValueChange={(value: string) => 
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
                              <SelectItem key="metric-blood-pressure" value="blood-pressure">Blood Pressure</SelectItem>
                              <SelectItem key="metric-heart-rate" value="heart-rate">Heart Rate</SelectItem>
                              <SelectItem key="metric-weight" value="weight">Weight</SelectItem>
                              <SelectItem key="metric-height" value="height">Height</SelectItem>
                              <SelectItem key="metric-bmi" value="bmi">BMI</SelectItem>
                              <SelectItem key="metric-temperature" value="temperature">Temperature</SelectItem>
                              <SelectItem key="metric-blood-sugar" value="blood-sugar">Blood Sugar</SelectItem>
                              <SelectItem key="metric-cholesterol" value="cholesterol">Cholesterol</SelectItem>
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
                    <div key={`health-metric-${metric.label}-${index}`} className="border border-border rounded-lg p-4 space-y-2">
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
                    <div key={`notification-${notification.id}`} className="border border-border rounded-lg p-3 space-y-1">
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
                <Dialog open={isBookingAppointment} onOpenChange={setIsBookingAppointment}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Book New Appointment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="doctor_select">Select Doctor</Label>
                        <Select value={appointmentData.doctor_id} onValueChange={(value) => {
                          const selectedDoctor = availableDoctors.find(d => d.id === value);
                          setAppointmentData(prev => ({ 
                            ...prev, 
                            doctor_id: value,
                            fee: selectedDoctor?.consultation_fee || 0
                          }))
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a doctor" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {availableDoctors.length > 0 ? (
                              availableDoctors.map((doctor) => (
                                <SelectItem key={`select-doctor-${doctor.doctor_id || doctor.id}`} value={doctor.doctor_id || doctor.id} className="py-3">
                                  <div className="space-y-1">
                                    <p className="font-medium text-foreground">Dr. {doctor.doctor_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {doctor.specialty} • {doctor.years_experience || 0} years exp.
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-primary font-medium">
                                        ₱{doctor.consultation_fee || 0} consultation fee
                                      </p>
                                      <div className="flex items-center text-xs text-muted-foreground">
                                        ⭐ {doctor.rating?.toFixed(1) || '0.0'} 
                                        ({doctor.total_ratings || 0} reviews)
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem key="no-doctors" value="" disabled className="text-center py-4">
                                <div className="text-muted-foreground">
                                  <p>No doctors available</p>
                                  <p className="text-xs">Please check with admin</p>
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {appointmentData.doctor_id && (
                          <div className="p-3 bg-muted/30 rounded-lg text-sm">
                            <p className="font-medium">Selected Doctor Info:</p>
                            {(() => {
                              const selectedDoctor = availableDoctors.find(d => d.id === appointmentData.doctor_id);
                              return selectedDoctor ? (
                                <div className="mt-1 text-muted-foreground">
                                  <p>Dr. {selectedDoctor.doctor_name} - {selectedDoctor.specialty}</p>
                                  <p>Consultation Fee: ₱{selectedDoctor.consultation_fee || 0}</p>
                                  <p>Experience: {selectedDoctor.years_experience || 0} years</p>
                                </div>
                              ) : null;
                            })()} 
                          </div>
                        )}
                        
                        {/* Debug info - Remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                            <p><strong>Debug:</strong> {availableDoctors.length} doctors loaded</p>
                            {availableDoctors.length > 0 && (
                              <p>Sample: Dr. {availableDoctors[0].name} ({availableDoctors[0].specialty})</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="appointment_date">Date</Label>
                          <Input
                            id="appointment_date"
                            type="date"
                            value={appointmentData.appointment_date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setAppointmentData(prev => ({ 
                              ...prev, appointment_date: e.target.value 
                            }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="appointment_time">Time</Label>
                          <Select value={appointmentData.appointment_time} onValueChange={(value) => 
                            setAppointmentData(prev => ({ ...prev, appointment_time: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="time-0900" value="09:00:00">9:00 AM</SelectItem>
                              <SelectItem key="time-0930" value="09:30:00">9:30 AM</SelectItem>
                              <SelectItem key="time-1000" value="10:00:00">10:00 AM</SelectItem>
                              <SelectItem key="time-1030" value="10:30:00">10:30 AM</SelectItem>
                              <SelectItem key="time-1100" value="11:00:00">11:00 AM</SelectItem>
                              <SelectItem key="time-1130" value="11:30:00">11:30 AM</SelectItem>
                              <SelectItem key="time-1400" value="14:00:00">2:00 PM</SelectItem>
                              <SelectItem key="time-1430" value="14:30:00">2:30 PM</SelectItem>
                              <SelectItem key="time-1500" value="15:00:00">3:00 PM</SelectItem>
                              <SelectItem key="time-1530" value="15:30:00">3:30 PM</SelectItem>
                              <SelectItem key="time-1600" value="16:00:00">4:00 PM</SelectItem>
                              <SelectItem key="time-1630" value="16:30:00">4:30 PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="appointment_type">Appointment Type</Label>
                          <Select value={appointmentData.appointment_type} onValueChange={(value: string) => 
                            setAppointmentData(prev => ({ ...prev, appointment_type: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="appt-consultation" value="consultation">Consultation</SelectItem>
                              <SelectItem key="appt-follow-up" value="follow-up">Follow-up</SelectItem>
                              <SelectItem key="appt-check-up" value="check-up">Check-up</SelectItem>
                              <SelectItem key="appt-emergency" value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="consultation_type">Consultation Type</Label>
                          <Select value={appointmentData.consultation_type} onValueChange={(value: string) => 
                            setAppointmentData(prev => ({ ...prev, consultation_type: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="consult-in-person" value="in-person">In-Person</SelectItem>
                              <SelectItem key="consult-video-call" value="video-call">Video Call</SelectItem>
                              <SelectItem key="consult-phone" value="phone">Phone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                        <Select value={appointmentData.duration_minutes.toString()} onValueChange={(value) => 
                          setAppointmentData(prev => ({ ...prev, duration_minutes: parseInt(value) }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="duration-15" value="15">15 minutes</SelectItem>
                            <SelectItem key="duration-30" value="30">30 minutes</SelectItem>
                            <SelectItem key="duration-45" value="45">45 minutes</SelectItem>
                            <SelectItem key="duration-60" value="60">1 hour</SelectItem>
                            <SelectItem key="duration-90" value="90">1.5 hours</SelectItem>
                            <SelectItem key="duration-120" value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Visit</Label>
                        <Input
                          id="reason"
                          value={appointmentData.reason}
                          onChange={(e) => setAppointmentData(prev => ({ 
                            ...prev, reason: e.target.value 
                          }))}
                          placeholder="Brief description of your concern"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={appointmentData.notes}
                          onChange={(e) => setAppointmentData(prev => ({ 
                            ...prev, notes: e.target.value 
                          }))}
                          placeholder="Any additional information"
                          rows={3}
                        />
                      </div>

                      {/* Appointment Summary */}
                      {appointmentData.doctor_id && appointmentData.appointment_date && appointmentData.appointment_time && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                          <h4 className="font-semibold text-foreground">Appointment Summary</h4>
                          {(() => {
                            const selectedDoctor = availableDoctors.find(d => d.id === appointmentData.doctor_id);
                            return selectedDoctor ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="font-medium text-muted-foreground">Doctor</p>
                                  <p className="text-foreground">Dr. {selectedDoctor.doctor_name}</p>
                                  <p className="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground">Date & Time</p>
                                  <p className="text-foreground">
                                    {new Date(appointmentData.appointment_date).toLocaleDateString('en-US', { 
                                      weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(`2000-01-01T${appointmentData.appointment_time}`).toLocaleTimeString('en-US', {
                                      hour: 'numeric', minute: '2-digit', hour12: true
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground">Type</p>
                                  <p className="text-foreground capitalize">{appointmentData.appointment_type}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{appointmentData.consultation_type.replace('-', ' ')}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground">Duration & Fee</p>
                                  <p className="text-foreground">{appointmentData.duration_minutes} minutes</p>
                                  <p className="text-lg font-bold text-primary">₱{selectedDoctor.consultation_fee || 0}</p>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleBookAppointment} 
                          disabled={isSubmittingAppointment}
                          className="flex-1"
                        >
                          {isSubmittingAppointment ? (
                            <>
                              <Activity className="h-4 w-4 mr-2 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Book Appointment
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsBookingAppointment(false)}
                          disabled={isSubmittingAppointment}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/profile')}
                >
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