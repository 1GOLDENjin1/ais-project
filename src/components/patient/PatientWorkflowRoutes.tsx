import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PatientMedicalHistory from './PatientMedicalHistory';

const PatientWorkflowRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/medical-history" element={<PatientMedicalHistory />} />
      <Route path="/records" element={<PatientMedicalHistory />} />
      <Route path="/prescriptions" element={<PatientMedicalHistory />} />
      <Route path="/lab-results" element={<PatientMedicalHistory />} />
    </Routes>
  );
};

export default PatientWorkflowRoutes;