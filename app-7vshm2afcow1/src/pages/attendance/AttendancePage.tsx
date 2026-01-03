import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Search,
  LogOut,
  LogIn,
  CalendarDays,
  Zap,
  TrendingUp,
  Shield,
  Filter,
  Loader2
} from 'lucide-react';
import type { User, Attendance, Leave, Holiday, AttendanceStats } from '@/types';
import { cn, calculateDuration } from '@/lib/utils';
import { toast } from 'sonner';

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

// --- Subunits ---
const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", color)} />
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

const DataBar = ({ icon, label, value, status }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300 ring-1 ring-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 group-hover:text-blue-500 transition-colors">{label}</p>
        <p className="text-sm font-black text-slate-900 tracking-tight uppercase">{value}</p>
      </div>
    </div>
    {status && (
      <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
        Verified
      </span>
    )}
  </div>
);

const AttendancePage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isManagementRole = currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

  useEffect(() => {
    const init = async () => {
      try {
        const h = await apiService.getHolidays();
        setHolidays(h);
        if (isManagementRole) {
          const u = await apiService.getAllUsers();
          setUsers(u);
        } else {
          setSelectedUser(currentUser);
        }
      } catch (e) {
        console.error('Pulse Init Error', e);
      }
    };
    init();
  }, [isManagementRole, currentUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const lp = isManagementRole ? apiService.getUserLeaves(selectedUser.id) : apiService.getLeaves();
        const [att, st, lvs] = await Promise.all([
          apiService.getAttendance(selectedUser.id),
          apiService.getAttendanceStats(selectedUser.id),
          lp
        ]);
        setAttendanceHistory(att);
        setStats(st);
        setLeaves(lvs.filter(l => l.status === 'approved'));
      } catch (e) {
        toast.error('Sync Error: Entity Intel Restricted');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedUser, isManagementRole]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, DayData>();
    const setDay = (date: string, data: Partial<DayData>) => {
      const existing = map.get(date) || { date, status: 'Unknown' };
      map.set(date, { ...existing, ...data });
    };

    attendanceHistory.forEach(att => {
      const k = toDateKey(att.date || new Date().toISOString());
      let s: DayStatus = 'Present';
      if (att.status === 'late') s = 'Late';
      if (att.status === 'absent') s = 'Absent';
      if (att.status === 'holiday') s = 'Holiday';
      setDay(k, { status: s, checkIn: att.loginTime, checkOut: att.logoutTime });
    });

    leaves.forEach(l => {
      let curr = new Date(l.startDate);
      while (curr <= new Date(l.endDate)) {
        setDay(toDateKey(curr), { status: l.type === 'sick' ? 'Sick Leave' : 'Leave', remark: l.reason });
        curr.setDate(curr.getDate() + 1);
      }
    });

    holidays.forEach(h => setDay(toDateKey(h.date), { status: 'Holiday', remark: h.name }));
    return map;
  }, [attendanceHistory, leaves, holidays]);

  const getDayStatus = (date: Date): DayData => {
    const k = toDateKey(date);
    if (date > new Date()) return { date: k, status: 'Future' };
    if (calendarMap.has(k)) return calendarMap.get(k)!;
    return { date: k, status: date.getDay() === 0 ? 'Weekend' : 'Absent', checkIn: '--:--', checkOut: '--:--' };
  };

  const modifiers = {
    present: (d: Date) => getDayStatus(d).status === 'Present',
    late: (d: Date) => getDayStatus(d).status === 'Late',
    absent: (d: Date) => getDayStatus(d).status === 'Absent',
    leave: (d: Date) => ['Leave', 'Sick Leave'].includes(getDayStatus(d).status),
    holiday: (d: Date) => ['Holiday', 'Weekend'].includes(getDayStatus(d).status),
  };

  const modifiersClassNames = {
    present: 'bg-emerald-500 text-white font-bold hover:bg-emerald-600 rounded-lg shadow-md shadow-emerald-500/20',
    late: 'bg-amber-500 text-white font-bold hover:bg-amber-600 rounded-lg shadow-md shadow-amber-500/20',
    absent: 'bg-red-50 text-red-400 font-bold hover:bg-red-100 rounded-lg',
    leave: 'bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-500/20',
    holiday: 'text-slate-300 font-medium',
  };

  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const [allTodayAttendance, setAllTodayAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    if (statusFilter === 'present' && isManagementRole) {
      apiService.getAllAttendance().then(data => {
        const today = new Date().toDateString();
        setAllTodayAttendance(data.filter(a => a.loginTime && new Date(a.loginTime).toDateString() === today));
      });
    }
  }, [statusFilter, isManagementRole]);

  const selectedDayData = selectedDate ? getDayStatus(selectedDate) : null;
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.username?.toLowerCase()?.includes(searchQuery.toLowerCase()) || u.email?.toLowerCase()?.includes(searchQuery.toLowerCase()));

    if (statusFilter === 'present') {
      const isPresentToday = allTodayAttendance.some(a => a.userId === u.id);
      return matchesSearch && isPresentToday;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 font-sans text-slate-900 selection:bg-sky-500/30 selection:text-sky-900">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* 📡 Header Section */}
        <header className="relative overflow-hidden rounded-[40px] bg-white border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="relative z-10 flex items-center gap-6">
            <div className="h-20 w-20 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 ring-4 ring-sky-50 transform hover:scale-105 transition-transform duration-300">
              <Clock className="h-10 w-10 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                Attendance <span className="text-sky-500">Hub</span>
              </h1>
              <div className="flex items-center gap-3 pt-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] opacity-90">System Operational • Pulse v2.4</p>
              </div>
            </div>
          </div>

          {stats && (
            <div className="flex gap-4 relative z-10">
              <div className="group flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white hover:shadow-lg rounded-2xl border border-slate-100 transition-all duration-300 min-w-[140px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Consistency</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{Math.round(stats.attendanceRate)}</span>
                  <span className="text-sm font-bold text-slate-400">%</span>
                </div>
              </div>
              <div className="group flex flex-col items-center justify-center p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 border border-blue-500/20 min-w-[140px] transform hover:-translate-y-1 transition-transform">
                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Present</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tracking-tight">{stats.presentDays}</span>
                  <span className="text-sm font-bold text-blue-200">Days</span>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">

          {/* 🗺️ Main Content Column */}
          <div className="xl:col-span-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* 📅 Calendar Card */}
              <div className="premium-card p-8 rounded-[40px] flex flex-col h-full hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Schedule</h3>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">Active Calendar</p>
                  </div>
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex-1 flex justify-center items-center w-full">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(d) => d > new Date()}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    className="p-0 w-full [&_.rdp-day_button]:!w-9 [&_.rdp-day_button]:!h-9 [&_.rdp-head_cell]:text-slate-400 [&_.rdp-head_cell]:font-medium"
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 justify-items-start">
                  <LegendItem color="bg-emerald-500" label="Present" />
                  <LegendItem color="bg-amber-500" label="Late" />
                  <LegendItem color="bg-indigo-600" label="Leave" />
                  <LegendItem color="bg-red-200" label="Absent" />
                </div>
              </div>

              {/* 📊 Data Intel Card */}
              <div className="premium-card p-8 rounded-[40px] flex flex-col h-full hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-opacity duration-500" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Analytics</h3>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">Daily Record</p>
                  </div>
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 ring-1 ring-slate-100">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center text-blue-600">
                    <Loader2 className="h-10 w-10 animate-spin" />
                  </div>
                ) : selectedDate && selectedDayData ? (
                  <div className="space-y-6 relative z-10">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group/card">
                      {/* Keep this dark card as a high-contrast element, it looks good in light mode too */}
                      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover/card:scale-110 transition-transform duration-500">
                        <Clock className="w-24 h-24" />
                      </div>
                      <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">Selected Date</p>
                      <h4 className="text-2xl font-black tracking-tight uppercase">
                        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <DataBar
                        icon={<LogIn className="w-5 h-5 text-emerald-600" />}
                        label="Check In"
                        value={selectedDayData.checkIn ? new Date(selectedDayData.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        status={['Present', 'Late'].includes(selectedDayData.status)}
                      />
                      <DataBar
                        icon={<LogOut className="w-5 h-5 text-amber-600" />}
                        label="Check Out"
                        value={selectedDayData.checkOut ? new Date(selectedDayData.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      />
                      <DataBar
                        icon={<Clock className="w-5 h-5 text-blue-600" />}
                        label="Total Hours"
                        value={selectedDayData.checkIn && selectedDayData.checkOut ? calculateDuration(selectedDayData.checkIn, selectedDayData.checkOut) : '0h 0m'}
                      />
                    </div>

                    {selectedDayData.remark && (
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-slate-700 animate-in fade-in slide-in-from-bottom-2">
                        <Zap className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">Note</p>
                          <p className="text-sm font-medium leading-snug">{selectedDayData.remark}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
                    <Shield className="h-12 w-12 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center opacity-70">Select a date to view logs</p>
                  </div>
                )}
              </div>
            </div>

            {/* 📈 Velocity/Stats Visualizer */}
            <div className="bg-white rounded-[40px] p-8 relative overflow-hidden border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
              {/* Changed from dark slate-900 to white */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-50 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none transition-all duration-1000 group-hover:bg-sky-100" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Operational <span className="text-sky-500">Velocity</span></h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Efficiency Metrics • 30 Day Cycle</p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">On Track</span>
                  </div>
                </div>

                <div className="h-48 flex items-end gap-2 sm:gap-4 px-2">
                  {[40, 60, 45, 90, 65, 80, 55, 75, 40, 85, 60, 95].map((h, i) => (
                    <div key={i} className="flex-1 group/bar relative cursor-pointer">
                      <div
                        style={{ height: `${h}%` }}
                        className="w-full bg-gradient-to-t from-sky-400 to-blue-500 rounded-t-lg group-hover/bar:from-sky-500 group-hover/bar:to-blue-600 transition-all duration-300 shadow-sm"
                      />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl pointer-events-none transform translate-y-2 group-hover/bar:translate-y-0">
                        {(h / 10).toFixed(1)} Hrs
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 👥 Sidebar / Employee Grid */}
          <div className="xl:col-span-4">
            {isManagementRole ? (
              <aside className="bg-white border border-slate-100 rounded-[40px] overflow-hidden flex flex-col shadow-sm ring-1 ring-slate-50 xl:sticky xl:top-8 h-[600px] xl:h-[calc(100vh-3rem)]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Directory</h3>
                      <p className="text-xl font-bold text-slate-900 tracking-tight">Personnel Grid</p>
                    </div>
                    <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center ring-1 ring-slate-100 shadow-sm">
                      <Filter className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                      placeholder="Find employee..."
                      className="h-12 pl-11 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 transition-all text-sm font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative w-full">
                  <ScrollArea className="h-full w-full">
                    <div className="p-4 space-y-3 min-h-full">
                      {filteredUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          title={`${u.username} • ${String(u.role || '').replace('_', ' ')}`}
                          className={cn(
                            "w-full p-3 rounded-2xl flex items-center gap-4 transition-all duration-300 border group relative overflow-hidden shrink-0",
                            selectedUser?.id === u.id
                              ? "bg-sky-50 border-sky-100 shadow-sm translate-x-1"
                              : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                          )}
                        >
                          <div className="relative shrink-0">
                            <Avatar className="h-12 w-12 rounded-xl ring-2 ring-slate-100 group-hover:ring-sky-100 transition-all">
                              <AvatarImage src={u.profilePhoto} className="object-cover" />
                              <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-sm">
                                {u.username?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0 text-left overflow-hidden">
                            <p className={cn(
                              "font-bold text-sm truncate transition-colors pr-2",
                              selectedUser?.id === u.id ? "text-sky-700" : "text-slate-900"
                            )}>
                              {u.username}
                            </p>
                            <p className={cn(
                              "text-[10px] uppercase tracking-wider font-bold mt-0.5 truncate",
                              selectedUser?.id === u.id ? "text-sky-500" : "text-slate-400"
                            )}>
                              {String(u.role || '').replace('_', ' ')}
                            </p>
                          </div>

                          {selectedUser?.id === u.id && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                                <Zap className="h-4 w-4 text-white fill-current" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </aside>
            ) : (
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden h-full min-h-[300px] flex flex-col justify-center ring-1 ring-white/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                  <Shield className="h-14 w-14 text-white/90 mb-6" />
                  <h3 className="text-2xl font-black uppercase mb-4">Secure Access</h3>
                  <p className="text-white/90 font-medium leading-relaxed">
                    Your attendance helps maintain the operational heartbeat. Ensure check-ins are timely for accurate logging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
