import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  User, 
  Save, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const RescheduleAppointment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get appointment data from navigation state
  const originalAppointment = location.state?.appointment || {
    id: "APT001",
    patient_name: "Juan Dela Cruz",
    service: "General Consultation",
    date: "Oct 31, 2025",
    time: "17:00:00",
    status: "pending" as const,
    patient_phone: "+63 912 345 6789",
    patient_email: "juan.delacruz@email.com",
    notes: "Digital X-ray appointment | Notes: tryyyyyyyyyyyy | Special...",
    fee: 1500
  };

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    reason: '',
    notifyPatient: true
  });

  const [availableSlots] = useState([
    { date: '2025-11-01', time: '09:00', available: true },
    { date: '2025-11-01', time: '10:00', available: false },
    { date: '2025-11-01', time: '11:00', available: true },
    { date: '2025-11-01', time: '14:00', available: true },
    { date: '2025-11-02', time: '09:00', available: true },
    { date: '2025-11-02', time: '10:30', available: true },
    { date: '2025-11-02', time: '15:00', available: false },
    { date: '2025-11-03', time: '08:30', available: true },
    { date: '2025-11-03', time: '16:00', available: true }
  ]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSlotSelect = (date: string, time: string) => {
    setFormData(prev => ({
      ...prev,
      date,
      time
    }));
  };

  const handleReschedule = () => {
    if (!formData.date || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please select a new date and time for the appointment.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Appointment Rescheduled",
      description: `Appointment for ${originalAppointment.patient_name} has been rescheduled to ${formData.date} at ${formData.time}.`,
    });
    
    // Navigate back to dashboard
    navigate('/staff-dashboard');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, Array<{date: string; time: string; available: boolean}>>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/staff-dashboard')}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Reschedule Appointment
              </h1>
              <p className="text-gray-600">Select a new date and time for the appointment</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Current Appointment Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Current Appointment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {originalAppointment.patient_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{originalAppointment.patient_name}</h3>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {originalAppointment.status}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service:</span>
                    <span className="font-medium">{originalAppointment.service}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Date:</span>
                    <span className="font-medium">{originalAppointment.date}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Time:</span>
                    <span className="font-medium">{originalAppointment.time}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fee:</span>
                    <span className="font-medium">₱{originalAppointment.fee}</span>
                  </div>
                </div>

                {formData.date && formData.time && (
                  <>
                    <Separator />
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">New Schedule</span>
                      </div>
                      <p className="text-sm text-green-700">
                        {formatDate(formData.date)} at {formatTime(formData.time)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reschedule Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Available Slots */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Available Time Slots</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Select a new date and time from available slots
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date} className="space-y-3">
                    <h4 className="font-medium text-gray-900">{formatDate(date)}</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {slots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={formData.date === slot.date && formData.time === slot.time ? "default" : "outline"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => slot.available && handleSlotSelect(slot.date, slot.time)}
                          className={`text-xs ${
                            !slot.available ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            formData.date === slot.date && formData.time === slot.time 
                              ? 'bg-blue-600 text-white' 
                              : ''
                          }`}
                        >
                          {formatTime(slot.time)}
                        </Button>
                      ))}
                    </div>
                    <Separator />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Reschedule Details */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Reschedule Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-date">New Date</Label>
                    <Input
                      id="new-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-time">New Time</Label>
                    <Input
                      id="new-time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for rescheduling (optional)..."
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notify"
                    checked={formData.notifyPatient}
                    onChange={(e) => handleInputChange('notifyPatient', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="notify" className="text-sm">
                    Send notification to patient about the schedule change
                  </Label>
                </div>

                {formData.date && formData.time && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-blue-800">Reschedule Summary</h5>
                        <p className="text-sm text-blue-700">
                          The appointment will be moved from <strong>{originalAppointment.date} at {originalAppointment.time}</strong> to{' '}
                          <strong>{formatDate(formData.date)} at {formatTime(formData.time)}</strong>.
                        </p>
                        {formData.notifyPatient && (
                          <p className="text-xs text-blue-600 mt-1">
                            ✓ Patient will be notified via email and SMS
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/staff-dashboard')}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button 
                onClick={handleReschedule}
                disabled={!formData.date || !formData.time}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleAppointment;