import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  MessageSquare,
  Star,
  Timer,
  CreditCard,
  ArrowRight,
  Stethoscope,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time: string;
    status: 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending';
    doctor: {
      name: string;
      specialty: string;
      avatar?: string;
    };
    type?: string;
    consultationType?: 'in-person' | 'video-call' | 'phone';
    reason?: string;
    fee?: number;
    duration?: string;
    duration_minutes?: number;
    location?: string;
    notes?: string;
  };
  onJoinCall?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onMessage?: (doctorId: string) => void;
  onViewDetails?: (appointmentId: string) => void;
  variant?: 'compact' | 'detailed';
}

export const EnhancedAppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onJoinCall,
  onReschedule,
  onCancel,
  onMessage,
  onViewDetails,
  variant = 'detailed'
}) => {
  const [isReasonExpanded, setIsReasonExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case 'video-call': return <Video className="h-4 w-4 text-green-600" />;
      case 'phone': return <Phone className="h-4 w-4 text-blue-600" />;
      case 'in-person': return <MapPin className="h-4 w-4 text-purple-600" />;
      default: return <Stethoscope className="h-4 w-4 text-gray-600" />;
    }
  };

  const isUpcoming = () => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    return appointmentDateTime > new Date();
  };

  const canJoinCall = () => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const timeDiff = appointmentDateTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    return appointment.consultationType === 'video-call' && 
           appointment.status === 'confirmed' && 
           minutesDiff <= 15 && minutesDiff >= -60; // 15 mins before to 1 hour after
  };

  if (variant === 'compact') {
    return (
      <Card className="border border-gray-200 hover:shadow-md transition-all duration-200 bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Doctor Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {appointment.doctor?.name ? appointment.doctor.name.split(' ').map(n => n[0]).join('') : 'JDC'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {appointment.doctor?.name || 'Juan Dela Cruz'}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {appointment.doctor?.specialty || 'General Medicine'} • 0
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(appointment.status)} ml-2 flex-shrink-0`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1">{appointment.status}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-gray-700 font-medium mb-3 break-words leading-relaxed">
                    <span className="line-clamp-2">
                      {appointment.reason || 'Digital X-ray appointment | Notes: Regular checkup | Special Requirements: None'}
                    </span>
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {appointment.date ? format(new Date(appointment.date), 'MMM dd, yyyy') : 'Oct 31, 2025'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 ml-5">Date</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{appointment.time || '17:00:00'}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-5">Time</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Timer className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{appointment.duration_minutes || 30} mins</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-5">Duration</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">₱{appointment.fee?.toLocaleString() || '1,500'}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-5">Fee</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    {getConsultationIcon(appointment.consultationType || 'in-person')}
                    <span className="text-sm text-gray-600">
                      {appointment.consultationType === 'video-call' ? 'Video Call' : 
                       appointment.consultationType === 'phone' ? 'Phone Call' : 'In Person Consultation'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">Clinic</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="lg:col-span-1 flex flex-col gap-2 lg:items-end">
              {isUpcoming() && (
                <>
                  {canJoinCall() && (
                    <Button 
                      onClick={() => onJoinCall?.(appointment.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium w-full lg:w-auto"
                      size="sm"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Join Call
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => onMessage?.(appointment.id)}
                    className="border-2 hover:bg-gray-50 w-full lg:w-auto"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Doctor
                  </Button>
                  
                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => onReschedule?.(appointment.id)}
                        className="border-2 hover:bg-blue-50 hover:border-blue-200 w-full lg:w-auto"
                        size="sm"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => onCancel?.(appointment.id)}
                        className="border-2 hover:bg-red-50 hover:border-red-200 text-red-600 hover:text-red-700 w-full lg:w-auto"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => onViewDetails?.(appointment.id)}
                    className="text-sm text-gray-500 hover:text-gray-700 w-full lg:w-auto"
                    size="sm"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white overflow-hidden h-full">
      {/* Status Banner */}
      <div className={`h-1 ${appointment.status === 'confirmed' ? 'bg-green-500' : 
                              appointment.status === 'pending' ? 'bg-yellow-400' :
                              appointment.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'}`} />
      
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex flex-col gap-6 flex-1">
          {/* Header with Doctor Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-white shadow-lg flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-base">
                {appointment.doctor?.name?.split(' ').map(n => n[0]).join('') || 'JDC'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{appointment.doctor?.name || 'Dr. Juan Dela Cruz'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-blue-600 font-medium text-sm">{appointment.doctor?.specialty || 'General Medicine'}</p>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 text-sm">0</span>
                  </div>
                </div>
                <Badge className={`${getStatusColor(appointment.status)} flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full`}>
                  {getStatusIcon(appointment.status)}
                  {appointment.status}
                </Badge>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 font-medium text-sm leading-relaxed break-words">
                  {(() => {
                    const reasonText = appointment.reason || 'Drug Screening Test appointment | Notes: tryyyyyyyyyyyyy | Special Requirements: ytrrr...';
                    if (reasonText.length > 100 && !isReasonExpanded) {
                      return `${reasonText.substring(0, 100)}...`;
                    }
                    return reasonText;
                  })()}
                </p>
                {(() => {
                  const reasonText = appointment.reason || 'Drug Screening Test appointment | Notes: tryyyyyyyyyyyyy | Special Requirements: ytrrr...';
                  if (reasonText.length > 100) {
                    return (
                      <button 
                        className="text-blue-600 text-sm font-medium hover:text-blue-700 mt-2 transition-colors"
                        onClick={() => setIsReasonExpanded(!isReasonExpanded)}
                      >
                        {isReasonExpanded ? 'Show less' : 'Show more'}
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
              
              {/* Appointment Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">DATE</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{appointment.date ? format(new Date(appointment.date), 'MMM dd, yyyy') : 'Oct 11, 2025'}</p>
                </div>
                
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">TIME</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{appointment.time || '15:00:00'}</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">DURATION</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{appointment.duration_minutes ? `${appointment.duration_minutes} mins` : '30 mins'}</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">FEE</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">₱{appointment.fee?.toLocaleString() || '1,500'}</p>
                </div>
              </div>
              
              {/* Consultation Type & Location */}
              <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {appointment.consultationType?.replace('-', ' ') || 'In Person Consultation'}
                  </span>
                </div>
                <span className="text-sm text-blue-600 font-semibold">{appointment.location || 'Clinic'}</span>
              </div>
              
              {appointment.notes && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-yellow-700 uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-yellow-800 break-words leading-relaxed">
                        {appointment.notes.length > 80 && !isNotesExpanded
                          ? `${appointment.notes.substring(0, 80)}...` 
                          : appointment.notes}
                      </p>
                      {appointment.notes.length > 80 && (
                        <button 
                          className="text-yellow-700 text-xs font-medium hover:text-yellow-800 mt-1 transition-colors"
                          onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                        >
                          {isNotesExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions Section */}
          <div className="border-t border-gray-100 pt-4 mt-auto">
            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && isUpcoming() ? (
              <div className="space-y-3">
                {/* Primary Action */}
                {canJoinCall() && (
                  <Button 
                    onClick={() => onJoinCall?.(appointment.id)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg"
                    size="lg"
                  >
                    <Video className="h-5 w-5 mr-2" />
                    Join Video Call Now
                  </Button>
                )}
                
                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => onMessage?.(appointment.id)}
                    className="border border-blue-300 hover:bg-blue-50 text-blue-700 font-medium h-11 rounded-lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => onReschedule?.(appointment.id)}
                    className="border border-orange-300 hover:bg-orange-50 text-orange-700 font-medium h-11 rounded-lg"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                </div>
                
                {/* Cancel Button */}
                <Button 
                  variant="outline" 
                  onClick={() => onCancel?.(appointment.id)}
                  className="w-full border border-red-300 hover:bg-red-50 text-red-700 font-medium h-11 rounded-lg"
                >
                  Cancel Appointment
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  {appointment.status === 'completed' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-medium">Completed</span>
                    </>
                  ) : appointment.status === 'cancelled' ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-600 font-medium">Cancelled</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5" />
                      <span>Past Appointment</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar for upcoming appointments */}
        {isUpcoming() && appointment.status === 'confirmed' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Appointment in:</span>
              <span className="font-medium text-blue-600">
                {(() => {
                  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
                  const now = new Date();
                  const timeDiff = appointmentDateTime.getTime() - now.getTime();
                  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                  const hoursDiff = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  
                  if (daysDiff > 0) return `${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
                  if (hoursDiff > 0) return `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''}`;
                  return 'Less than 1 hour';
                })()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};