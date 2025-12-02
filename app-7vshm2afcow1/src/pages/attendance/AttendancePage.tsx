import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import type { Attendance, AttendanceStats } from '@/types';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceData, statsData] = await Promise.all([
          apiService.getAttendance(user?.id || ''),
          apiService.getAttendanceStats(user?.id || '')
        ]);
        setAttendance(attendanceData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCheckIn = async () => {
    try {
      const newAttendance = await apiService.checkIn(user?.id || '');
      setAttendance([newAttendance, ...attendance]);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;
    try {
      const updatedRecord = await apiService.checkOut(todayAttendance.id);
      setAttendance(attendance.map(a => a.id === updatedRecord.id ? updatedRecord : a));
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  const todayAttendance = attendance.find(
    a => {
      const date = a.date || (a.loginTime ? a.loginTime.split('T')[0] : '');
      return date === new Date().toISOString().split('T')[0];
    }
  );

  const attendanceDates = attendance.map(a => {
    const dateStr = a.date || (a.loginTime ? a.loginTime.split('T')[0] : '');
    return dateStr ? new Date(dateStr) : new Date();
  });

  if (loading) {
    return <div className="space-y-6"><h1 className="text-3xl font-bold">Attendance</h1><p>Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Track your attendance and work hours</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Days</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDays}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.presentDays}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Late Days</CardTitle>
              <XCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lateDays}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Calendar */}
        <Card className="glass-card shadow-elegant">
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                attended: attendanceDates
              }}
              modifiersStyles={{
                attended: { backgroundColor: 'hsl(var(--primary))', color: 'white' }
              }}
            />
          </CardContent>
        </Card>

        {/* Today's Status & History */}
        <div className="space-y-6">
          <Card className="glass-card shadow-elegant">
            <CardHeader>
              <CardTitle>Today's Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!todayAttendance ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">You haven't checked in today</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <Button onClick={handleCheckIn} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Check In Now
                  </Button>
                </div>
              ) : !todayAttendance.logoutTime ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Checked in at {new Date(todayAttendance.loginTime).toLocaleTimeString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <Button onClick={handleCheckOut} variant="destructive" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Check Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Check In</span>
                    <span className="text-sm font-medium">
                      {new Date(todayAttendance.loginTime).toLocaleTimeString()}
                    </span>
                  </div>
                  {todayAttendance.logoutTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Check Out</span>
                      <span className="text-sm font-medium">
                        {new Date(todayAttendance.logoutTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`text-sm font-medium capitalize ${todayAttendance.status === 'present' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                      {todayAttendance.status}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant">
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendance.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {record.date ? new Date(record.date).toLocaleDateString() :
                          record.loginTime ? new Date(record.loginTime).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.loginTime).toLocaleTimeString()}
                        {record.logoutTime && ` - ${new Date(record.logoutTime).toLocaleTimeString()}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
