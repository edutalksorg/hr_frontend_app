import type { ReactNode } from 'react';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
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
    name: 'Navigation',
    path: '/navigation',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'marketing']}>
        <NavigationPage />
      </ProtectedRoute>
    )
  }
];

export default routes;
