# HR Attendance Management System Requirements Document

## 1. Application Overview

### 1.1 Application Name
HR Attendance Management System

### 1.2 Application Description
A comprehensive, production-grade HR attendance management application built with React Native (Expo + TypeScript) supporting Android, iOS, and Web platforms. The system provides complete attendance tracking, leave management, team collaboration, document management, and payroll features with role-based access control.

### 1.3 Target Platforms
- Android\n- iOS
- Web\n
## 2. Technical Stack

### 2.1 Core Framework
- React Native with Expo
- TypeScript\n- Expo Router for navigation
\n### 2.2 Key Dependencies
- React Navigation (stack + tabs)
- Axios for API communication
- Zustand or Context API for state management
- React Native Reanimated for animations\n- React Native Calendars\n- Expo Image Picker\n- Expo Secure Store\n- Expo FileSystem
- Lottie animations
- NativeWind + Tailwind for styling
- Skeleton loaders

### 2.3 Project Structure
```
/app
   /auth
   /dashboard
   /attendance\n   /leave
   /teams
   /documents
   /profile
   /navigation
   /notes
   /holidays
   /payroll
   /admin
   /settings
/components
/contexts
/hooks
/services
/theme
/mock
/assets
```

## 3. Design System

### 3.1 Color Palette
- Sky Blue Primary: #4FA3FF
- Deep Sky: #0284FE
- Soft Blue: #D8ECFF
- Midnight Navy: #0A1A2A
- White: #FFFFFF
- Gray: #B6C5D1\n\n### 3.2 Typography
- Font Family: Lexend (Bold/Medium/Regular)
\n### 3.3 Visual Style
- Soft rounded corners for cards and buttons
- Glass-morphism effect on cards with subtle transparency
- Gradient headers transitioning from Deep Sky to Sky Blue Primary
- Smooth page transitions with300ms duration
- Minimalistic line-style icons with2px stroke width

## 4. User Roles\n
### 4.1 Role Types
1. Admin - Full system access
2. HR - Employee management and approval rights
3. Employee - Standard user access
4. Marketing Executive - Additional navigation tracking features

### 4.2 Mock Users
System includes dummy login credentials for all four roles for testing purposes.

## 5. Core Features

### 5.1 Authentication Module
- User login (POST /api/auth/login)\n- User registration (POST /api/auth/register)
- Logout (POST /api/auth/logout)
- Token refresh (POST /api/auth/refresh)
- Auto-login on app restart
- Secure JWT storage via Expo SecureStore
- Load user profile(/api/users/me) after authentication
- Role-based screen access control

### 5.2 Dashboard
- Role-based personalized view
- Today's attendance status display
- Quick action buttons for common tasks
- Sky-themed card layout with statistics
- Recent activity feed
\n### 5.3 Attendance Management
- Check-in/Check-out functionality
- Calendar heatmap visualization
- Daily attendance timeline
- Attendance history with filtering
- Monthly attendance summary
\n### 5.4 Leave Management
\n#### For Employees/HR/Marketing Executives:\n- Submit leave requests\n- View personal leave history
- Track leave balance
\n#### For Admin/HR:
- Approve or reject leave requests
- View pending leave applications
- Manage leave policies

### 5.5 Team Management
- Team list view
- Team details page
- Team members list
- Add new team\n- Add member to team
- Remove member from team

### 5.6 Document Management
- Upload documents\n- View personal documents
- Admin access to user documents
- Delete documents
- Document categorization

### 5.7 Notes Module
- Create personal notes
- Edit existing notes
- View team notes
- Pin important notes
- Notes list with search\n
### 5.8 Holiday Management
- View company holidays list
- Calendar view of holidays
- Add holidays (Admin only)
- Filter holidays by date range
\n### 5.9 Profile Management
- Instagram-style profile interface
- View self profile
- Edit bio, username, and profile photo
- Public profile view for other users
- Display role badge
- Show company email

### 5.10 Navigation History (Marketing Executives)
- Page view timeline
- Navigation log tracking
- Admin view of user navigation history
\n### 5.11 Payroll Module
- Monthly payroll summary\n- Attendance-based salary calculations
- Payroll statistics display
\n### 5.12 Notification System
- View personal notifications
- Mark notifications as read
- Broadcast notifications (Admin only)

### 5.13 Session Management
- View active sessions
- Revoke specific sessions
- Session security monitoring

### 5.14 User Management (Admin)
- Block/unblock users
- Approve new user registrations
- View all users list
- Manage user accounts

### 5.15 Admin Panel
- Employee data table
- Overall attendance overview
- HR attendance monitoring
- Marketing navigation insights
- Employee metrics dashboard

### 5.16 Settings
- App preferences
- Account settings
- Privacy controls
\n## 6. Navigation Structure

### 6.1 Mobile App Tabs
1. Dashboard
2. Attendance
3. Leave
4. Teams
5. Profile
\n### 6.2 Web Sidebar Menu
1. Dashboard
2. Employees
3. Attendance
4. Leave
5. Teams
6. Documents
7. Notes
8. Holidays
9. Payroll\n10. Navigation Logs
11. Admin Tools
12. Settings

## 7. API Integration

### 7.1 API Service Layer (/services/api.ts)
- Reusable Axios client configuration
- Automatic token refresh mechanism
- Role-based request enforcement
- Centralized error parsing and handling
- Toast notification integration
- Request/response interceptors

### 7.2 Backend Controllers Integration
- team-controller\n- profile-controller
- note-controller
- holiday-controller
- document-controller\n- user-controller
- sessions-controller
- notification-controller
- navigation-controller\n- leave-controller
- auth-controller
- attendance-controller
- public-test-controller
- health-controller\n- payroll-controller
- admin-controller

## 8. Screen Specifications

### 8.1 Authentication Screens
- Splash screen with server health check
- Onboarding carousel
- Login screen
- Registration screen

### 8.2 Main Application Screens
- Dashboard (role-specific)
- Attendance calendar and timeline
- Leave request and history
- Team list and details
- Document upload and management
- Notes creation and viewing
- Holiday calendar
- Profile view and edit
- Navigation history timeline
- Payroll summary\n- Admin panel with data tables
- Settings and preferences

## 9. Quality Requirements

### 9.1 Performance\n- Smooth animations with 60fps
- Fast page transitions
- Optimized API calls
- Efficient state management
\n### 9.2 Stability
- Zero UI crashes
- Proper error handling
- Graceful API failure management
- Stable navigation flow

### 9.3 Testing Coverage
- Android device testing
- iOS device testing
- Web browser testing\n- All screens load verification
- Tab navigation stability
- Login/logout functionality
- Profile update operations
- Check-in/out operations
- Leave request submission
- Team management flows
- Document upload functionality
\n## 10. Security Features
- Secure JWT token storage
- Automatic token refresh
- Role-based access control
- Session management
- Secure API communication
\n## 11. Deliverables
- Complete project folder structure
- Clean and consistent UI implementation
- Fully functional navigation system
- Complete API integration
- Consistent theme implementation
- Role-based authentication support
- All required screens completed
- Smooth animations throughout
- Zero-crash stable application
- Optimized performance across all platforms