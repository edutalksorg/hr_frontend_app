import { type ReactNode, lazy, Suspense } from 'react';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy load all pages for better performance on slow networks (2G - 5G)
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const BlockedPage = lazy(() => import('./pages/auth/BlockedPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const LeavePage = lazy(() => import('./pages/leave/LeavePage'));
const TeamsPage = lazy(() => import('./pages/teams/TeamsPage'));
const TeamDetailPage = lazy(() => import('./pages/teams/TeamDetailPage'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const NotesPage = lazy(() => import('./pages/notes/NotesPage'));
const HolidaysPage = lazy(() => import('./pages/holidays/HolidaysPage'));
const PayrollPage = lazy(() => import('./pages/payroll/PayrollPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
import AdminPage from './pages/admin/AdminPage';
import GeolocationPage from './pages/admin/GeolocationPage';
const AdminPageDebug = lazy(() => import('./pages/admin/AdminPageDebug'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NavigationPage = lazy(() => import('./pages/navigation/NavigationPage'));
const EmployeesListPage = lazy(() => import('./pages/employees/EmployeesListPage'));
const EmployeeHistoryPage = lazy(() => import('./pages/employees/EmployeeHistoryPage'));
const PresentEmployeesPage = lazy(() => import('./pages/attendance/PresentEmployeesPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const SendNotificationPage = lazy(() => import('./pages/admin/SendNotificationPage'));
const ShiftManagementPage = lazy(() => import('./pages/shifts/ShiftManagementPage'));
const NotificationManagementPage = lazy(() => import('./pages/notifications/NotificationManagementPage'));
const PerformancePage = lazy(() => import('./pages/performance/PerformancePage'));
const HelpdeskPage = lazy(() => import('./pages/helpdesk/HelpdeskPage'));
const BranchManagementPage = lazy(() => import('./pages/admin/BranchManagementPage'));
const MyWorkUpdatesPage = lazy(() => import('./pages/work-updates/MyWorkUpdatesPage'));
const WorkUpdatesDashboardPage = lazy(() => import('./pages/work-updates/WorkUpdatesDashboardPage'));

// A sleek loading component for code-splitting transitions
const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium animate-pulse text-muted-foreground">Optimizing your connection...</p>
    </div>
  </div>
);

const withSuspense = (component: ReactNode) => (
  <Suspense fallback={<PageLoader />}>
    {component}
  </Suspense>
);

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Welcome',
    path: '/welcome',
    element: withSuspense(<WelcomePage />)
  },
  {
    name: 'Login',
    path: '/login',
    element: withSuspense(<LoginPage />)
  },
  {
    name: 'Register',
    path: '/register',
    element: withSuspense(<RegisterPage />)
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: withSuspense(<ForgotPasswordPage />)
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: withSuspense(<ResetPasswordPage />)
  },
  {
    name: 'Blocked',
    path: '/blocked',
    element: withSuspense(<BlockedPage />)
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: withSuspense(
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Attendance',
    path: '/attendance',
    element: withSuspense(
      <ProtectedRoute>
        <AttendancePage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Leave',
    path: '/leave',
    element: withSuspense(
      <ProtectedRoute>
        <LeavePage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Teams',
    path: '/teams',
    element: withSuspense(
      <ProtectedRoute>
        <TeamsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Team Detail',
    path: '/teams/:id',
    element: withSuspense(
      <ProtectedRoute>
        <TeamDetailPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Documents',
    path: '/documents',
    element: withSuspense(
      <ProtectedRoute>
        <DocumentsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Notes',
    path: '/notes',
    element: withSuspense(
      <ProtectedRoute>
        <NotesPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Holidays',
    path: '/holidays',
    element: withSuspense(
      <ProtectedRoute>
        <HolidaysPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Payroll',
    path: '/payroll',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
        <PayrollPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Profile',
    path: '/profile',
    element: withSuspense(
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Admin',
    path: '/admin/employees',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <AdminPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Geolocation',
    path: '/admin/geolocation',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <GeolocationPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Admin Debug',
    path: '/admin/debug',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <AdminPageDebug />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: 'Settings',
    path: '/settings',
    element: withSuspense(
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Present Employees',
    path: '/attendance/present',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <PresentEmployeesPage />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: 'Navigation',
    path: '/navigation',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'marketing']}>
        <NavigationPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Employees List',
    path: '/employees',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <EmployeesListPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Admins',
    path: '/admins',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <EmployeesListPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'HR Team',
    path: '/hr',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <EmployeesListPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Technical Team',
    path: '/developers',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <EmployeesListPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Employee History',
    path: '/employees/:id/history',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <EmployeeHistoryPage />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: 'Employee Attendance History',
    path: '/attendance/employee/:employeeId',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <EmployeeHistoryPage />
      </ProtectedRoute>
    ),
    visible: false
  },
  {
    name: 'Shift Management',
    path: '/shifts',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <ShiftManagementPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Notification Settings',
    path: '/notification-settings',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <NotificationManagementPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: withSuspense(
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Send Notification',
    path: '/admin/notifications/send',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <SendNotificationPage />
      </ProtectedRoute>
    ),
    visible: true
  },
  {
    name: 'Performance',
    path: '/performance',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive']}>
        <PerformancePage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Helpdesk',
    path: '/helpdesk',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive']}>
        <HelpdeskPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Branches',
    path: '/admin/branches',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin']}>
        <BranchManagementPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'My Work Updates',
    path: '/work-updates/my',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive']}>
        <MyWorkUpdatesPage />
      </ProtectedRoute>
    )
  },
  {
    name: 'Work Updates Dashboard',
    path: '/work-updates/dashboard',
    element: withSuspense(
      <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
        <WorkUpdatesDashboardPage />
      </ProtectedRoute>
    )
  }
];

export default routes;
