// Merged from folder1 and folder2 - Combined all features
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireDoctor, RequireAuth, RequirePatient, RequireStaff, RequireAdmin } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import ServicesMarketplace from "./pages/ServicesMarketplace";
import BookAppointment from "./pages/BookAppointment";
import EnhancedBookAppointment from "./pages/EnhancedBookAppointment";
import PatientDashboardComplete from "./pages/PatientDashboardComplete";
import PatientDashboardEnhanced from "./pages/PatientDashboardEnhanced";
import PatientBookingPage from "./pages/PatientBookingPage";
import MendozaPatientPortal from "./pages/MendozaPatientPortal";
import DebugDashboard from "./pages/DebugDashboard";
import DevDebugRPCs from './pages/DevDebugRPCs';
import Package from "./pages/Package";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StaffDashboard from "./pages/StaffDashboardEnhanced";
import StaffPortalWrapper from "./components/StaffPortalWrapper";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorPortal from "./pages/DoctorPortal";
import UserSyncTool from "./pages/UserSyncTool";
import UpdateRecord from "./pages/UpdateRecord";
import ProcessPayment from "./pages/ProcessPayment";
import ManageAppointment from "./pages/ManageAppointment";
// from folder1 - AdminDashboard and video call features
import AdminDashboard from "./pages/AdminDashboard";
import DoctorStartCall from "./pages/DoctorStartCall";
import PatientJoinCall from "./pages/PatientJoinCall";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VideoCallPage from "./pages/VideoCallPage";
// from folder2 - Enhanced staff navigation
import { StaffNavigationProvider } from "./contexts/StaffNavigationContext";
import { WithStaffReturn, EmergencyStaffReturn } from "./components/StaffNavigationGuard";
import SimpleStaffDashboard from "./pages/SimpleStaffDashboard";
import PaymentSuccessNew from "./pages/PaymentSuccessNew";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          {/* Enhanced staff navigation from folder2 */}
          <StaffNavigationProvider>
            <Routes>
              <Route path="/" element={<WithStaffReturn><Index /></WithStaffReturn>} />
              <Route path="/services" element={<WithStaffReturn><ServicesMarketplace /></WithStaffReturn>} />
              <Route path="/book-appointment" element={<WithStaffReturn><EnhancedBookAppointment /></WithStaffReturn>} />
              <Route path="/package" element={<WithStaffReturn><Package /></WithStaffReturn>} />
              <Route path="/profile" element={<RequireAuth><WithStaffReturn><Profile /></WithStaffReturn></RequireAuth>} />
              <Route path="/profile/edit" element={<RequireAuth><WithStaffReturn><ProfileEdit /></WithStaffReturn></RequireAuth>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<RequirePatient><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequirePatient>} />
              <Route path="/patient-dashboard" element={<RequirePatient><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequirePatient>} />
              <Route path="/patient/portal" element={<RequirePatient><WithStaffReturn><MendozaPatientPortal /></WithStaffReturn></RequirePatient>} />
              <Route path="/patient/book-appointment" element={<RequireAuth><WithStaffReturn><BookAppointment /></WithStaffReturn></RequireAuth>} />
              <Route path="/book-appointment" element={<RequireAuth><WithStaffReturn><PatientBookingPage /></WithStaffReturn></RequireAuth>} />
              <Route path="/patient/dashboard" element={<RequirePatient><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequirePatient>} />
              <Route path="/patient/dashboard-complete" element={<RequirePatient><WithStaffReturn><PatientDashboardComplete /></WithStaffReturn></RequirePatient>} />
              <Route path="/debug" element={<WithStaffReturn><DebugDashboard /></WithStaffReturn>} />
              <Route path="/dev-debug" element={<WithStaffReturn><DevDebugRPCs /></WithStaffReturn>} />
              <Route path="/staff-dashboard" element={<RequireStaff><StaffPortalWrapper /></RequireStaff>} />
              {/* from folder2 - Simple staff dashboard */}
              <Route path="/staff/dashboard" element={<RequireStaff><SimpleStaffDashboard /></RequireStaff>} />
              <Route path="/staff/patient-records" element={<RequireStaff><StaffPortalWrapper /></RequireStaff>} />
              <Route path="/staff-portal" element={<RequireStaff><StaffPortalWrapper /></RequireStaff>} />
              <Route path="/staff/*" element={<RequireStaff><StaffPortalWrapper /></RequireStaff>} />
              <Route path="/doctor-dashboard" element={<RequireDoctor><WithStaffReturn><DoctorDashboard /></WithStaffReturn></RequireDoctor>} />
              <Route path="/doctor-portal" element={<RequireDoctor><WithStaffReturn><DoctorPortal /></WithStaffReturn></RequireDoctor>} />
              <Route path="/doctor/*" element={<RequireDoctor><WithStaffReturn><DoctorPortal /></WithStaffReturn></RequireDoctor>} />
              {/* from folder1 - AdminDashboard */}
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/sync-users" element={<RequireAdmin><WithStaffReturn><UserSyncTool /></WithStaffReturn></RequireAdmin>} />
              <Route path="/update-record" element={<RequireStaff><WithStaffReturn><UpdateRecord /></WithStaffReturn></RequireStaff>} />
              <Route path="/process-payment" element={<RequireStaff><WithStaffReturn><ProcessPayment /></WithStaffReturn></RequireStaff>} />
              <Route path="/manage-appointment" element={<RequireStaff><WithStaffReturn><ManageAppointment /></WithStaffReturn></RequireStaff>} />
              <Route path="/manage-appointment/:appointmentId" element={<RequireStaff><WithStaffReturn><ManageAppointment /></WithStaffReturn></RequireStaff>} />
              <Route path="/payment-success" element={<RequireAuth><WithStaffReturn><PaymentSuccess /></WithStaffReturn></RequireAuth>} />
              {/* from folder2 - Enhanced payment success */}
              <Route path="/payment-success-new" element={<RequireAuth><WithStaffReturn><PaymentSuccessNew /></WithStaffReturn></RequireAuth>} />
              <Route path="/payment-failed" element={<RequireAuth><WithStaffReturn><PaymentFailed /></WithStaffReturn></RequireAuth>} />
              <Route path="/video-call/:meetingId" element={<RequireAuth><WithStaffReturn><VideoCallPage /></WithStaffReturn></RequireAuth>} />
              <Route path="/video-call" element={<RequireAuth><WithStaffReturn><VideoCallPage /></WithStaffReturn></RequireAuth>} />
              {/* from folder1 - Doctor-only protected route for starting a call */}
              <Route path="/doctor/start-call" element={<RequireDoctor><WithStaffReturn><DoctorStartCall /></WithStaffReturn></RequireDoctor>} />
              {/* from folder1 - Patient join call */}
              <Route path="/join-call" element={<RequireAuth><WithStaffReturn><PatientJoinCall /></WithStaffReturn></RequireAuth>} />
              <Route path="/medical-record/:recordId" element={<RequireAuth><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequireAuth>} />
              <Route path="/health-metrics-history" element={<RequireAuth><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequireAuth>} />
              <Route path="/prescription/:prescriptionId" element={<RequireAuth><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequireAuth>} />
              <Route path="/payment-details/:paymentId" element={<RequireAuth><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequireAuth>} />
              <Route path="/lab-test/:testId" element={<RequireAuth><WithStaffReturn><PatientDashboardEnhanced /></WithStaffReturn></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<WithStaffReturn><NotFound /></WithStaffReturn>} />
            </Routes>
            {/* Emergency Staff Return Button from folder2 */}
            <EmergencyStaffReturn />
          </StaffNavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
