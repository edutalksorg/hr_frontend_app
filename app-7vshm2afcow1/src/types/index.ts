export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export type UserRole = 'admin' | 'hr' | 'manager' | 'employee' | 'marketing' | 'marketing_executive';

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
  employeeId?: string;
  shift?: Shift;
  branch?: Branch;
  geoRestrictionEnabled?: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  geoRadius?: number;
  joiningDate?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  geoRadius?: number;
  createdAt?: string;
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
  status: string;
  notes?: string;
  canCheckOut?: boolean;
  metadata?: string;
  ipHistory?: { timestamp: string; ip: string }[];
}

export interface AttendanceRecord {
  date: string;
  checkIn?: string;
  checkOut?: string;
  ipAddress?: string;
  logoutIpAddress?: string;
  status: string; // Present, Absent, Holiday, etc.
  remark?: string;
  canCheckOut?: boolean;
  ipHistory?: { timestamp: string; ip: string }[];
}

export interface Leave {
  id: string;
  userId: string;
  userName?: string;
  userEmployeeId?: string;
  userProfilePhoto?: string;
  userRole?: string;
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
  type: string;
  fileName: string;
  filePath: string;
  role: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  teamId?: string;
  title: string;
  body: string;
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
  type: string;
  read: boolean;
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
  totalHR: number;
  totalMarketing: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  totalTeams: number;
  technicalTeamCount: number;
  totalAdmins: number;
  totalManagers: number;
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

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "09:00:00"
  endTime: string;   // "18:00:00"
  lateGraceMinutes?: number;
  halfDayTime?: string;
  absentTime?: string;
  lateCountLimit?: number;
}

export interface PerformanceGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
  progressPercentage: number;
  adminFeedback?: string;
  createdAt: string;
}

export interface PerformanceReview {
  id: string;
  userId: string;
  user?: User;
  reviewerId?: string;
  reviewer?: User;
  cycle: string;
  rating: number; // 1-10
  feedback: string;
  improvementAreas: string;
  reviewDate: string;
}

export interface SupportTicket {
  id: string;
  requester?: User; // Depending on how we fetch
  requesterId?: string; // If simplified
  category: 'IT_SUPPORT' | 'HR_QUERY' | 'PAYROLL_ISSUE' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  assignedTo?: User;
  createdAt: string;
  updatedAt?: string;
  attachmentUrl?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface WorkUpdate {
  id: string;
  user: User;
  role: string;
  branch?: Branch;
  date: string;
  shift?: Shift;
  workDescription: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
