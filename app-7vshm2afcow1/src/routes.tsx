import type { ReactNode } from 'react';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AttendancePage from './pages/attendance/AttendancePage';
import LeavePage from './pages/leave/LeavePage';
import TeamsPage from './pages/teams/TeamsPage';
import TeamDetailPage from './pages/teams/TeamDetailPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import NotesPage from './pages/notes/NotesPage';
import HolidaysPage from './pages/holidays/HolidaysPage';
import PayrollPage from './pages/payroll/PayrollPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminPage from './pages/admin/AdminPage';
import SettingsPage from './pages/settings/SettingsPage';
import NavigationPage from './pages/navigation/NavigationPage';
import EmployeesListPage from './pages/employees/EmployeesListPage';
import EmployeeHistoryPage from './pages/employees/EmployeeHistoryPage';
import PresentEmployeesPage from './pages/attendance/PresentEmployeesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SendNotificationPage from './pages/admin/SendNotificationPage';
import ShiftManagementPage from './pages/shifts/ShiftManagementPage';
import NotificationManagementPage from './pages/notifications/NotificationManagementPage';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />
  },
  {
    name: 'Register',
    path: '/register',
    element: <RegisterPage />
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Attendance',
    path: '/attendance',
    element: (
      <ProtectedRoute>
        <AttendancePage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Leave',
    path: '/leave',
    element: (
      <ProtectedRoute>
        <LeavePage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Teams',
    path: '/teams',
    element: (
      <ProtectedRoute>
        <TeamsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Team Detail',
    path: '/teams/:id',
    element: (
      <ProtectedRoute>
        <TeamDetailPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Documents',
    path: '/documents',
    element: (
      <ProtectedRoute>
        <DocumentsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Notes',
    path: '/notes',
    element: (
      <ProtectedRoute>
        <NotesPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Holidays',
    path: '/holidays',
    element: (
      <ProtectedRoute>
        <HolidaysPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Payroll',
    path: '/payroll',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr', 'employee']}>
        <PayrollPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Profile',
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Admin',
    path: '/admin/employees',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr']}>
        <AdminPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Settings',
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Present Employees',
    path: '/attendance/present',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr']}>
        <PresentEmployeesPage />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: 'Navigation',
    path: '/navigation',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'marketing']}>
        <NavigationPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Employees List',
    path: '/employees',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr']}>
        <EmployeesListPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Employee History',
    path: '/employees/:id/history',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr']}>
        <EmployeeHistoryPage />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: 'Shift Management',
    path: '/shifts',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr']}>
        <ShiftManagementPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Notification Settings',
    path: '/notification-settings',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr']}>
        <NotificationManagementPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Send Notification',
    path: '/admin/notifications/send',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr']}>
        <SendNotificationPage />
      </ProtectedRoute>
    ),
    visible: true
  }
];

export default routes;
