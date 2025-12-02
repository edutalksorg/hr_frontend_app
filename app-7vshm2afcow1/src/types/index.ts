export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export type UserRole = 'admin' | 'hr' | 'employee' | 'marketing';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  bio?: string;
  profilePhoto?: string;
  companyEmail?: string;
  isBlocked?: boolean;
  isApproved?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
}

export interface Attendance {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime?: string;
  date?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

export interface Leave {
  id: string;
  userId: string;
  type: 'sick' | 'casual' | 'vacation' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  category: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  teamId?: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  device: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
}

export interface NavigationLog {
  id: string;
  userId: string;
  page: string;
  timestamp: string;
}

export interface Payroll {
  id: string;
  userId: string;
  month: string;
  year: number;
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netSalary: number;
  attendanceDays: number;
  createdAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  totalTeams: number;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

export interface LeaveBalance {
  sick: number;
  casual: number;
  vacation: number;
  unpaid: number;
}

