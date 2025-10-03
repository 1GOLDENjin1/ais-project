// Example: Updated BookAppointment component using RLS data service
// This shows how to migrate from direct Supabase calls to the new RLS service

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { rlsDataService } from '@/lib/rls-data-service';
import { 
  AvailableDoctorView, 
  AvailableServiceView,
  CreateAppointmentInput,
  ApiResponse 
} from '@/types/rls-types';

const BookAppointmentRLS = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State using new RLS types
  const [doctors, setDoctors] = useState<AvailableDoctorView[]>([]);
  const [services, setServices] = useState<AvailableServiceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  // Load data using RLS service instead of direct Supabase calls
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use RLS service methods instead of direct Supabase queries
      const [doctorsData, servicesData] = await Promise.all([
        rlsDataService.getPublicDoctors(),
        rlsDataService.getAvailableServices()
      ]);
      
      setDoctors(doctorsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors and services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedService || !appointmentDate || !appointmentTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      // Use RLS service for secure appointment creation
      const appointmentData: CreateAppointmentInput = {
        doctor_id: selectedDoctor,
        service_type: selectedService,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason || undefined,
      };

      const result: ApiResponse<any> = await rlsDataService.createAppointment(appointmentData);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Appointment booked successfully!",
        });
        
        // Reset form
        setSelectedDoctor('');
        setSelectedService('');
        setAppointmentDate('');
        setAppointmentTime('');
        setReason('');
      } else {
        toast({
          title: "Booking Failed",
          description: result.error || "Failed to book appointment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>
      
      <div className="space-y-4">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Doctor</label>
          <select 
            value={selectedDoctor} 
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doctor) => (
              <option key={doctor.doctor_id} value={doctor.doctor_id}>
                {doctor.doctor_name} - {doctor.specialty} (₱{doctor.consultation_fee})
              </option>
            ))}
          </select>
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Service</label>
          <select 
            value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Choose a service...</option>
            {services.map((service) => (
              <option key={service.service_id} value={service.service_id}>
                {service.service_name} - {service.category} (₱{service.price})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Appointment Date</label>
          <input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Time Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Appointment Time</label>
          <input
            type="time"
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the reason for your visit..."
            className="w-full p-2 border rounded h-20"
          />
        </div>

        {/* Book Button */}
        <button
          onClick={handleBookAppointment}
          disabled={isBooking}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isBooking ? 'Booking...' : 'Book Appointment'}
        </button>
      </div>
    </div>
  );
};

export default BookAppointmentRLS;