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
  TicketComment,
  Branch,
  WorkUpdate
} from '@/types';
import { mockPayroll } from './mockData';

// Prefer Vite env var. NEVER fall back to hardcoded URLs.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('🔌 API Base URL:', API_BASE_URL);

if (!API_BASE_URL) {
  console.error('⚠️ VITE_API_BASE_URL is not defined! API calls will fail.');
}

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // Increased timeout for 2G/3G stability
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.loadTokens();
    this.setupInterceptors();
    this.setupRetryInterceptor();
  }

  private setupRetryInterceptor() {
    this.client.interceptors.response.use(undefined, (err) => {
      const config = err.config;
      // If config does not exist or the retry option is not set, reject
      if (!config || !config.retry) return Promise.reject(err);

      // Set the variable for keeping track of the retry count
      config.__retryCount = config.__retryCount || 0;

      // Check if we've maxed out the total number of retries
      if (config.__retryCount >= config.retry) {
        return Promise.reject(err);
      }

      // Increase the retry count
      config.__retryCount += 1;

      // Create new promise to handle exponential backoff
      const backoff = new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, config.retryDelay || 1000);
      });

      // Return the promise in which recalls axios
      return backoff.then(() => {
        return this.client(config);
      });
    });
  }

  private loadTokens() {
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return this.client(originalRequest);
            } else {
              this.logout();
              window.location.href = '/login';
              return Promise.reject(error);
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
        if (specificMessage) {
          toast.error(specificMessage);
          return;
        }
        toast.error('Access denied');
        return;
      }

      if (status === 403) {
        // Silent fail for /users/me - it just means we're not logged in or token invalid
        if (error.config?.url?.includes('/users/me')) {
          return;
        }

        const isLoginRequest = error.config?.url?.includes('/login');
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
          // Fallback for login requests if message is missing
          if (isLoginRequest) {
            toast.error('Access Denied: Your account may be pending approval, blocked, or you are outside the allowed office premises.');
          } else {
            toast.error('Access denied. You may not have permission for this action.');
          }
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
    try {
      // With withCredentials: true, the browser will automatically send the
      // refreshToken cookie to the backend.
      const response = await this.client.post('/api/v1/auth/refresh', {});

      const { accessToken } = response.data || {};
      if (accessToken) {
        this.setToken(accessToken);
        return accessToken;
      }
      return null;
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


  private clearTokens() {
    this.token = null;
    localStorage.removeItem('token');
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

  async login(email: string, password: string, latitude?: number, longitude?: number): Promise<AuthResponse> {
    const ipAddress = await this.getPublicIp();
    const response = await this.client.post<any>('/api/v1/auth/login', { email, password, ipAddress, latitude, longitude });

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
      user: undefined as any
    };

    this.setToken(authResponse.token!);

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

  async register(email: string, username: string, password: string, role: string, branchId?: string): Promise<AuthResponse> {
    // Backend expects: fullName, email, phone, password.
    // Frontend provides: email, username, password, role.
    // I will map username to fullName. Phone is missing, I'll send a placeholder or empty string.

    const registerRequest = {
      fullName: username,
      email,
      password,
      phone: "", // Placeholder as it's required by backend DTO but not in frontend form
      role: role,
      branchId: branchId
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
      user: {} as User // Placeholder, will fetch below
    };

    this.setToken(authResponse.token!);

    const user = await this.getCurrentUser();
    authResponse.user = user;

    return authResponse;
  }

  async logout() {
    try {
      await this.client.post('/api/v1/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokens();
      localStorage.removeItem('currentUser');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<any>('/api/v1/users/me', {
      // @ts-ignore
      retry: 2,
      retryDelay: 1000
    });
    const data = response.data as any;
    return {
      ...data,
      id: String(data.id || ''),
      username: String(data.fullName || data.username || 'System User'),
      email: String(data.email || 'no-email@system.com'),
      role: String(typeof data.role === 'string' ? data.role : (data.role?.name || String(data.role || ''))).toLowerCase(),
      isApproved: data.status === 'ACTIVE',
      isBlocked: data.status === 'BLOCKED'
    } as User;
  }

  async getAttendance(userId: string): Promise<Attendance[]> {
    const response = await this.client.get<any[]>(`/api/v1/attendance/${userId}`);
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
  async checkIn(userId: string, latitude?: number, longitude?: number): Promise<Attendance> {
    const params = new URLSearchParams();
    if (latitude !== undefined) params.append('lat', latitude.toString());
    if (longitude !== undefined) params.append('lng', longitude.toString());

    const response = await this.client.post<Attendance>(`/api/v1/attendance/login/${userId}?${params.toString()}`);
    return response.data;
  }

  async checkOut(attendanceId: string): Promise<Attendance> {
    const response = await this.client.post<Attendance>(`/api/v1/attendance/logout/${attendanceId}`);
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

  async getPendingLeaves(branchId?: string): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/v1/leave/pending', {
      params: { branchId }
    });
    return response.data;
  }

  async getApprovedLeaves(): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/v1/leave/approved');
    return response.data;
  }

  async getAllLeavesRequests(): Promise<Leave[]> {
    const response = await this.client.get<Leave[]>('/api/v1/leave/all');
    return response.data;
  }

  async deleteLeave(leaveId: string): Promise<void> {
    await this.client.delete(`/api/v1/leave/${leaveId}`);
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
    const response = await this.client.get<Note[]>(`/api/v1/notes/user/${userId}`);
    return response.data;
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const response = await this.client.post<Note>('/api/v1/notes', {
      userId: note.userId,
      teamId: note.teamId,
      title: note.title,
      body: note.body,
      isPinned: note.isPinned
    });
    return response.data;
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
    const response = await this.client.put<Note>(`/api/v1/notes/${noteId}`, {
      title: updates.title,
      body: updates.body,
      isPinned: updates.isPinned
    });
    return response.data;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.client.delete(`/api/v1/notes/${noteId}`);
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
    try {
      // Small TTL cache for all users to improve perceived speed on slow networks
      /* Cache disabled to prevent stale data issues
      const cacheKey = 'users_list_cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 60000) { // 1 minute cache
          return data;
        }
      }
      */

      const response = await this.client.get<any[]>('/api/v1/users/all', {
        // @ts-ignore - custom retry field
        retry: 3,
        retryDelay: 2000
      });

      if (!response.data || !Array.isArray(response.data)) {
        console.warn('API Warning: Users list is not an array, returning empty list.', response.data);
        return [];
      }

      const mapped = response.data.map((u: any) => ({
        ...u,
        id: String(u.id || ''),
        username: String(u.fullName || u.username || 'System User'),
        email: String(u.email || 'no-email@system.com'),
        role: String(typeof u.role === 'string' ? u.role : (u.role?.name || String(u.role || ''))).toLowerCase(),
        isApproved: u.status === 'ACTIVE',
        isBlocked: u.status === 'BLOCKED'
      }));

      /*
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: mapped
      }));
      */

      return mapped;
    } catch (error) {
      // On error, try to return expired cache if available
      try {
        const cached = localStorage.getItem('users_list_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.data)) {
            return parsed.data;
          }
        }
      } catch (cacheError) {
        console.warn('Failed to recover from cache:', cacheError);
      }
      throw error;
    }
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

  async approveUser(userId: string): Promise<User> {
    const response = await this.client.post<User>(`/api/v1/users/approve/${userId}`);
    console.log('✅ Approved user response:', response.data);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.delete(`/api/v1/users/delete/${userId}`);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await this.client.get<any[]>(`/api/v1/users/role/${role}`);
    return response.data.map(u => ({
      ...u,
      username: u.fullName || u.username,
      role: u.role?.toLowerCase(),
      isApproved: u.status === 'ACTIVE',
      isBlocked: u.status === 'BLOCKED'
    }));
  }

  async updateGeoRestriction(userId: string, data: { enabled: boolean, latitude: number, longitude: number, radius: number }): Promise<User> {
    const response = await this.client.put<User>(`/api/v1/users/${userId}/geo-restriction`, data);
    return response.data;
  }

  async updateGeoRestrictionBulk(userIds: string[], data: { enabled: boolean, latitude: number, longitude: number, radius: number }): Promise<void> {
    await this.client.put('/api/v1/users/bulk/geo-restriction', { userIds, data });
  }

  async updateJoiningDate(userId: string, date: string): Promise<User> {
    const response = await this.client.put<User>(`/api/v1/users/${userId}/joining-date`, { joiningDate: date });
    return response.data;
  }

  async getDashboardStats(branchId?: string): Promise<DashboardStats> {
    try {
      const response = await this.client.get<DashboardStats>('/api/v1/dashboard/stats', {
        params: { branchId }
      });
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
        totalAdmins: 0,
        totalManagers: 0
      };
    }
  }

  async submitWorkUpdate(description: string): Promise<WorkUpdate> {
    const response = await this.client.post<WorkUpdate>('/api/v1/work-updates/today', { description });
    return response.data;
  }

  async getMyTodayUpdate(): Promise<WorkUpdate | null> {
    const response = await this.client.get<WorkUpdate>('/api/v1/work-updates/my/today');
    return response.data;
  }

  async getMyWorkUpdates(): Promise<WorkUpdate[]> {
    const response = await this.client.get<WorkUpdate[]>('/api/v1/work-updates/my/history');
    return response.data;
  }

  async getAllWorkUpdates(filters?: {
    userId?: string,
    month?: number,
    year?: number,
    branchId?: string,
    role?: string
  }): Promise<WorkUpdate[]> {
    const response = await this.client.get<WorkUpdate[]>('/api/v1/work-updates', { params: filters });
    return response.data;
  }

  async deleteWorkUpdate(id: string): Promise<void> {
    await this.client.delete(`/api/v1/work-updates/${id}`);
  }

  async bulkDeleteWorkUpdates(ids: string[]): Promise<void> {
    await this.client.delete('/api/v1/work-updates/bulk', { data: ids });
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

    return await this.getCurrentUser();
  }

  // --- Branch Management ---
  async getBranches(): Promise<Branch[]> {
    const response = await this.client.get<Branch[]>('/api/v1/branches');
    return response.data;
  }

  async getUnassignedUsers(): Promise<User[]> {
    const response = await this.client.get<any[]>('/api/v1/branches/unassigned-users');
    return response.data.map(u => ({
      ...u,
      username: u.fullName || u.username,
      role: u.role?.toLowerCase(),
      isApproved: u.status === 'ACTIVE',
      isBlocked: u.status === 'BLOCKED'
    }));
  }

  async assignUsersToBranch(branchId: string, userIds: string[]): Promise<void> {
    await this.client.put(`/api/v1/branches/${branchId}/assign-users`, userIds);
  }

  async unassignUsersFromBranch(userIds: string[]): Promise<void> {
    await this.client.put('/api/v1/branches/unassign-users', userIds);
  }

  async getBranch(id: string): Promise<Branch> {
    const response = await this.client.get<Branch>(`/api/v1/branches/${id}`);
    return response.data;
  }

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const response = await this.client.post<Branch>(`/api/v1/branches`, data);
    return response.data;
  }

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const response = await this.client.put<Branch>(`/api/v1/branches/${id}`, data);
    return response.data;
  }

  async deleteBranch(id: string): Promise<void> {
    await this.client.delete(`/api/v1/branches/${id}`);
  }

  async transferUserToBranch(userId: string, branchId: string): Promise<User> {
    const response = await this.client.put<User>(`/api/v1/users/${userId}/branch/${branchId}`);
    return response.data;
  }

  async getUsersByBranch(branchId: string): Promise<User[]> {
    const response = await this.client.get<any[]>(`/api/v1/users/branch/${branchId}`);
    return response.data.map(u => ({
      ...u,
      username: u.fullName || u.username,
      role: u.role?.toLowerCase(),
      isApproved: u.status === 'ACTIVE',
      isBlocked: u.status === 'BLOCKED'
    }));
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

  async deleteTicket(ticketId: string): Promise<void> {
    await this.client.delete(`/api/v1/helpdesk/tickets/${ticketId}`);
  }
}

export const apiService = new ApiService();
