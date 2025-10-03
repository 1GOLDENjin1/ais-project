import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, FileText, Stethoscope, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/db";
import type { Appointment } from "../lib/db";

const DoctorDashboard = () => { 
  const { user } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [weeklyAppointments, setWeeklyAppointments] = useState<number>(0);
  const [pendingTasks, setPendingTasks] = useState<number>(0);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      // Get doctor record
      const doctor = db.getDoctorByUserId(user.id);
      if (doctor) {
        // Load today's appointments
        const appointments = db.getTodayAppointmentsByDoctorId(doctor.id);
        setTodayAppointments(appointments);

        // Calculate weekly appointments (mock for now)
        const allAppointments = db.getAppointmentsByDoctorId(doctor.id);
        const thisWeek = allAppointments.filter(app => {
          const appDate = new Date(app.appointmentDate);
          const today = new Date();
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return appDate >= weekAgo && appDate <= today;
        });
        setWeeklyAppointments(thisWeek.length);

        // Get pending tasks count (mock for now)
        setPendingTasks(6);
      }
    }
  }, [user]);

  const getPatientName = (patientId: string) => {
    const patient = db.getPatientById(patientId);
    if (patient) {
      const user = db.getUserById(patient.userId);
      return user?.name || 'Unknown Patient';
    }
    return 'Unknown Patient';
  };

  const getPatientInitials = (patientId: string) => {
    const name = getPatientName(patientId);
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const recentTests = [
    { id: 1, patient: "Alice Brown", test: "Blood Test", result: "Normal", date: "Today" },
    { id: 2, patient: "Bob Davis", test: "X-Ray", result: "Reviewed", date: "Yesterday" },
    { id: 3, patient: "Carol White", test: "MRI", result: "Pending", date: "2 days ago" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'default';
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Normal': return 'default';
      case 'Reviewed': return 'default';
      case 'Pending': return 'secondary';
      case 'Abnormal': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar || "/lovable-uploads/95acf376-10b9-4fad-927e-89c2971dd7be.png"} />
              <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('') || 'DR'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{user?.name || 'Doctor'}</h1>
              <p className="text-muted-foreground">Internal Medicine Specialist</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Patients</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayAppointments.filter(a => a.status === 'completed').length} completed, {' '}
                {todayAppointments.filter(a => a.status !== 'completed').length} remaining
              </p>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{weeklyAppointments}</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground">Lab results & reports</p>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">4.8</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <span>Today's Appointments</span>
              </CardTitle>
              <CardDescription>
                Your scheduled consultations for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{getPatientInitials(appointment.patientId)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{getPatientName(appointment.patientId)}</p>
                          <p className="text-sm text-muted-foreground">{appointment.appointmentType || 'Consultation'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {new Date(appointment.appointmentDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No appointments scheduled for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Test Results */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Recent Test Results</span>
              </CardTitle>
              <CardDescription>
                Latest lab results and diagnostic reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-foreground">{test.patient}</p>
                          <p className="text-sm text-muted-foreground">{test.test} • {test.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={getResultColor(test.result)}>
                        {test.result}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="medical-card mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and tools for medical professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="medical" className="h-16 flex-col space-y-2">
                <Calendar className="h-6 w-6" />
                <span>Schedule</span>
              </Button>
              <Button variant="healing" className="h-16 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span>Prescriptions</span>
              </Button>
              <Button variant="trust" className="h-16 flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span>Patient Records</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-2">
                <Clock className="h-6 w-6" />
                <span>Time Tracking</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorDashboard;