import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  Calendar,
  UsersRound,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  Zap,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats, Attendance, Leave, Holiday, Branch } from '@/types';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
  const [workUpdateSubmitted, setWorkUpdateSubmitted] = useState<boolean>(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const role = user?.role?.toLowerCase();
      if (role === 'admin' || role === 'hr' || role === 'manager') {
        try {
          const bData = await apiService.getBranches();
          setBranches(bData);
        } catch (error) {
          console.error('Failed to fetch branches');
        }
      }

      // Check Work Update Status
      try {
        const update = await apiService.getMyTodayUpdate();
        setWorkUpdateSubmitted(!!update);
      } catch (e) {
        console.warn('Failed to check work update status');
      }
    };
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attendanceData = await apiService.getAttendance(user?.id || '');
        const role = user?.role?.toLowerCase();
        let statsData = null;
        let pending = [] as Leave[];
        let holidayList: Holiday[] = [];

        if (role === 'admin' || role === 'hr' || role === 'manager') {
          statsData = await apiService.getDashboardStats(selectedBranchId);
          pending = await apiService.getPendingLeaves(selectedBranchId);
          holidayList = await apiService.getHolidays();
        } else {
          holidayList = await apiService.getHolidays();
        }

        setStats(statsData);
        setPendingLeaves(pending);
        setHolidays(holidayList);

        const sortedAttendance = [...attendanceData]
          .filter(a => a.loginTime)
          .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
        const latestRecord = sortedAttendance[0];

        if (latestRecord) {
          const isToday = new Date(latestRecord.loginTime).toDateString() === new Date().toDateString();
          const isActive = !latestRecord.logoutTime && !latestRecord.status.toLowerCase().includes('not done');
          if (isActive || isToday) setTodayAttendance(latestRecord);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, selectedBranchId]);

  const handleCheckIn = async () => {
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      // Check if user has geo-restriction enabled
      if (user?.geoRestrictionEnabled) {
        toast.info('Authenticating Location: Please allow GPS access', { duration: 5000 });

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (geoError: any) {
          console.error('Geolocation failed:', geoError);
          let msg = 'Geolocation failed: Access denied or signal lost.';
          if (geoError.code === 1) msg = 'PROTOCOL BREACH: Geolocation access must be granted for check-in.';
          toast.error(msg);
          return;
        }
      }

      const attendance = await apiService.checkIn(user?.id || '', lat, lng);
      setTodayAttendance(attendance);
      toast.success('System Authenticated: Entry Recorded');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Authentication Error';
      toast.error(`Access Denied: ${errorMsg}`);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;
    try {
      const attendance = await apiService.checkOut(todayAttendance.id);
      setTodayAttendance(attendance);
      toast.success('Session Terminated: Exit Recorded');
    } catch (error) {
      toast.error('Termination Error: Check-out failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse">
        <div className="flex justify-between items-center bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded-2xl w-64" />
            <div className="h-4 bg-slate-100 rounded-xl w-48" />
          </div>
          <div className="h-24 w-24 bg-slate-200 rounded-[30px]" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-[40px]" />)}
        </div>
      </div>
    );
  }

  const roleLabel = user?.role?.replace('_', ' ').toUpperCase() || 'EMPLOYEE';
  const role = user?.role?.toLowerCase();

  return (
    <div className="space-y-6 pb-12">
      {/* 📍 Branch Selection Section */}
      {(role === 'admin' || role === 'hr' || role === 'manager') && branches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Sector Command</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-0.5">Filter intelligence data</p>
            </div>
            {selectedBranchId && (
              <Button
                variant="ghost"
                onClick={() => setSelectedBranchId(undefined)}
                className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50/50 h-8"
              >
                Clear Filter
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedBranchId(undefined)}
              className={cn(
                "w-full p-5 rounded-[24px] border-2 transition-all duration-500 text-left relative overflow-hidden group",
                !selectedBranchId
                  ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-900 text-white shadow-xl scale-[1.02]"
                  : "bg-white border-slate-100 text-slate-900 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5"
              )}
            >
              <div className="relative z-10">
                <Shield className={cn("h-6 w-6 mb-4", !selectedBranchId ? "text-blue-400" : "text-slate-200 group-hover:text-blue-500 transition-colors")} />
                <h3 className="text-sm font-black uppercase tracking-tighter leading-none mb-1">Global HQ</h3>
                <p className={cn("text-[9px] font-bold uppercase tracking-widest", !selectedBranchId ? "text-slate-400" : "text-slate-400")}>Full Network Intel</p>
              </div>
              {!selectedBranchId && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />}
            </button>

            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className={cn(
                  "w-full p-5 rounded-[24px] border-2 transition-all duration-500 text-left relative overflow-hidden group",
                  selectedBranchId === branch.id
                    ? "bg-gradient-to-br from-blue-600 to-sky-500 border-blue-600 text-white shadow-xl scale-[1.02]"
                    : "bg-white border-slate-100 text-slate-900 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5"
                )}
              >
                <div className="relative z-10">
                  <Monitor className={cn("h-6 w-6 mb-4", selectedBranchId === branch.id ? "text-white" : "text-slate-200 group-hover:text-blue-500 transition-colors")} />
                  <h3 className="text-sm font-black uppercase tracking-tighter leading-none mb-1 truncate">{branch.name}</h3>
                  <p className={cn("text-[9px] font-bold uppercase tracking-widest", selectedBranchId === branch.id ? "text-white/70" : "text-slate-400")}>{branch.code}</p>
                </div>
                {selectedBranchId === branch.id && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ⚠️ Work Update Reminder */}
      {!workUpdateSubmitted && (
        <div className="premium-card p-4 bg-amber-50 border-amber-100/50 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 rounded-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Daily Work Update Pending</h3>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest pt-0.5">Please submit your daily work report before your shift ends.</p>
            </div>
          </div>
          <Link to="/work-updates/my">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-lg shadow-amber-500/20">
              Update Now
            </Button>
          </Link>
        </div>
      )}

      {/* 🚀 Hero Section - Sky + White Premium */}
      <section className="relative overflow-hidden premium-card bg-gradient-to-r from-sky-500 to-blue-600 p-6 md:p-8 text-white border-none shadow-xl group rounded-[32px]">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/20 rounded-full blur-[80px] animate-float" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-[24px] overflow-hidden border-4 border-white/20 shadow-xl bg-white/10 transition-all duration-500 group-hover:scale-105 group-hover:rotate-2 ring-2 ring-white/20">
                    <img
                      src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white w-8 h-8 rounded-xl border-2 border-sky-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="h-4 w-4 text-sky-600 fill-current" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px] flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white font-black text-[8px] uppercase tracking-widest bg-sky-600 px-2 py-0.5 rounded-full shadow-lg">View</span>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                <div className="relative group/preview w-full aspect-square max-h-[80vh]">
                  <img
                    src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                    className="w-full h-full object-cover rounded-[60px] border-[12px] border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                    alt="Identity Preview"
                  />
                  <div className="absolute -bottom-10 left-0 right-0 text-center">
                    <p className="text-white font-black text-xl uppercase tracking-[0.2em] drop-shadow-lg">{user?.username}</p>
                    <p className="text-sky-200 font-bold text-xs uppercase tracking-widest opacity-80">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div>
              <p className="text-sky-100 font-black text-[10px] uppercase tracking-[0.3em] mb-2 opacity-90">Dashboard</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-3">
                Welcome back, <br />
                <span className="text-white">{user?.username}!</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-white/20 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-xl">
                  {roleLabel}
                </span>
                <div className="flex items-center gap-1.5 text-sky-100 text-xs font-bold opacity-90">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          <div className="premium-glass p-5 rounded-[24px] border-white/20 bg-white/10 backdrop-blur-3xl md:w-64 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-100">Shift Protocol</p>
              <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", todayAttendance && !todayAttendance.logoutTime ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-sky-200")} />
            </div>

            {!todayAttendance ? (
              <Button onClick={handleCheckIn} className="w-full h-12 rounded-xl bg-white hover:bg-sky-50 text-sky-600 font-black uppercase text-[10px] tracking-[0.2em] gap-2 shadow-xl shadow-black/5 active:scale-95 transition-all">
                <CheckCircle className="h-4 w-4" />
                Initiate Check-In
              </Button>
            ) : !todayAttendance.logoutTime ? (
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {new Date(todayAttendance.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] font-bold text-sky-100 pt-0.5">Session Active</p>
                </div>
                <Button onClick={handleCheckOut} className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-50 font-black uppercase text-[10px] tracking-[0.2em] gap-2 active:scale-95 transition-all shadow-lg">
                  <XCircle className="h-4 w-4" />
                  End Mission
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-emerald-300 font-black text-xs uppercase tracking-widest">Shift Accomplished</p>
                <p className="text-[10px] font-bold text-sky-100 pt-1 uppercase">Core rest protocol active</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 📊 High-Intensity KPI Matrix */}
      {
        (role === 'admin' || role === 'hr' || role === 'manager') && stats && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <KPICard title="Company Size" value={stats.totalEmployees} sub="Total Employees" icon={<Users />} color="text-blue-600" bg="bg-blue-50" href="/employees" />
            <KPICard title="Admins" value={stats.totalAdmins} sub="System Administrators" icon={<Shield />} color="text-red-500" bg="bg-red-50" href="/admins" />
            <KPICard title="Technical Team" value={stats.technicalTeamCount} sub="Developers & Staff" icon={<Monitor />} color="text-indigo-600" bg="bg-indigo-50" href="/developers" />
            <KPICard title="HR Managers" value={stats.totalHR} sub="HR Staff" icon={<UsersRound />} color="text-purple-500" bg="bg-purple-50" href="/hr" />
            <KPICard title="Marketing Execs" value={stats.totalMarketing} sub="Marketing Team" icon={<Zap />} color="text-orange-500" bg="bg-orange-50" href="/employees?role=marketing" />
            <KPICard title="Present Today" value={stats.presentToday} sub="Checked in" icon={<Clock />} color="text-emerald-500" bg="bg-emerald-50" href="/attendance/present" />
            <KPICard title="On Leave" value={stats.onLeave} sub="Approved leaves" icon={<Calendar />} color="text-blue-500" bg="bg-blue-50" href="/leave?status=approved" />
            <KPICard title="Total Teams" value={stats.totalTeams} sub="Active teams" icon={<Users />} color="text-sky-500" bg="bg-sky-50" href="/teams" />
          </div>
        )
      }

      {/* 🧩 Intelligent Layout Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Focus: Intelligence & Operations */}
        <div className="lg:col-span-8 space-y-6">

          {/* Main Action Hub */}
          <div className="premium-card p-6 bg-white shadow-saas border-slate-100/50 rounded-[32px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-900">Attendance</h2>
                <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest pt-0.5">View your history & calendar</p>
              </div>
              <Link to="/attendance" className="group flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all">
                Full Details <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>

            {pendingLeaves.length > 0 ? (
              <div className="grid gap-4">
                {pendingLeaves.slice(0, 4).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 rounded-[24px] bg-slate-50/50 border border-slate-100 group hover:border-blue-200 hover:bg-white hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900 uppercase tracking-tight text-xs">{leave.type} Request</p>
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest">Urgent</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold pt-0.5">
                          {new Date(leave.startDate).toLocaleDateString()} — {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days Cycle
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => apiService.updateLeaveStatus(leave.id, 'approved').then(() => toast.success('Approved'))} className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => apiService.updateLeaveStatus(leave.id, 'rejected').then(() => toast.success('Rejected'))} className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/30 rounded-[30px] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg border border-slate-50">
                  <Shield className="h-8 w-8 text-slate-200" />
                </div>
                <h2 className="text-xl font-black tracking-tighter text-slate-900">Pending Leave Requests</h2>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest pt-1">No pending leave requests.</p>
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <ActionFeature title="Intelligence Hub" desc="Team directory" link="/teams" icon={<UsersRound />} color="group-hover:text-blue-600" />
            <ActionFeature title="Knowledge Base" desc="Internal docs" link="/documents" icon={<FileText />} color="group-hover:text-indigo-600" />
            <ActionFeature title="Trajectory" desc="Growth metrics" link="/performance" icon={<TrendingUp />} color="group-hover:text-emerald-500" />
            <ActionFeature title="Matrix Config" desc="System prefs" link="/settings" icon={<Zap />} color="group-hover:text-amber-500" />
          </div>
        </div>

        {/* Right Focus: Personal Matrix & Intel */}
        <div className="lg:col-span-4 space-y-6">

          {/* Current Session Widget */}
          <div className="premium-card bg-white p-6 text-slate-900 relative overflow-hidden group border-slate-100 shadow-xl rounded-[32px]">
            {/* Decorative Background for Widget */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center transition-transform group-hover:rotate-12">
                  <Clock className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight leading-none uppercase text-slate-900">Current Shift</h3>
                  <p className="text-[9px] font-black text-slate-400 tracking-[0.2em] pt-1 uppercase">Operational Time</p>
                </div>
              </div>
              <h4 className="text-3xl font-black mb-1 tracking-tighter text-slate-900">
                {user?.shift?.name || 'Standard 09'}
              </h4>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                {user?.shift ? `${user.shift.startTime.slice(0, 5)} — ${user.shift.endTime.slice(0, 5)}` : '09:30 — 18:30'}
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>Threshold Early</span>
                  <span className="text-slate-900">15 Minutes</span>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center pt-1">System calibrated to GMT +5:30</p>
              </div>
            </div>
          </div>

          {/* Upcoming Events Matrix */}
          <div className="premium-card p-6 bg-white border-slate-100 shadow-saas rounded-[32px]">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Upcoming Holidays</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 opacity-80">No holidays scheduled.</p>
            <div className="space-y-4">
              {holidays.length > 0 ? holidays.slice(0, 4).map(h => (
                <div key={h.id} className="flex items-center gap-4 group cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0 transition-colors group-hover:bg-blue-600 group-hover:border-blue-700">
                    <span className="text-[9px] font-black text-slate-400 uppercase leading-none group-hover:text-white/70">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-sm font-black text-slate-900 leading-none pt-0.5 group-hover:text-white">{new Date(h.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate tracking-tight">{h.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System-wide Holiday</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 font-bold italic py-6 opacity-50">Empty Event Log</p>
              )}
            </div>
          </div>

          {/* Alert Center */}
          <div className="premium-card p-6 bg-orange-50 border-orange-100/50 shadow-none hover:-translate-y-0 hover:shadow-none rounded-[32px]">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <h3 className="text-xs font-black text-orange-900 uppercase tracking-widest">Protocol Alerts</h3>
            </div>
            <p className="text-[10px] text-orange-700 font-bold leading-relaxed mb-4">
              Please ensure your biometric templates are updated for the next iteration cycle.
            </p>
            <button className="text-[9px] font-black text-orange-900 uppercase tracking-widest underline decoration-orange-300 underline-offset-4">Acknowledge</button>
          </div>

        </div>

      </div>
    </div >
  );
};

// 🛠️ Internal Premium Components
const KPICard = ({ title, value, sub, icon, color, bg, href }: any) => (
  <Link
    to={href || '#'}
    className="premium-card p-5 group cursor-pointer shadow-saas border-none bg-white relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 active:scale-[0.97] block"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-50 transition-colors duration-500" />

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-510 group-hover:rotate-6 group-hover:scale-110", bg, color)}>
          {React.cloneElement(icon, { className: "h-4 w-4", strokeWidth: 2.5 })}
        </div>
        <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <ChevronRight className="h-3 w-3 text-slate-400" strokeWidth={3} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-900 tracking-tight mb-0.5 group-hover:text-blue-600 transition-colors truncate">{title}</h3>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-2xl font-black text-slate-900 tracking-tighter">{value || '0'}</span>
        </div>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{sub}</p>
      </div>
    </div>
  </Link>
);

const ActionFeature = ({ title, desc, link, icon, color }: any) => (
  <Link to={link} className="premium-card p-5 bg-white border-slate-50 hover:border-blue-500/20 group shadow-sm hover:shadow-md transition-all duration-500">
    <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110", color)}>
      {React.cloneElement(icon, { className: "h-4 w-4" })}
    </div>
    <h4 className="text-sm font-black text-slate-900 tracking-tight mb-1 group-hover:text-blue-600 transition-colors uppercase">{title}</h4>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100">{desc}</p>
  </Link>
);

export default DashboardPage;
