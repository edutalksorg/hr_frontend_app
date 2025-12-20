import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, Clock, Calendar, UsersRound, CheckCircle, XCircle } from 'lucide-react';

import type { DashboardStats, Attendance, Leave, Holiday } from '@/types';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isCheckOutDisabled, setIsCheckOutDisabled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attendanceData = await apiService.getAttendance(user?.id || '');
        const role = user?.role?.toLowerCase();
        let statsData = null;
        let pending = [] as Leave[];
        let holidayList: Holiday[] = [];
        if (role === 'admin' || role === 'hr') {
          statsData = await apiService.getDashboardStats();
          pending = await apiService.getPendingLeaves();
          holidayList = await apiService.getHolidays();
        }
        setStats(statsData);
        setPendingLeaves(pending);
        setHolidays(holidayList);

        const sortedAttendance = [...attendanceData]
          .filter(a => a.loginTime) // Filter out absent/future records filled by backend
          .sort((a, b) =>
            new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
          );
        const latestRecord = sortedAttendance[0];

        if (latestRecord) {
          const isMissedCheckout = latestRecord.status.toLowerCase().includes('checkout not done');
          const isActive = !latestRecord.logoutTime && !isMissedCheckout;
          const isToday = new Date(latestRecord.loginTime).toDateString() === new Date().toDateString();

          if (isActive) {
            setTodayAttendance(latestRecord);
          } else if (isToday && !isMissedCheckout) {
            setTodayAttendance(latestRecord);
          } else {
            // Allow check-in if previous record is 'Checkout Not Done', even if it was today
            setTodayAttendance(null);
          }
        } else {
          setTodayAttendance(null);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (todayAttendance && !todayAttendance.logoutTime) {
      const checkTime = () => {
        // First check backend flag if available
        if (todayAttendance.canCheckOut === false) {
          // If backend says explicitly no, we might respect it, 
          // BUT user requirement says "Do NOT disable Check-Out" for the 10 hour rule.
          // Assuming backend 'canCheckOut' is the authoritative source for the 10 hour rule:
          // Attendance.java: returns false if > 10 hours.
          // So if we rely on backend, it will disable it.
          // We should override this if it's just the time limit, 
          // but if 'canCheckOut' means something else (like already checked out), we must respect.
          // 'canCheckOut' in backend is: if logoutTime != null -> false. if > 10 hours -> false.

          // Since we want to allow checkout after 10 hours, we should IGNORE canCheckOut being false due to time.
          // But we can't easily distinguish why it's false from frontend without calculation.
          // So let's rely on frontend calculation and enforce "Always Enabled" for open sessions.
          setIsCheckOutDisabled(false);
          return;
        }

        // Then check client-side time for real-time updates
        const loginTime = new Date(todayAttendance.loginTime).getTime();
        const now = Date.now();
        const tenHoursMs = 10 * 60 * 60 * 1000;

        if (now - loginTime >= tenHoursMs) {
          // User requirement: Do NOT disable Check-Out
          setIsCheckOutDisabled(false);
        } else {
          setIsCheckOutDisabled(false);
        }
      };

      checkTime();
      const interval = setInterval(checkTime, 60000); // Check every minute
      return () => clearInterval(interval);
    } else {
      setIsCheckOutDisabled(false);
    }
  }, [todayAttendance]);

  const handleCheckIn = async () => {
    try {
      const attendance = await apiService.checkIn(user?.id || '');
      setTodayAttendance(attendance);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;
    try {
      const attendance = await apiService.checkOut(todayAttendance.id);
      setTodayAttendance(attendance);
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  // Removed placeholder approve user function (not needed in Dashboard)

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await apiService.updateLeaveStatus(leaveId, 'approved');
      toast.success('Leave approved');
      const pending = await apiService.getPendingLeaves();
      setPendingLeaves(pending);
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    try {
      await apiService.updateLeaveStatus(leaveId, 'rejected');
      toast.success('Leave rejected');
      const pending = await apiService.getPendingLeaves();
      setPendingLeaves(pending);
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="glass-card">
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
        <p className="text-muted-foreground">Here's what's happening today</p>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card shadow-elegant">
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Assigned Shift</p>
                <p className="text-xs text-muted-foreground">
                  {user?.shift
                    ? `${user.shift.name}: ${user.shift.startTime.slice(0, 5)} - ${user.shift.endTime.slice(0, 5)}`
                    : "No Shift Assigned (Default: 09:30 - 18:30)"}
                </p>
              </div>
            </div>
            {user?.shift?.lateGraceMinutes && (
              <div className="text-right">
                <p className="text-xs font-medium text-foreground">Grace Period</p>
                <p className="text-xs text-muted-foreground">{user.shift.lateGraceMinutes} mins</p>
              </div>
            )}
          </div>
          {!todayAttendance ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You haven't checked in yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Button onClick={handleCheckIn} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Check In
              </Button>
            </div>
          ) : !todayAttendance.logoutTime ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Checked in at {new Date(todayAttendance.loginTime).toLocaleTimeString()}
                  {Date.now() - new Date(todayAttendance.loginTime).getTime() >= 10 * 60 * 60 * 1000 && (
                    <span className="text-red-500 ml-2 font-bold">(Check-Out Pending)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Button
                onClick={handleCheckOut}
                variant="destructive"
                className="gap-2"
                disabled={isCheckOutDisabled}
              >
                <XCircle className="h-4 w-4" />
                Check Out
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">
                Checked in: {new Date(todayAttendance.loginTime).toLocaleTimeString()} -
                Checked out: {new Date(todayAttendance.logoutTime).toLocaleTimeString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {(user?.role === 'admin' || user?.role === 'hr') && stats && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Link to="/employees">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Company Size</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Employees</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/employees?role=admin">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Users className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAdmins}</div>
                <p className="text-xs text-muted-foreground mt-1">System Administrators</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/employees?role=employee">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Technical Team</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.technicalTeamCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Developers & Staff</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/employees?role=hr">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">HR Managers</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHR}</div>
                <p className="text-xs text-muted-foreground mt-1">HR Staff</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/employees?role=marketing">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Marketing Execs</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMarketing}</div>
                <p className="text-xs text-muted-foreground mt-1">Marketing Team</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/attendance/present">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.presentToday}</div>
                <p className="text-xs text-muted-foreground mt-1">Checked in</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/leave">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.onLeave}</div>
                <p className="text-xs text-muted-foreground mt-1">Approved leaves</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/teams">
            <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <UsersRound className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeams}</div>
                <p className="text-xs text-muted-foreground mt-1">Active teams</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Link to="/attendance">
          <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View your attendance history and calendar</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/leave">
          <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Leave Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Request and manage your leaves</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/teams">
          <Card className="glass-card shadow-elegant hover:shadow-glow transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Collaborate with your team members</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* HR Sections */}
      {(user?.role === 'admin' || user?.role === 'hr') && (
        <div className="space-y-8 mt-8">
          {/* Pending Leaves */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Pending Leave Requests</h2>
            {pendingLeaves.length > 0 ? (
              <div className="space-y-4">
                {pendingLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium capitalize">{leave.type} Leave</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleApproveLeave(leave.id)} className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectLeave(leave.id)} className="gap-1">
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No pending leave requests.</p>
            )}
          </div>

          {/* Upcoming Holidays */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Upcoming Holidays</h2>
            {holidays.length > 0 ? (
              <ul className="space-y-2">
                {holidays.map((h) => (
                  <li key={h.id} className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{h.name} - {new Date(h.date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No holidays scheduled.</p>
            )}
          </div>
        </div>
      )
      }    </div>
  );
};

export default DashboardPage;
