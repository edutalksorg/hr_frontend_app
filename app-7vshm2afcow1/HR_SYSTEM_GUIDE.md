# HR Attendance Management System - User Guide

A comprehensive, production-grade HR attendance management application built with React, TypeScript, Tailwind CSS, and shadcn/ui.

## 🚀 Quick Start

### Demo Credentials

Use these credentials to test different user roles:

- **Admin**: `admin@company.com` / `password123`
- **HR**: `hr@company.com` / `password123`
- **Employee**: `employee@company.com` / `password123`
- **Marketing**: `marketing@company.com` / `password123`

### First Login

1. Navigate to the login page
2. Click on one of the quick login buttons (Admin, HR, Employee, Marketing)
3. Or manually enter credentials and click "Sign In"
4. You'll be redirected to the dashboard

## 📋 Features Overview

### 🔐 Authentication & Authorization
- Secure login and registration
- Role-based access control
- Auto-login with JWT tokens
- Session management

### 📊 Dashboard
- Role-specific views
- Real-time attendance status
- Quick action buttons
- Statistics cards
- Quick links to features

### ⏰ Attendance Management
- **Check-in/Check-out**: Track your daily attendance
- **Calendar View**: Visual representation of attendance history
- **Statistics**: View attendance rate, present days, late days
- **History**: Browse past attendance records

### 📅 Leave Management
- **Request Leave**: Submit leave requests with reason
- **Leave Types**: Sick, Casual, Vacation, Unpaid
- **Leave Balance**: Track remaining leave days
- **Approval**: Admin/HR can approve or reject requests
- **History**: View all past leave requests

### 👥 Team Management
- **View Teams**: See all teams and their members
- **Team Details**: View team leader and members
- **Collaboration**: Work with team members
- **Admin Functions**: Create teams, add/remove members

### 📄 Document Management
- **Upload**: Upload documents with categories
- **View**: Access your personal documents
- **Organize**: Categorize documents
- **Delete**: Remove unwanted documents

### 📝 Notes
- **Create**: Write personal or team notes
- **Edit**: Update existing notes
- **Pin**: Mark important notes
- **Search**: Find notes quickly

### 🏖️ Holidays
- **Calendar**: View company holidays
- **List**: See upcoming holidays
- **Admin**: Add new holidays (Admin/HR only)

### 💰 Payroll
- **Summary**: View monthly salary details
- **History**: Browse past payroll records
- **Breakdown**: See base salary, deductions, bonuses
- **Attendance Link**: Salary based on attendance days

### 🧭 Navigation History
- **Tracking**: View your page visit history (Marketing role)
- **Analytics**: See navigation patterns
- **Timeline**: Chronological view of page visits

### 👤 Profile
- **View**: See your profile information
- **Edit**: Update bio, username, company email
- **Avatar**: Profile photo display
- **Status**: View account approval and access status

### ⚙️ Settings
- **Notifications**: Configure email and push notifications
- **Privacy**: Control profile visibility
- **Security**: Manage password and 2FA

### 🛡️ Admin Panel
- **User Management**: View all users
- **Approve**: Approve new registrations
- **Block/Unblock**: Manage user access
- **Monitor**: Track system usage

## 🎨 Design Features

### Color Scheme
- Sky Blue theme throughout the application
- Glass-morphism effects on cards
- Gradient headers
- Elegant shadows and glows

### Responsive Design
- Desktop-optimized layout with sidebar
- Mobile-friendly with collapsible menu
- Touch-friendly interactions
- Adaptive components

### User Experience
- Smooth 300ms transitions
- Loading states with skeletons
- Toast notifications for feedback
- Intuitive navigation

## 👥 Role-Based Access

### Admin
- ✅ Full system access
- ✅ User management
- ✅ Approve registrations
- ✅ Block/unblock users
- ✅ View all data
- ✅ Manage holidays
- ✅ Admin panel access

### HR
- ✅ Employee management
- ✅ Leave approvals
- ✅ Team management
- ✅ View team attendance
- ✅ HR tools access
- ❌ Cannot block users

### Employee
- ✅ Submit attendance
- ✅ Request leaves
- ✅ View personal data
- ✅ Team collaboration
- ✅ Document management
- ❌ Cannot approve leaves

### Marketing Executive
- ✅ All employee features
- ✅ Navigation tracking
- ✅ Page visit analytics
- ✅ Marketing insights
- ❌ Limited admin access

## 🔄 Common Workflows

### Daily Attendance
1. Login to the system
2. Go to Dashboard
3. Click "Check In" button
4. Work throughout the day
5. Click "Check Out" when leaving

### Requesting Leave
1. Navigate to Leave page
2. Click "Request Leave"
3. Select leave type
4. Choose start and end dates
5. Provide reason
6. Submit request
7. Wait for approval

### Approving Leave (Admin/HR)
1. Go to Leave page
2. View pending requests
3. Review leave details
4. Click "Approve" or "Reject"
5. Employee receives notification

### Managing Teams
1. Navigate to Teams page
2. View existing teams
3. Click "Create Team" (Admin/HR)
4. Add team name and description
5. Assign team leader
6. Add team members

### Viewing Payroll
1. Go to Payroll page
2. View current month summary
3. Check salary breakdown
4. Browse payroll history
5. See attendance-based calculations

## 🔒 Security Features

- JWT token authentication
- Automatic token refresh
- Secure password storage
- Role-based route protection
- Session monitoring
- Input validation

## 📱 Mobile Experience

- Responsive sidebar that collapses on mobile
- Touch-friendly buttons and interactions
- Optimized layouts for small screens
- Mobile-first navigation
- Swipe gestures support

## 🛠️ Technical Details

### Technology Stack
- React 18 with TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router v7
- Axios for API calls
- Context API for state
- Sonner for notifications

### API Integration
- Mock data for demonstration
- Ready for backend integration
- Comprehensive API service layer
- Error handling and retries
- Token management

## 📞 Support

For questions or issues:
1. Check this guide first
2. Review the TODO.md for implementation details
3. Contact the development team
4. Submit a support ticket

## 🎯 Best Practices

### For Employees
- Check in/out daily
- Request leaves in advance
- Keep profile updated
- Upload required documents
- Collaborate with team

### For HR/Admin
- Review leave requests promptly
- Keep holiday calendar updated
- Monitor attendance regularly
- Approve new users quickly
- Maintain team structures

### For Everyone
- Use strong passwords
- Keep profile information current
- Check notifications regularly
- Report issues promptly
- Follow company policies

## 🔄 Updates and Maintenance

The system is designed for easy updates:
- Mock data can be replaced with real API
- New features can be added modularly
- Design system is customizable
- Role permissions are configurable

## 📊 Analytics and Reporting

Available metrics:
- Attendance rates
- Leave patterns
- Team performance
- Payroll summaries
- Navigation insights (Marketing)

---

**Version**: 1.0.0  
**Last Updated**: 2024-11-29  
**Built with**: React + TypeScript + shadcn/ui
