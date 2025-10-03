import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DoctorAppointmentManager from './DoctorAppointmentManager';
import DoctorConsultationInterface from './DoctorConsultationInterface';
import DoctorLabResultsManager from './DoctorLabResultsManager';

const DoctorWorkflowRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/appointments" element={<DoctorAppointmentManager />} />
      <Route path="/consultation/:appointmentId" element={<DoctorConsultationInterface />} />
      <Route path="/lab-results" element={<DoctorLabResultsManager />} />
      <Route path="/medical-record/:appointmentId" element={<DoctorConsultationInterface />} />
    </Routes>
  );
};

export default DoctorWorkflowRoutes;