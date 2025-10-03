// ===================================================
// PATIENT VIDEO CONSULTATION - Simple interface for patients
// User-friendly video call interface with appointment info
// ===================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoSDKService } from '@/services/videoSDKService';
import VideoConsultation from './VideoConsultation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Video, 
  Shield, 
  Heart, 
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle
} from 'lucide-react';

interface PatientVideoConsultationProps {
  appointmentId: string;
  patientId: string;
  patientName: string;
}

interface DoctorInfo {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  consultationFee: number;
}

interface AppointmentDetails {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  reason: string;
  status: string;
  fee: number;
}

export default function PatientVideoConsultation({ 
  appointmentId, 
  patientId, 
  patientName 
}: PatientVideoConsultationProps) {
  const [meetingId, setMeetingId] = useState<string>('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [videoCallData, setVideoCallData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingDevice, setTestingDevice] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    camera: false,
    microphone: false,
    speaker: false
  });

  useEffect(() => {
    loadAppointmentData();
    testDevices();
  }, [appointmentId]);

  const loadAppointmentData = async () => {
    try {
      setIsLoading(true);
      
      // Load appointment with doctor details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          service_type,
          reason,
          status,
          fee,
          doctor_id,
          doctors!inner(
            id,
            specialty,
            consultation_fee,
            rating,
            years_experience,
            users!inner(
              name
            )
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      // Set appointment details
      setAppointmentDetails({
        id: appointment.id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        serviceType: appointment.service_type,
        reason: appointment.reason || '',
        status: appointment.status,
        fee: appointment.fee || 0
      });

      // Set doctor info (access first element since it's an array)
      const doctor = Array.isArray(appointment.doctors) ? appointment.doctors[0] : appointment.doctors;
      const doctorUser = Array.isArray(doctor.users) ? doctor.users[0] : doctor.users;
      setDoctorInfo({
        id: doctor.id,
        name: doctorUser.name,
        specialty: doctor.specialty,
        rating: doctor.rating || 0,
        experience: doctor.years_experience || 0,
        consultationFee: doctor.consultation_fee || 0
      });

      // Check for existing video call
      const videoSDKService = VideoSDKService.getInstance();
      const existingVideoCall = await videoSDKService.getVideoCallByAppointment(appointmentId);
      
      if (existingVideoCall) {
        setVideoCallData(existingVideoCall);
        setMeetingId(existingVideoCall.videosdk_meeting_id);
      }

    } catch (error) {
      console.error('Error loading appointment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testDevices = async () => {
    try {
      setTestingDevice(true);
      
      // Test camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setDeviceStatus({
        camera: stream.getVideoTracks().length > 0,
        microphone: stream.getAudioTracks().length > 0,
        speaker: true // We can't really test speakers, so assume they work
      });

      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Device test failed:', error);
      setDeviceStatus({
        camera: false,
        microphone: false,
        speaker: false
      });
    } finally {
      setTestingDevice(false);
    }
  };

  const joinVideoConsultation = async () => {
    try {
      if (videoCallData) {
        setMeetingId(videoCallData.videosdk_meeting_id);
      } else {
        // Create new video call (this should typically be done by the doctor)
        const videoSDKService = VideoSDKService.getInstance();
        const videoCallSession = await videoSDKService.startVideoCallSession({
          appointmentId,
          doctorId: doctorInfo!.id,
          patientId: patientId,
          enableRecording: false
        });

        setMeetingId(videoCallSession.meetingId);
        setVideoCallData(videoCallSession);
      }
      
      setShowVideoCall(true);
    } catch (error) {
      console.error('Error joining video consultation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your appointment...</p>
        </div>
      </div>
    );
  }

  if (showVideoCall && meetingId) {
    return (
      <VideoConsultation
        meetingId={meetingId}
        appointmentId={appointmentId}
        userRole="patient"
        userId={patientId}
        userName={patientName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Consultation
          </h1>
          <p className="text-lg text-gray-600">
            Welcome, {patientName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Appointment & Doctor Info */}
          <div className="space-y-6">
            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Your Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointmentDetails && (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={appointmentDetails.status === 'confirmed' ? 'default' : 'secondary'}
                        className="px-3 py-1"
                      >
                        {appointmentDetails.status?.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500">#{appointmentDetails.id.slice(-8)}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Service:</span>
                        <span className="text-sm">{appointmentDetails.serviceType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Date:</span>
                        <span className="text-sm">
                          {new Date(appointmentDetails.appointmentDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Time:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {appointmentDetails.appointmentTime}
                        </span>
                      </div>
                      {appointmentDetails.reason && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Reason:</span>
                          <p className="text-sm text-gray-600 mt-1">{appointmentDetails.reason}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Consultation Fee:</span>
                        <span className="text-sm font-semibold">₱{appointmentDetails.fee.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Doctor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Your Doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doctorInfo && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl font-bold text-white">
                          {doctorInfo.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {doctorInfo.name}
                      </h3>
                      <p className="text-sm text-gray-600">{doctorInfo.specialty}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-semibold text-gray-900">
                          {doctorInfo.experience}+
                        </div>
                        <div className="text-xs text-gray-600">Years Experience</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-semibold text-gray-900">
                          {doctorInfo.rating.toFixed(1)}⭐
                        </div>
                        <div className="text-xs text-gray-600">Patient Rating</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Device Check & Join */}
          <div className="space-y-6">
            {/* Device Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-600" />
                  Device Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  We're checking your devices to ensure the best video consultation experience.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="text-sm font-medium">Camera</span>
                    </div>
                    <div className="flex items-center">
                      {testingDevice ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      ) : deviceStatus.camera ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm ml-2">
                        {testingDevice ? 'Testing...' : deviceStatus.camera ? 'Ready' : 'Not Available'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="text-sm font-medium">Microphone</span>
                    </div>
                    <div className="flex items-center">
                      {testingDevice ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      ) : deviceStatus.microphone ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm ml-2">
                        {testingDevice ? 'Testing...' : deviceStatus.microphone ? 'Ready' : 'Not Available'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="text-sm font-medium">Speakers</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm ml-2">Ready</span>
                    </div>
                  </div>
                </div>

                {(!deviceStatus.camera || !deviceStatus.microphone) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Some devices are not available. Please check your browser permissions and try refreshing the page.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={testDevices} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={testingDevice}
                >
                  {testingDevice ? 'Testing...' : 'Test Again'}
                </Button>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  Before You Join
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    <span>Find a quiet, well-lit space for your consultation</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    <span>Have your health insurance card and ID ready</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    <span>Prepare any questions or concerns you want to discuss</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                    <span>Keep a list of current medications handy</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join Button */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Start?</h3>
                  <p className="text-sm text-gray-600">
                    Click below when you're ready for your video consultation
                  </p>
                </div>
                
                <Button 
                  onClick={joinVideoConsultation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  size="lg"
                  disabled={appointmentDetails?.status !== 'confirmed'}
                >
                  <Video className="h-5 w-5 mr-2" />
                  Join Video Consultation
                </Button>

                {appointmentDetails?.status !== 'confirmed' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Please wait for your appointment to be confirmed
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardContent className="p-4 text-center">
                <HelpCircle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Need help? Contact our support team for assistance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}