import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  MapPin,
  Search,
  LogOut,
  LogIn,
  CalendarDays,
  Activity
} from 'lucide-react';
import type { User, Attendance, Leave, Holiday, AttendanceStats } from '@/types';
import { cn, calculateDuration } from '@/lib/utils';
import { toast } from 'sonner';

// Helper to normalize dates to YYYY-MM-DD for easy comparison
const toDateKey = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type DayStatus = 'Present' | 'Absent' | 'Late' | 'Leave' | 'Sick Leave' | 'Holiday' | 'Weekend' | 'Future' | 'Unknown';

interface DayData {
  date: string;
  status: DayStatus;
  checkIn?: string;
  checkOut?: string;
  ipAddress?: string;
  logoutIpAddress?: string;
  remark?: string;
}

const AttendancePage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Management State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Data State
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const isManagementRole = currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

  // 1. Initial Data Fetch (Users for Admin, Holidays for All)
  useEffect(() => {
    const init = async () => {
      try {
        const h = await apiService.getHolidays();
        setHolidays(h);

        if (isManagementRole) {
          const u = await apiService.getAllUsers();
          setUsers(u);
          setFilteredUsers(u);
        } else if (currentUser) {
          // If Employee, automatically "select" self to trigger data fetch
          setSelectedUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to init:', error);
      }
    };
    init();
  }, [isManagementRole, currentUser]);

  // 2. Fetch User Data (Attendance + Leaves) when selectedUser changes
  useEffect(() => {
    if (!selectedUser) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Attendance (History), Stats, and Leaves in parallel
        // For Admin: fetch user's leaves. For Employee: fetch my leaves.
        const leavesPromise = isManagementRole
          ? apiService.getUserLeaves(selectedUser.id)
          : apiService.getLeaves();

        const [att, st, lvs] = await Promise.all([
          apiService.getAttendance(selectedUser.id),
          apiService.getAttendanceStats(selectedUser.id),
          leavesPromise
        ]);

        setAttendanceHistory(att);
        setStats(st);
        setLeaves(lvs.filter(l => l.status === 'approved')); // Only consider approved leaves
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('Failed to load attendance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedUser, isManagementRole]);

  // 3. Filter Users (Management Only)
  useEffect(() => {
    if (!isManagementRole) return;
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = users.filter(u =>
      (u.username?.toLowerCase().includes(lowerQuery) ||
        u.email?.toLowerCase().includes(lowerQuery)) &&
      ['employee', 'marketing', 'marketing_executive'].includes(u.role)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users, isManagementRole]);

  const employees = filteredUsers.filter(u => u.role === 'employee');
  const marketingExecs = filteredUsers.filter(u => u.role === 'marketing' || u.role === 'marketing_executive');

  // 4. Compute Calendar Map (The Core Logic)
  const calendarMap = useMemo(() => {
    const map = new Map<string, DayData>();

    // Helper to set day data safely (priority logic)
    const setDay = (date: string, data: Partial<DayData>) => {
      const existing = map.get(date) || { date, status: 'Unknown' };
      // Priority: Holiday > Sick Leave > Leave > Present/Late > Absent
      // Use existing status if it's higher priority? 
      // Actually, we'll process lists in order of priority:
      // 1. Initialize all past 60 days as Absent/Weekend?
      // No, let's just populate from sources.
      map.set(date, { ...existing, ...data });
    };

    // A. Process Attendance Records (includes Present, Late, Absent inferred by backend 60days)
    attendanceHistory.forEach(att => {
      const k = toDateKey(att.date || new Date().toISOString());
      // Backend 'status' might be 'present', 'late', 'absent', 'holiday'
      // Map backend status to our DayStatus
      let s: DayStatus = 'Present';
      if (att.status === 'late') s = 'Late';
      if (att.status === 'absent') s = 'Absent';
      if (att.status === 'holiday') s = 'Holiday';

      setDay(k, {
        status: s,
        checkIn: att.loginTime,
        checkOut: att.logoutTime,
        ipAddress: 'Recorded', // We don't have IP in the simplified Attendance list, only in detailed record
        // Wait, apiService.getAttendance maps fields. we might not have IP in the list.
        // If needed, we'd need to fetch detailed record on click.
        // But let's store what we have.
      });
    });

    // B. Process Leaves (Override Absent/Present if approved leave)
    leaves.forEach(l => {
      // Expand date range
      let curr = new Date(l.startDate);
      const end = new Date(l.endDate);
      while (curr <= end) {
        const k = toDateKey(curr);
        const type = l.type === 'sick' ? 'Sick Leave' : 'Leave';
        setDay(k, { status: type, remark: l.reason });
        curr.setDate(curr.getDate() + 1);
      }
    });

    // C. Process Holidays (Highest Priority)
    holidays.forEach(h => {
      const k = toDateKey(h.date);
      setDay(k, { status: 'Holiday', remark: h.name });
    });

    return map;
  }, [attendanceHistory, leaves, holidays]);

  const getDayStatus = (date: Date): DayData => {
    const k = toDateKey(date);

    // Check Future
    if (date > new Date()) return { date: k, status: 'Future' };

    // Check Map
    if (calendarMap.has(k)) {
      return calendarMap.get(k)!;
    }

    // Default Fallback for past dates with no data: 'Absent' (if weekday) or 'Weekend'
    const day = date.getDay();
    if (day === 0) return { date: k, status: 'Weekend' }; // Sunday

    return { date: k, status: 'Absent', checkIn: '--:--', checkOut: '--:--' };
  };

  // 5. Calendar Modifiers
  const modifiers = {
    present: (date: Date) => getDayStatus(date).status === 'Present',
    late: (date: Date) => getDayStatus(date).status === 'Late',
    absent: (date: Date) => getDayStatus(date).status === 'Absent',
    leave: (date: Date) => getDayStatus(date).status === 'Leave',
    sick: (date: Date) => getDayStatus(date).status === 'Sick Leave',
    holiday: (date: Date) => getDayStatus(date).status === 'Holiday' || getDayStatus(date).status === 'Weekend',
  };

  const modifiersClassNames = {
    present: 'bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200',
    late: 'bg-amber-100 text-amber-900 font-bold hover:bg-amber-200',
    absent: 'bg-red-50 text-red-900 font-bold hover:bg-red-100',
    leave: 'bg-blue-100 text-blue-900 font-bold hover:bg-blue-200',
    sick: 'bg-purple-100 text-purple-900 font-bold hover:bg-purple-200',
    holiday: 'bg-gray-100 text-gray-500 font-medium',
  };

  // 6. Selected Day Data (for display)
  const selectedDayData = selectedDate ? getDayStatus(selectedDate) : null;

  // Render Component
  return (
    <div className="space-y-6 container mx-auto p-6 max-w-7xl h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isManagementRole ? 'Attendance Management' : 'My Attendance'}
          </h1>
          <p className="text-muted-foreground">
            {isManagementRole
              ? 'Monitor employee attendance and track daily activities.'
              : 'View your attendance history, leaves, and statistics.'}
          </p>
        </div>

        {/* Stats for Employee View */}
        {!isManagementRole && stats && (
          <div className="hidden md:flex gap-4">
            <Badge variant="outline" className="px-3 py-1 border-emerald-200 bg-emerald-50 text-emerald-700">
              Present: {stats.presentDays}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 border-amber-200 bg-amber-50 text-amber-700">
              Late: {stats.lateDays}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 border-blue-200 bg-blue-50 text-blue-700">
              Rate: {Math.round(stats.attendanceRate)}%
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* LEFT COLUMN: Calendar & Day Details */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Calendar Card */}
            <Card className="glass-card shadow-elegant flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Attendance Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex justify-center p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date > new Date()}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  className="rounded-md border bg-background p-4 w-full max-w-[400px]"
                />
              </CardContent>
              <div className="p-4 border-t bg-muted/20 text-xs flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></div> Present</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div> Late</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div> Absent</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div> Leave</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300"></div> Sick</div>
              </div>
            </Card>

            {/* Day Details Card */}
            <Card className="glass-card shadow-elegant flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Daily Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !selectedDate || !selectedDayData ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                    <p>Select a date to view details</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1 text-sm font-medium",
                          selectedDayData.status === 'Present' && "bg-emerald-100 text-emerald-800 border-emerald-200",
                          selectedDayData.status === 'Absent' && "bg-red-100 text-red-800 border-red-200",
                          selectedDayData.status === 'Late' && "bg-amber-100 text-amber-800 border-amber-200",
                          selectedDayData.status === 'Leave' && "bg-blue-100 text-blue-800 border-blue-200",
                          selectedDayData.status === 'Sick Leave' && "bg-purple-100 text-purple-800 border-purple-200",
                          selectedDayData.status === 'Holiday' && "bg-gray-100 text-gray-800 border-gray-200",
                        )}
                      >
                        {selectedDayData.status}
                      </Badge>
                    </div>

                    <Separator />

                    {/* Check In / Out / Duration (UPDATED) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700">
                          <LogIn className="h-4 w-4" />
                          <span className="font-medium text-sm">Check In</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-900">
                          {selectedDayData.checkIn ? new Date(selectedDayData.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600/70">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{selectedDayData.ipAddress || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-100">
                        <div className="flex items-center gap-2 mb-2 text-orange-700">
                          <LogOut className="h-4 w-4" />
                          <span className="font-medium text-sm">Check Out</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-900">
                          {selectedDayData.checkOut ? new Date(selectedDayData.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-600/70">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{selectedDayData.logoutIpAddress || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2 text-blue-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium text-sm">Working Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {(selectedDayData.checkIn && selectedDayData.checkOut)
                            ? calculateDuration(selectedDayData.checkIn, selectedDayData.checkOut)
                            : '--'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600/70">
                          <span className="font-medium">Total Duration</span>
                        </div>
                      </div>
                    </div>

                    {/* Remarks / Notes */}
                    {(selectedDayData.remark || selectedDayData.status === 'Holiday' || selectedDayData.status.includes('Leave')) && (
                      <div className="p-4 rounded-lg bg-muted/30 border">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Remarks</p>
                        <p className="text-sm">
                          {selectedDayData.remark || (selectedDayData.status === 'Holiday' ? 'Office Holiday' : selectedDayData.status === 'Weekend' ? 'Weekend' : 'No remarks.')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: User List (Only for Management) */}
        {isManagementRole && (
          <div className="xl:col-span-4 flex flex-col h-full gap-4">
            <Card className="glass-card shadow-elegant h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Employees</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="p-4 space-y-6">
                    {/* Employees Group */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Employees <Badge variant="secondary" className="text-[10px] py-0">{employees.length}</Badge>
                      </h3>
                      {employees.map(u => (
                        <div key={u.id} onClick={() => setSelectedUser(u)}
                          className={cn("flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                            selectedUser?.id === u.id ? "bg-primary/10 border-primary" : "hover:bg-accent border-transparent")}>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={u.profilePhoto} />
                            <AvatarFallback>{u.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.username}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Marketing Group */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Marketing <Badge variant="secondary" className="text-[10px] py-0">{marketingExecs.length}</Badge>
                      </h3>
                      {marketingExecs.map(u => (
                        <div key={u.id} onClick={() => setSelectedUser(u)}
                          className={cn("flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                            selectedUser?.id === u.id ? "bg-primary/10 border-primary" : "hover:bg-accent border-transparent")}>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={u.profilePhoto} />
                            <AvatarFallback>{u.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.username}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
