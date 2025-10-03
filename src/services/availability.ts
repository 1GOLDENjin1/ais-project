import { rlsDataService } from '@/lib/rls-data-service';

export interface DoctorAvailabilitySlot {
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlots: {
    time: string;
    available: boolean;
    appointmentId?: string;
  }[];
}

export interface ServiceAvailability {
  serviceId: string;
  serviceName: string;
  status: 'available' | 'limited' | 'booked' | 'maintenance';
  availableDoctors: string[];
  nextAvailableDate?: string;
  estimatedWaitTime?: string;
}

class AvailabilityService {
  // Check doctor availability for a specific date
  async getDoctorAvailability(doctorId: string, date: string): Promise<DoctorAvailabilitySlot | null> {
    try {
      // Get existing appointments for this doctor on this date
      const appointments = await rlsDataService.getDoctorAppointments({
        doctor_id: doctorId,
        date_from: date,
        date_to: date
      });

      // Mock schedule - in real app this would come from doctor_schedules table
      const mockSchedule = {
        start_time: '09:00',
        end_time: '17:00',
        doctor_name: `Dr. ${doctorId}` // Simplified
      };

      const timeSlots = this.generateTimeSlots(
        mockSchedule.start_time,
        mockSchedule.end_time,
        appointments.map(apt => ({
          time: apt.appointment_time,
          appointmentId: apt.appointment_id
        }))
      );

      return {
        doctorId,
        doctorName: mockSchedule.doctor_name,
        date,
        timeSlots
      };
    } catch (error) {
      console.error('Error getting doctor availability:', error);
      return null;
    }
  }

  // Generate available time slots
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    bookedSlots: { time: string; appointmentId: string }[]
  ) {
    const slots = [];
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const slotDuration = 30; // 30 minute slots

    const current = new Date(start);
    while (current < end) {
      const timeStr = current.toTimeString().slice(0, 5); // HH:MM format
      const isBooked = bookedSlots.some(slot => slot.time === timeStr);
      
      slots.push({
        time: timeStr,
        available: !isBooked,
        appointmentId: isBooked ? bookedSlots.find(slot => slot.time === timeStr)?.appointmentId : undefined
      });

      current.setMinutes(current.getMinutes() + slotDuration);
    }

    return slots;
  }

  // Check service availability considering doctor schedules and appointments
  async getServiceAvailability(serviceId: string): Promise<ServiceAvailability> {
    try {
      // Get all doctors who can provide this service
      const availableDoctors = await rlsDataService.getPublicDoctors();
      // Note: This is simplified - in reality you'd filter by service specialty
      
      // Check today for basic availability
      const today = new Date().toISOString().split('T')[0];
      let hasAvailability = false;
      let nextAvailableDate: string | undefined;

      // Simplified availability check - count total appointments vs total doctors
      const todayAppointments = await rlsDataService.getDoctorAppointments({
        date_from: today,
        date_to: today
      });

      // Assume each doctor can handle 16 appointments per day (30-min slots, 8-hour day)
      const maxDailyAppointments = availableDoctors.length * 16;
      const currentAppointments = todayAppointments.length;
      
      hasAvailability = currentAppointments < maxDailyAppointments;
      nextAvailableDate = today;

      // Determine service status based on capacity
      let status: 'available' | 'limited' | 'booked' | 'maintenance';
      const capacityRatio = currentAppointments / maxDailyAppointments;
      
      if (capacityRatio >= 1.0) {
        status = 'booked';
      } else if (capacityRatio >= 0.8) {
        status = 'limited';
      } else {
        status = 'available';
      }

      return {
        serviceId,
        serviceName: serviceId,
        status,
        availableDoctors: availableDoctors.map(d => d.doctor_id),
        nextAvailableDate,
        estimatedWaitTime: hasAvailability 
          ? (capacityRatio > 0.5 ? '30-60 minutes' : '0-30 minutes')
          : '1-3 days'
      };
    } catch (error) {
      console.error('Error getting service availability:', error);
      return {
        serviceId,
        serviceName: serviceId,
        status: 'available', // Default to available on error
        availableDoctors: []
      };
    }
  }

  // Get next available appointment slot for a service
  async getNextAvailableSlot(serviceId: string, doctorId?: string): Promise<{
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
  } | null> {
    try {
      const doctors = doctorId 
        ? await rlsDataService.getPublicDoctors().then(docs => docs.filter(d => d.doctor_id === doctorId))
        : await rlsDataService.getPublicDoctors();

      if (doctors.length === 0) return null;

      // Check next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        for (const doctor of doctors) {
          const availability = await this.getDoctorAvailability(doctor.doctor_id, dateStr);
          if (availability) {
            const availableSlot = availability.timeSlots.find(slot => slot.available);
            if (availableSlot) {
              return {
                doctorId: doctor.doctor_id,
                doctorName: doctor.doctor_name || `Dr. ${doctor.doctor_id}`,
                date: dateStr,
                time: availableSlot.time
              };
            }
          }
        }
      }

      // If no slots found, return the first available time tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      return {
        doctorId: doctors[0].doctor_id,
        doctorName: doctors[0].doctor_name || `Dr. ${doctors[0].doctor_id}`,
        date: tomorrowStr,
        time: '09:00'
      };
    } catch (error) {
      console.error('Error getting next available slot:', error);
      return null;
    }
  }

  // Real-time availability update
  async refreshServiceAvailability(serviceId: string): Promise<void> {
    // This would be called by real-time subscriptions to update availability
    const availability = await this.getServiceAvailability(serviceId);
    
    // Emit event for UI components to update
    window.dispatchEvent(new CustomEvent('serviceAvailabilityUpdate', {
      detail: { serviceId, availability }
    }));
  }
}

export const availabilityService = new AvailabilityService();