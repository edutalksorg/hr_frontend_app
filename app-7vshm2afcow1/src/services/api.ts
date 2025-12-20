import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  User,
  AuthResponse, // This WAS used in api.ts, check types
  Team,
  Document,
  Leave,
  Holiday,
  Attendance,
  AttendanceRecord,
  AttendanceStats,
  Shift,
  Note,
  Notification,
  Session,
  NavigationLog,
  Payroll,
  DashboardStats,
  LeaveBalance,
  PerformanceGoal,
  PerformanceReview,
  SupportTicket,
  TicketComment
} from '@/types';
import { mockPayroll } from './mockData';

// Prefer Vite env var, fall back to local dev server on port 5000 (matches .env.local)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.loadTokens();
    this.setupInterceptors();
  }

  private loadTokens() {
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
    if (this.token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || 'An error occurred';
      const isLoginRequest = error.config?.url?.includes('/login');

      if (isLoginRequest && (status === 401 || status === 404)) {
        toast.error('Invalid email or password');
        return;
      }

      if (isLoginRequest && status === 403) {
        const specificMessage = (error.response.data as any)?.message;
        if (specificMessage && specificMessage.includes('blocked')) {
          toast.error('Contact admin you are blocked');
          return;
        }
        // Fallback for other 403s during login if any
        toast.error('Access denied');
        return;
      }

      if (status === 403) {
        // Silent fail for /users/me - it just means we're not logged in or token invalid
        if (error.config?.url?.includes('/users/me')) {
          return;
        }

        // Use specific message from backend if available, otherwise generic
        const specificMessage = (error.response.data as any)?.message;
        if (specificMessage && specificMessage !== 'Forbidden') {
          if (specificMessage.includes('approval is not completed')) {
            toast.success(specificMessage, {
              style: {
                borderLeft: '4px solid #10B981', // Green line
              }
            });
          } else {
            toast.error(specificMessage);
          }
        } else {
          toast.error('Access denied. You may not have permission for this action.');
        }
        console.error('403 Forbidden:', error.config?.url, 'User role:', localStorage.getItem('currentUser'));
      } else if (status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      // Send a JSON body containing the refresh token. Some backends expect
      // { refreshToken: '...' } rather than a raw string.
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken: this.refreshToken });

      const { accessToken, refreshToken: newRefreshToken } = response.data || {};
      if (accessToken) {
        this.setToken(accessToken);
      }
      if (newRefreshToken) {
        this.setRefreshToken(newRefreshToken);
      }

      return accessToken || null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  private setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete this.client.defaults.headers.common['Authorization'];
  }

  async getPublicIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Failed to fetch public IP:', error);
      return '';
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const ipAddress = await this.getPublicIp();
    const response = await this.client.post<any>('/api/v1/auth/login', { email, password, ipAddress });

    // If backend doesn't return tokens, propagate an empty AuthResponse
    if (!response?.data?.accessToken) {
      return {
        token: undefined,
        refreshToken: undefined,
        user: undefined
      } as AuthResponse;
    }

    const authResponse: AuthResponse = {
      token: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: undefined as any
    };

    this.setToken(authResponse.token!);
    if (authResponse.refreshToken) this.setRefreshToken(authResponse.refreshToken!);

    // Fetch current user details
    const user = await this.getCurrentUser();
    authResponse.user = user;

    localStorage.setItem('currentUser', JSON.stringify(user));

    return authResponse;
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/api/v1/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.client.post('/api/v1/auth/reset-password', { token, newPassword });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/api/v1/auth/change-password', { oldPassword, newPassword });
  }

  async register(email: string, username: string, password: string, role: string): Promise<AuthResponse> {
    // Backend expects: fullName, email, phone, password.
    // Frontend provides: email, username, password, role.
    // I will map username to fullName. Phone is missing, I'll send a placeholder or empty string.

    const registerRequest = {
      fullName: username,
      email,
      password,
      phone: "", // Placeholder as it's required by backend DTO but not in frontend form
      role: role
    };

    const response = await this.client.post<any>('/api/v1/auth/register', registerRequest);

    // If tokens are missing, it means user is pending approval
    if (!response.data.accessToken) {
      return {
        token: undefined,
        refreshToken: undefined,
        user: undefined
      };
    }

    const authResponse: AuthResponse = {
      token: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: {} as User // Placeholder, will fetch below
    };

    this.setToken(authResponse.token!);
    this.setRefreshToken(authResponse.refreshToken!);

    const user = await this.getCurrentUser();
    authResponse.user = user;

    return authResponse;
  }

  logout() {
    // Optional: Call backend logout if needed
    // this.client.post('/api/auth/logout', { refreshToken: this.refreshToken });
    this.clearTokens();
    localStorage.removeItem('currentUser');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<any>('/api/v1/users/me');
    const data = response.data;
    return {
      ...data,
      username: data.fullName || data.username,
      role: data.role?.toLowerCase(),
      isApproved: data.status === 'ACTIVE',
      isBlocked: data.status === 'BLOCKED'
    };
  }

  async getAttendance(userId: string): Promise<Attendance[]> {
    const response = await this.client.get<any[]>(`/api/v1/attendance/history/60days/${userId}`);
    // Map DTO to Attendance interface
    return response.data.map(dto => ({
      id: dto.id || `${dto.date}-${userId}`, // Use real ID if available, else fallback to composite
      userId: userId,
      date: dto.date,
      loginTime: dto.checkIn,
      logoutTime: dto.checkOut,
      status: (dto.status || 'absent').toLowerCase(),
      canCheckOut: dto.canCheckOut
    } as Attendance));
  }

  async getAllAttendance(): Promise<Attendance[]> {
    const response = await this.client.get<Attendance[]>('/api/v1/admin/attendance/all');
    return response.data;
  }

  async getAttendanceByDate(userId: string, date: string): Promise<AttendanceRecord> {
    const response = await this.client.get<AttendanceRecord>('/api/v1/attendance', {
      params: { userId, date }
    });
    return response.data;
  }

  async updateAttendance(id: string, data: { status?: string, checkIn?: string, checkOut?: string, remark?: string }): Promise<Attendance> {
    const response = await this.client.put<Attendance>(`/api/v1/attendance/update/${id}`, data);
    return response.data;
  }

  async createAttendance(data: { userId: string, status?: string, checkIn?: string, checkOut?: string, remark?: string }): Promise<Attendance> {
    const response = await this.client.post<Attendance>('/api/v1/attendance/manual', data);
    return response.data;
  }

  async checkIn(userId: string): Promise<Attendance> {
    const ip = await this.getPublicIp();
    const response = await this.client.post<Attendance>(`/api/v1/attendance/login/${userId}`, null, {
      params: { ip }
    });
    return response.data;
  }

  async checkOut(attendanceId: string): Promise<Attendance> {
    const ip = await this.getPublicIp();
    const response = await this.client.post<Attendance>(`/api/v1/attendance/logout/${attendanceId}`, null, {
      params: { ip }
    });
    return response.data;
  }

  async getAttendanceStats(userId: string): Promise<AttendanceStats> {
    const response = await this.client.get<any>(`/api/v1/attendance/stats/${userId}`);
    const data = response.data;

    // Backend returns { totalDays, presentDays, lateDays, attendanceRate }
    // Frontend expects { totalDays, presentDays, absentDays, lateDays, attendanceRate }

    return {
      totalDays: data.totalDays,
      presentDays: data.presentDays,
      lateDays: data.lateDays,
      attendanceRate: data.attendanceRate,
      absentDays: data.totalDays - data.presentDays // Approximate
    };
  }

  async getLeaves(): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/v1/leave/my-requests');
    return response.data;
  }

  async getUserLeaves(userId: string): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>(`/api/v1/leave/user/${userId}`);
    return response.data;
  }

  async getPendingLeaves(): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/v1/leave/pending');
    return response.data;
  }

  async getApprovedLeaves(): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/v1/leave/approved');
    return response.data;
  }

  async createLeave(leave: Omit<Leave, 'id' | 'createdAt'>): Promise<Leave> {
    const response = await this.client.post<Leave>('/api/v1/leave/request', {
      leaveType: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason
    });
    return response.data;
  }

  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected'): Promise<Leave> {
    const endpoint = status === 'approved' ? `/api/v1/leave/${leaveId}/approve` : `/api/v1/leave/${leaveId}/reject`;
    const response = await this.client.post<Leave>(endpoint);
    return response.data;
  }

  async getLeaveBalance(): Promise<LeaveBalance> {
    // Backend doesn't have this endpoint yet, using mock data
    return {
      sick: 0,
      casual: 0,
      vacation: 0,
      unpaid: 0
    };
  }

  async getTeams(): Promise<Team[]> {
    const response = await this.client.get<Team[]>('/api/v1/teams');
    return response.data;
  }

  async getTeam(teamId: string): Promise<Team> {
    const response = await this.client.get<Team>(`/api/v1/teams/${teamId}`);
    return response.data;
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const response = await this.client.post<Team>('/api/v1/teams', {
      name: team.name,
      description: team.description
    });
    return response.data;
  }

  async assignTeamLeader(teamId: string, userId: string): Promise<Team> {
    const response = await this.client.put<Team>(`/api/v1/teams/${teamId}/leader`, { userId });
    return response.data;
  }

  async addTeamMember(teamId: string, userId: string): Promise<Team> {
    await this.client.post(`/api/v1/teams/${teamId}/members`, { userId });
    return this.getTeam(teamId);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<Team> {
    // Backend uses memberId, not userId. This might need adjustment based on actual implementation
    await this.client.delete(`/api/v1/teams/members/${userId}`);
    return this.getTeam(teamId);
  }

  async getTeamMembers(teamId: string): Promise<any[]> {
    const response = await this.client.get(`/api/v1/teams/${teamId}/members`);
    return response.data;
  }

  async getAllDocuments(): Promise<Document[]> {
    const response = await this.client.get<Document[]>('/api/documents/all');
    return response.data;
  }

  async getDocuments(userId: string): Promise<Document[]> {
    const response = await this.client.get<Document[]>(`/api/documents/user/${userId}`);
    return response.data;
  }

  async uploadDocument(file: File, type: string, userId: string, targetUserId?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (targetUserId) {
      formData.append('targetUserId', targetUserId);
    }

    const response = await this.client.post<Document>('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-User-Id': userId
      }
    });
    return response.data;
  }

  async downloadDocument(documentId: string, fileName: string): Promise<void> {
    const response = await this.client.get(`/api/documents/download/${documentId}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.client.delete(`/api/documents/${documentId}`);
  }

  async getNotes(userId: string): Promise<Note[]> {
    const response = await this.client.get<Note[]>(`/api/notes/user/${userId}`);
    return response.data;
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const response = await this.client.post<Note>('/api/notes', {
      userId: note.userId,
      teamId: note.teamId,
      title: note.title,
      body: note.content
    });
    return response.data;
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
    const response = await this.client.put<Note>(`/api/notes/${noteId}`, {
      title: updates.title,
      body: updates.content
    });
    return response.data;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.client.delete(`/api/notes/${noteId}`);
  }

  async getHolidays(): Promise<Holiday[]> {
    const response = await this.client.get<any[]>('/api/v1/holidays');
    return response.data.map(h => ({
      ...h,
      date: h.holidayDate
    }));
  }

  async createHoliday(holiday: Omit<Holiday, 'id' | 'createdAt'>): Promise<Holiday> {
    const response = await this.client.post<Holiday>('/api/v1/holidays', {
      name: holiday.name,
      holidayDate: holiday.date,
      description: holiday.description
    });
    return response.data;
  }

  async deleteHoliday(holidayId: string): Promise<void> {
    await this.client.delete(`/api/v1/holidays/${holidayId}`);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const response = await this.client.get<Notification[]>(`/api/notifications/${userId}`);
    return response.data;
  }

  async getMyNotifications(): Promise<Notification[]> {
    const response = await this.client.get<Notification[]>('/api/notifications/my-notifications');
    return response.data;
  }

  async sendNotification(userId: string, title: string, message: string, type: string = 'INFO'): Promise<Notification> {
    const response = await this.client.post<Notification>('/api/notifications/send', {
      userId,
      title,
      message,
      type
    });
    return response.data;
  }

  async sendNotificationBatch(userIds: string[], title: string, message: string, type: string = 'INFO'): Promise<void> {
    await this.client.post('/api/notifications/send', {
      userIds,
      title,
      message,
      type
    });
  }

  async sendNotificationToTeam(teamId: string, title: string, message: string, type: string = 'INFO'): Promise<void> {
    await this.client.post('/api/notifications/send', {
      teamId,
      title,
      message,
      type
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.client.post(`/api/notifications/read/${notificationId}`);
  }

  async broadcastNotification(title: string, message: string, type: string = 'INFO'): Promise<void> {
    await this.client.post('/api/notifications/broadcast', {
      title,
      message,
      type
    });
  }

  async getSessions(): Promise<Session[]> {
    const response = await this.client.get<Session[]>('/api/sessions/me');
    return response.data;
  }

  async revokeSession(sessionToken: string): Promise<void> {
    await this.client.post('/api/sessions/revoke', null, {
      params: { token: sessionToken }
    });
  }

  async getNavigationLogs(userId: string): Promise<NavigationLog[]> {
    const response = await this.client.get<NavigationLog[]>(`/api/navigation/history/${userId}`);
    return response.data;
  }

  async logNavigation(userId: string, page: string): Promise<void> {
    await this.client.post('/api/navigation/log', null, {
      params: { userId, path: page }
    });
  }

  async getPayroll(userId: string): Promise<Payroll[]> {
    // Backend only has calculate endpoint, not list. Using mock for now
    if (userId) {
      return mockPayroll.filter(p => p.userId === userId);
    }
    return [];
  }

  async getAllUsers(): Promise<User[]> {
    const response = await this.client.get<any[]>('/api/v1/users/all');
    return response.data.map(u => ({
      ...u,
      username: u.fullName || u.username,
      role: u.role?.toLowerCase(),
      isApproved: u.status === 'ACTIVE',
      isBlocked: u.status === 'BLOCKED'
    }));
  }

  async blockUser(userId: string): Promise<User> {
    await this.client.post(`/api/v1/users/block/${userId}`);
    const user = await this.getCurrentUser();
    return user;
  }

  async unblockUser(userId: string): Promise<User> {
    await this.client.post(`/api/v1/users/unblock/${userId}`);
    const user = await this.getCurrentUser();
    return user;
  }

  async approveUser(userId: string, role: string): Promise<User> {
    const currentUser = await this.getCurrentUser();
    const response = await this.client.post<User>(`/api/v1/users/approve/${userId}`, null, {
      params: { role, approverId: currentUser.id }
    });
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.client.get<DashboardStats>('/api/v1/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values on error
      return {
        totalEmployees: 0,
        totalHR: 0,
        totalMarketing: 0,
        presentToday: 0,
        onLeave: 0,
        pendingLeaves: 0,
        totalTeams: 0,
        technicalTeamCount: 0,
        totalAdmins: 0
      };
    }
  }

  async updateProfile(_userId: string, updates: Partial<User>): Promise<User> {
    // 1. Update text fields
    await this.client.put('/api/v1/profile/update', {
      username: updates.username,
      bio: updates.bio,
      email: updates.email,
      employeeId: updates.employeeId
    });

    // 2. Update photo if provided
    if (updates.profilePhoto) {
      await this.client.post('/api/v1/profile/photo', {
        photoUrl: updates.profilePhoto
      });
    }

    const user = await this.getCurrentUser();
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
  async getAllShifts(): Promise<Shift[]> {
    const response = await this.client.get<Shift[]>('/api/v1/shifts');
    return response.data;
  }

  async createShift(shift: Partial<Shift>): Promise<Shift> {
    const response = await this.client.post<Shift>('/api/v1/shifts', shift);
    return response.data;
  }

  async deleteShift(id: string): Promise<void> {
    await this.client.delete(`/api/v1/shifts/${id}`);
  }

  async assignShift(userId: string, shiftId: string | null): Promise<void> {
    await this.client.post('/api/v1/shifts/assign', null, {
      params: { userId, shiftId }
    });
  }

  async trackSession(userId: string): Promise<void> {
    // We send IP as param just in case backend logic looks for it, though Controller signature uses request
    const ip = await this.getPublicIp();
    await this.client.post(`/api/v1/attendance/track/${userId}`, null, {
      params: { ip }
    });
  }

  async updateShift(id: string, shift: Partial<Shift>): Promise<Shift> {
    const response = await this.client.put<Shift>(`/api/v1/shifts/${id}`, shift);
    return response.data;
  }

  // Performance API

  // Performance API
  async getUserGoals(userId: string): Promise<PerformanceGoal[]> {
    const response = await this.client.get<PerformanceGoal[]>(`/api/v1/performance/goals/${userId}`);
    return response.data;
  }

  async createGoal(userId: string, goal: Partial<PerformanceGoal>): Promise<PerformanceGoal> {
    const response = await this.client.post<PerformanceGoal>(`/api/v1/performance/goals/${userId}`, goal);
    return response.data;
  }

  async updateGoal(goalId: string, updates: Partial<PerformanceGoal>): Promise<PerformanceGoal> {
    const response = await this.client.put<PerformanceGoal>(`/api/v1/performance/goals/${goalId}`, updates);
    return response.data;
  }

  async deleteGoal(goalId: string): Promise<void> {
    await this.client.delete(`/api/v1/performance/goals/${goalId}`);
  }

  async getUserReviews(userId: string): Promise<PerformanceReview[]> {
    const response = await this.client.get<PerformanceReview[]>(`/api/v1/performance/reviews/${userId}`);
    return response.data;
  }

  async getAllReviews(): Promise<PerformanceReview[]> {
    const response = await this.client.get<PerformanceReview[]>('/api/v1/performance/reviews/all');
    return response.data;
  }

  async addReview(userId: string, review: Partial<PerformanceReview>): Promise<PerformanceReview> {
    const response = await this.client.post<PerformanceReview>(`/api/v1/performance/reviews/${userId}`, review);
    return response.data;
  }

  async deleteReview(reviewId: string): Promise<void> {
    await this.client.delete(`/api/v1/performance/reviews/${reviewId}`);
  }

  async getFilteredReviews(teamId?: string, userIds?: string[]): Promise<PerformanceReview[]> {
    const response = await this.client.post<PerformanceReview[]>('/api/v1/performance/reviews/filter', {
      teamId,
      userIds
    });
    return response.data;
  }

  // Helpdesk API
  async createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    const response = await this.client.post<SupportTicket>('/api/v1/helpdesk/tickets', ticket);
    return response.data;
  }

  async getMyTickets(userId: string): Promise<SupportTicket[]> {
    const response = await this.client.get<SupportTicket[]>(`/api/v1/helpdesk/tickets/my/${userId}`);
    return response.data;
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    const response = await this.client.get<SupportTicket[]>('/api/v1/helpdesk/tickets/all');
    return response.data;
  }

  async updateTicketStatus(ticketId: string, status: string, assignedToId?: string): Promise<SupportTicket> {
    const params = new URLSearchParams();
    params.append('status', status);
    if (assignedToId) params.append('assignedToId', assignedToId);

    const response = await this.client.put<SupportTicket>(`/api/v1/helpdesk/tickets/${ticketId}/status?${params.toString()}`);
    return response.data;
  }

  async addTicketComment(ticketId: string, authorId: string, content: string): Promise<TicketComment> {
    const response = await this.client.post<TicketComment>(`/api/v1/helpdesk/tickets/${ticketId}/comments`, { authorId, content });
    return response.data;
  }

  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    const response = await this.client.get<TicketComment[]>(`/api/v1/helpdesk/tickets/${ticketId}/comments`);
    return response.data;
  }
}

export const apiService = new ApiService();
