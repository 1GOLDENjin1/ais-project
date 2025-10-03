# Well Visit Smart - Merged Healthcare Application

This is a comprehensive healthcare management system created by merging two React project folders. The merged application includes all working features from both source folders.

## 🚀 Features

### From Folder1:
- **PaymentManagement** component for handling financial transactions
- **AdminDashboard** for administrative oversight
- **Video Call Features**: `DoctorStartCall` and `PatientJoinCall` components
- **RouteGuards** with doctor authentication
- Enhanced user activity checking in AuthContext

### From Folder2:
- **Enhanced Staff Navigation** with `StaffNavigationContext` and `StaffNavigationGuard`
- **BackToStaffDashboard** universal navigation component
- **SimpleStaffDashboard** for streamlined staff access
- **StaffPatientRecords** management
- **PaymentSuccessNew** enhanced payment confirmation
- Advanced staff portal navigation with emergency return features
- Video SDK integration with enhanced crypto support

### Common Features (Best of Both):
- Complete healthcare dashboard system
- Patient and doctor management
- Appointment booking and scheduling
- Real-time messaging system
- Payment processing with Paymongo
- Video consultations
- Medical records management
- Prescription tracking
- Lab test management
- Notification system

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, Shadcn/UI
- **State Management**: React Query, Context API
- **Routing**: React Router DOM v6
- **Database**: Supabase
- **Payments**: Paymongo
- **Video**: VideoSDK
- **Authentication**: Custom auth with bcrypt
- **Charts**: Recharts

## 📦 Installation

1. **Clone or navigate to the merged project**:
   ```bash
   cd merged-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy the `.env` file and configure your environment variables for:
   - Supabase configuration
   - Paymongo API keys
   - VideoSDK credentials

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📱 Key Routes

### Patient Routes
- `/` - Homepage
- `/dashboard` - Patient dashboard
- `/book-appointment` - Appointment booking
- `/patient/portal` - Patient portal
- `/payment-success` - Payment confirmation

### Staff Routes  
- `/staff-dashboard` - Enhanced staff dashboard
- `/staff/dashboard` - Simple staff dashboard (from folder2)
- `/staff/patient-records` - Patient records management

### Doctor Routes
- `/doctor-dashboard` - Doctor dashboard
- `/doctor-portal` - Doctor portal  
- `/doctor/start-call` - Start video consultation (protected)

### Admin Routes
- `/admin` - Administrative dashboard (from folder1)
- `/sync-users` - User synchronization tools

### Video Call Routes
- `/video-call/:meetingId` - Video consultation room
- `/join-call` - Patient video call entry (from folder1)

## 🔧 Architecture Highlights

### Navigation System
The app uses a sophisticated navigation system combining:
- **folder2's StaffNavigationProvider**: Ensures staff can always return to dashboard
- **WithStaffReturn wrapper**: Provides consistent navigation across all routes
- **EmergencyStaffReturn**: Emergency navigation button for staff users

### Component Organization
- `src/components/` - Reusable UI components
- `src/pages/` - Page-level components
- `src/contexts/` - React context providers
- `src/services/` - API and business logic
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions

### Key Components Merged
- **From folder1**: PaymentManagement, AdminDashboard, video call components
- **From folder2**: Staff navigation system, enhanced dashboard components
- **Shared**: All UI components, common pages, services

## 🔒 Authentication & Security

- Row Level Security (RLS) with Supabase
- Role-based access control (Patient, Doctor, Staff, Admin)
- Protected routes with authentication guards
- User activity status checking

## 💻 Development Notes

### Comments Added
All merged code includes comments indicating source:
- `// from folder1` - Features unique to first folder
- `// from folder2` - Features unique to second folder
- `// Merged from folder1 and folder2` - Combined features

### Build Status
✅ Successfully compiles and builds
✅ Dev server runs on http://localhost:8081/
✅ All dependencies resolved
✅ TypeScript validation passing

### Warnings Addressed
- Removed duplicate `getDashboardStats` method
- Crypto module properly configured for browser compatibility
- Large bundle size noted (consider code splitting for production)

## 🚀 Deployment

The application is ready for deployment. Key considerations:
- Ensure all environment variables are set
- Configure Supabase database with proper RLS policies  
- Set up Paymongo webhooks for payment processing
- Configure VideoSDK for video consultations

## 📞 Support

This merged application combines the best features from both source folders while maintaining compatibility and adding enhanced navigation features. All unique components and pages have been preserved with proper source attribution.