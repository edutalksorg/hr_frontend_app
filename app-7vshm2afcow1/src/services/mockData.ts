import type { User, Attendance, Leave, Team, Document, Note, Holiday, Notification, Session, NavigationLog, Payroll } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@company.com',
    username: 'Admin User',
    role: 'admin',
    bio: 'System Administrator',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    companyEmail: 'admin@company.com',
    isBlocked: false,
    isApproved: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'hr@company.com',
    username: 'HR Manager',
    role: 'hr',
    bio: 'Human Resources Manager',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HR',
    companyEmail: 'hr@company.com',
    isBlocked: false,
    isApproved: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'employee@company.com',
    username: 'John Doe',
    role: 'employee',
    bio: 'Software Developer',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    companyEmail: 'john.doe@company.com',
    isBlocked: false,
    isApproved: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    email: 'marketing@company.com',
    username: 'Marketing Executive',
    role: 'marketing',
    bio: 'Digital Marketing Specialist',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marketing',
    companyEmail: 'marketing@company.com',
    isBlocked: false,
    isApproved: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockAttendance: Attendance[] = [
  {
    id: '1',
    userId: '3',
    checkIn: '2024-11-29T09:00:00Z',
    checkOut: '2024-11-29T18:00:00Z',
    date: '2024-11-29',
    status: 'present',
    notes: 'Regular day'
  },
  {
    id: '2',
    userId: '3',
    checkIn: '2024-11-28T09:15:00Z',
    checkOut: '2024-11-28T18:00:00Z',
    date: '2024-11-28',
    status: 'late',
    notes: 'Traffic delay'
  },
  {
    id: '3',
    userId: '3',
    checkIn: '2024-11-27T09:00:00Z',
    checkOut: '2024-11-27T18:00:00Z',
    date: '2024-11-27',
    status: 'present'
  }
];

export const mockLeaves: Leave[] = [
  {
    id: '1',
    userId: '3',
    type: 'sick',
    startDate: '2024-12-01',
    endDate: '2024-12-02',
    reason: 'Medical appointment',
    status: 'pending',
    createdAt: '2024-11-29T10:00:00Z'
  },
  {
    id: '2',
    userId: '3',
    type: 'vacation',
    startDate: '2024-12-15',
    endDate: '2024-12-20',
    reason: 'Family vacation',
    status: 'approved',
    approvedBy: '2',
    createdAt: '2024-11-20T10:00:00Z'
  }
];

export const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Development Team',
    description: 'Software development and engineering',
    leaderId: '3',
    memberIds: ['3', '4'],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'HR Team',
    description: 'Human resources and recruitment',
    leaderId: '2',
    memberIds: ['2'],
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    userId: '3',
    title: 'Employment Contract',
    category: 'Contract',
    fileUrl: 'https://example.com/contract.pdf',
    uploadedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    userId: '3',
    title: 'ID Proof',
    category: 'Identity',
    fileUrl: 'https://example.com/id.pdf',
    uploadedAt: '2024-01-01T00:00:00Z'
  }
];

export const mockNotes: Note[] = [
  {
    id: '1',
    userId: '3',
    title: 'Project Meeting Notes',
    content: 'Discussed Q4 goals and deliverables',
    isPinned: true,
    createdAt: '2024-11-29T10:00:00Z',
    updatedAt: '2024-11-29T10:00:00Z'
  },
  {
    id: '2',
    userId: '3',
    teamId: '1',
    title: 'Sprint Planning',
    content: 'Sprint 23 planning session notes',
    isPinned: false,
    createdAt: '2024-11-28T10:00:00Z',
    updatedAt: '2024-11-28T10:00:00Z'
  }
];

export const mockHolidays: Holiday[] = [
  {
    id: '1',
    name: 'New Year',
    date: '2025-01-01',
    description: 'New Year celebration',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Christmas',
    date: '2024-12-25',
    description: 'Christmas holiday',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '3',
    title: 'Leave Approved',
    message: 'Your vacation leave has been approved',
    isRead: false,
    createdAt: '2024-11-29T10:00:00Z'
  },
  {
    id: '2',
    userId: '3',
    title: 'Team Meeting',
    message: 'Team meeting scheduled for tomorrow at 10 AM',
    isRead: true,
    createdAt: '2024-11-28T10:00:00Z'
  }
];

export const mockSessions: Session[] = [
  {
    id: '1',
    userId: '3',
    device: 'Chrome on Windows',
    ipAddress: '192.168.1.1',
    lastActive: '2024-11-29T10:00:00Z',
    createdAt: '2024-11-29T09:00:00Z'
  },
  {
    id: '2',
    userId: '3',
    device: 'Safari on iPhone',
    ipAddress: '192.168.1.2',
    lastActive: '2024-11-28T18:00:00Z',
    createdAt: '2024-11-28T09:00:00Z'
  }
];

export const mockNavigationLogs: NavigationLog[] = [
  {
    id: '1',
    userId: '4',
    page: '/dashboard',
    timestamp: '2024-11-29T09:00:00Z'
  },
  {
    id: '2',
    userId: '4',
    page: '/attendance',
    timestamp: '2024-11-29T09:15:00Z'
  },
  {
    id: '3',
    userId: '4',
    page: '/teams',
    timestamp: '2024-11-29T09:30:00Z'
  }
];

export const mockPayroll: Payroll[] = [
  {
    id: '1',
    userId: '3',
    month: 'November',
    year: 2024,
    baseSalary: 5000,
    deductions: 500,
    bonuses: 200,
    netSalary: 4700,
    attendanceDays: 22,
    createdAt: '2024-11-01T00:00:00Z'
  },
  {
    id: '2',
    userId: '3',
    month: 'October',
    year: 2024,
    baseSalary: 5000,
    deductions: 500,
    bonuses: 0,
    netSalary: 4500,
    attendanceDays: 20,
    createdAt: '2024-10-01T00:00:00Z'
  }
];
