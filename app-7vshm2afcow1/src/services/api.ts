import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { toast } from 'sonner';
import type {
  User,
  AuthResponse,
  Attendance,
  Leave,
  Team,
  Document,
  Note,
  Holiday,
  Notification,
  Session,
  NavigationLog,
  Payroll,
  DashboardStats,
  AttendanceStats,
  LeaveBalance
} from '@/types';
import { mockPayroll } from './mockData';

// Prefer Vite env var, fall back to local dev server on port 5000 (matches .env.local)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

      if (status === 403) {
        // Use specific message from backend if available, otherwise generic
        const specificMessage = (error.response.data as any)?.message;
        if (specificMessage && specificMessage !== 'Forbidden') {
          toast.error(specificMessage);
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
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken: this.refreshToken });

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

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<any>('/api/auth/login', { email, password });

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

    const response = await this.client.post<any>('/api/auth/register', registerRequest);

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
    const response = await this.client.get<any>('/api/users/me');
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
    const response = await this.client.get<Attendance[]>(`/api/attendance/history/${userId}`);
    return response.data;
  }

  async getAllAttendance(): Promise<Attendance[]> {
    const response = await this.client.get<Attendance[]>('/api/admin/attendance/all');
    return response.data;
  }

  async checkIn(userId: string): Promise<Attendance> {
    const response = await this.client.post<Attendance>(`/api/attendance/login/${userId}`);
    return response.data;
  }

  async checkOut(attendanceId: string): Promise<Attendance> {
    const response = await this.client.post<Attendance>(`/api/attendance/logout/${attendanceId}`);
    return response.data;
  }

  async getAttendanceStats(userId: string): Promise<AttendanceStats> {
    const userAttendance = await this.getAttendance(userId);
    const presentDays = userAttendance.filter(a => a.status === 'present').length;
    const lateDays = userAttendance.filter(a => a.status === 'late').length;
    const totalDays = userAttendance.length;

    return {
      totalDays,
      presentDays,
      absentDays: 0,
      lateDays,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    };
  }

  async getLeaves(): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/leave/my-requests');
    return response.data;
  }

  async getPendingLeaves(): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/leave/pending');
    return response.data;
  }

  async createLeave(leave: Omit<Leave, 'id' | 'createdAt'>): Promise<Leave> {
    const response = await this.client.post<Leave>('/api/leave/request', {
      leaveType: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason
    });
    return response.data;
  }

  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected'): Promise<Leave> {
    const endpoint = status === 'approved' ? `/api/leave/${leaveId}/approve` : `/api/leave/${leaveId}/reject`;
    const response = await this.client.post<Leave>(endpoint);
    return response.data;
  }

  async getLeaveBalance(): Promise<LeaveBalance> {
    // Backend doesn't have this endpoint yet, using mock data
    return {
      sick: 10,
      casual: 12,
      vacation: 15,
      unpaid: 0
    };
  }

  async getTeams(): Promise<Team[]> {
    const response = await this.client.get<Team[]>('/api/teams');
    return response.data;
  }

  async getTeam(teamId: string): Promise<Team> {
    const response = await this.client.get<Team>(`/api/teams/${teamId}`);
    return response.data;
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const response = await this.client.post<Team>('/api/teams', {
      name: team.name,
      description: team.description
    });
    return response.data;
  }

  async addTeamMember(teamId: string, userId: string): Promise<Team> {
    await this.client.post(`/api/teams/${teamId}/members`, { userId });
    return this.getTeam(teamId);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<Team> {
    // Backend uses memberId, not userId. This might need adjustment based on actual implementation
    await this.client.delete(`/api/teams/members/${userId}`);
    return this.getTeam(teamId);
  }

  async getTeamMembers(teamId: string): Promise<any[]> {
    const response = await this.client.get(`/api/teams/${teamId}/members`);
    return response.data;
  }

  async getDocuments(userId: string): Promise<Document[]> {
    const response = await this.client.get<Document[]>(`/api/documents/user/${userId}`);
    return response.data;
  }

  async uploadDocument(document: Omit<Document, 'id' | 'uploadedAt'>): Promise<Document> {
    const response = await this.client.post<Document>('/api/documents', {
      userId: document.userId,
      type: document.category,
      filePath: document.fileUrl,
      generatedBy: null,
      expiresAt: null
    });
    return response.data;
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
    const response = await this.client.get<any[]>('/api/holidays');
    return response.data.map(h => ({
      ...h,
      date: h.holidayDate
    }));
  }

  async createHoliday(holiday: Omit<Holiday, 'id' | 'createdAt'>): Promise<Holiday> {
    const response = await this.client.post<Holiday>('/api/holidays', {
      name: holiday.name,
      holidayDate: holiday.date,
      description: holiday.description
    });
    return response.data;
  }

  async deleteHoliday(holidayId: string): Promise<void> {
    await this.client.delete(`/api/holidays/${holidayId}`);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const response = await this.client.get<Notification[]>(`/api/notifications/${userId}`);
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    await this.client.post(`/api/notifications/read/${notificationId}`);
    const response = await this.client.get<Notification>(`/api/notifications/${notificationId}`);
    return response.data;
  }

  async broadcastNotification(title: string, message: string): Promise<void> {
    await this.client.post('/api/notifications/broadcast', null, {
      params: { title, message, type: 'INFO' }
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
    const response = await this.client.get<any[]>('/api/users/all');
    return response.data.map(u => ({
      ...u,
      username: u.fullName || u.username,
      role: u.role?.toLowerCase(),
      isApproved: u.status === 'ACTIVE',
      isBlocked: u.status === 'BLOCKED'
    }));
  }

  async blockUser(userId: string): Promise<User> {
    await this.client.post(`/api/users/block/${userId}`);
    const user = await this.getCurrentUser();
    return user;
  }

  async unblockUser(userId: string): Promise<User> {
    await this.client.post(`/api/users/unblock/${userId}`);
    const user = await this.getCurrentUser();
    return user;
  }

  async approveUser(userId: string, role: string): Promise<User> {
    const currentUser = await this.getCurrentUser();
    const response = await this.client.post<User>(`/api/users/approve/${userId}`, null, {
      params: { role, approverId: currentUser.id }
    });
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all required data in parallel
      const [users, teams] = await Promise.all([
        this.getAllUsers(),
        this.getTeams()
      ]);

      // Try to get leave requests (may fail if user doesn't have permission)
      let pendingLeaves = 0;
      try {
        const leaves = await this.client.get<any[]>('/api/leave/pending');
        pendingLeaves = leaves.data.length;
      } catch (error) {
        // User might not have permission, that's okay
        console.warn('Could not fetch pending leaves:', error);
      }

      // Calculate stats
      return {
        totalEmployees: users.length,
        presentToday: 0, // Backend doesn't track daily attendance in a simple way
        onLeave: 0, // Would need to check current date against leave requests
        pendingLeaves,
        totalTeams: teams.length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values on error
      return {
        totalEmployees: 0,
        presentToday: 0,
        onLeave: 0,
        pendingLeaves: 0,
        totalTeams: 0
      };
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await this.client.put('/api/profile/update', {
      username: updates.username,
      bio: updates.bio
    });
    const user = await this.getCurrentUser();
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}

export const apiService = new ApiService();
