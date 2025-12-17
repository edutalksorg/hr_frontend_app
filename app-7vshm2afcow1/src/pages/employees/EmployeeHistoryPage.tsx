import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, CheckCircle, XCircle, User as UserIcon, CalendarDays, MapPin, Mail, Briefcase, Hash } from 'lucide-react';
import { BackButton } from '@/components/common/BackButton';
import type { Attendance, AttendanceStats, User, AttendanceRecord } from '@/types';
import { format, isSunday } from 'date-fns';

const EmployeeHistoryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDay, setLoadingDay] = useState(false);

    // State for Edit Dialog
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<{ status: string; checkIn: string; checkOut: string; remark: string }>({
        status: '', checkIn: '', checkOut: '', remark: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch user details first (by finding in all users)
                const allUsers = await apiService.getAllUsers();
                const foundUser = allUsers.find(u => u.id === id);
                setUser(foundUser || null);

                const [attendanceData, statsData] = await Promise.all([
                    apiService.getAttendance(id),
                    apiService.getAttendanceStats(id)
                ]);
                setAttendance(attendanceData);
                setStats(statsData);
            } catch (error) {
                console.error('Failed to fetch employee history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        const fetchDayData = async () => {
            if (!id || !selectedDate) return;
            setLoadingDay(true);
            setSelectedRecord(null);
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const data = await apiService.getAttendanceByDate(id, dateStr);
                setSelectedRecord(data);
            } catch (error) {
                console.error("Failed to fetch day attendance:", error);
                setSelectedRecord(null);
            } finally {
                setLoadingDay(false);
            }
        };
        fetchDayData();
    }, [id, selectedDate]);

    const presentDates: Date[] = [];
    const incompleteDates: Date[] = [];
    const attendanceDateSet = new Set<string>();

    attendance.forEach(a => {
        const dateStr = a.date || (a.loginTime ? a.loginTime.split('T')[0] : '');
        if (!dateStr) return;

        attendanceDateSet.add(dateStr);
        const day = new Date(dateStr);

        // Check for present (both login and logout)
        if (a.loginTime && a.logoutTime) {
            presentDates.push(day);
        } else if (a.loginTime && !a.logoutTime) {
            // Check for incomplete (login but no logout)
            incompleteDates.push(day);
        }
    });

    const isAbsent = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Absent if: Past date, NOT today, NOT in attendance records, NOT Sunday
        return day < today && !attendanceDateSet.has(dateStr) && !isSunday(day);
    };

    const isRecordSunday = selectedDate ? isSunday(selectedDate) : false;

    if (loading) {
        return (
            <div className="space-y-6">
                <BackButton to="/employees" />
                <h1 className="text-3xl font-bold">Employee History</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="space-y-6">
                <BackButton to="/employees" />
                <h1 className="text-3xl font-bold">User Not Found</h1>
            </div>
        )
    }



    const handleEditClick = () => {
        if (!selectedRecord) return;
        setEditForm({
            status: selectedRecord.status || 'Present',
            checkIn: selectedRecord.checkIn ? new Date(selectedRecord.checkIn).toISOString().slice(0, 16) : '',
            checkOut: selectedRecord.checkOut ? new Date(selectedRecord.checkOut).toISOString().slice(0, 16) : '',
            remark: selectedRecord.remark || ''
        });
        setIsEditOpen(true);
    };

    const handleUpdateAttendance = async () => {
        if (!user || !selectedDate) return;
        try {
            // We need the attendance ID. Since selectedRecord works by date, we might not have ID directly if it was a DTO.
            // But api.getAttendance returns Attendance[] with ID.
            // Let's find the ID from 'attendance' state matching the date.
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const att = attendance.find(a => a.date === dateStr || a.loginTime.startsWith(dateStr));

            // If no record exists, we can't update (create not supported yet). 
            // BUT wait, user might want to Mark Present on an Absent day (create).
            // Current backend update only updates EXISTING. 
            // For now let's assume valid ID exists or fallback to showing error.

            if (!att) {
                // Determine if we should create? Currently backend requires ID.
                // We'll show robust error for now.
                // toast.error('Cannot edit absent day (Create not supported yet)');
                // Actually, if it's absent, we can't edit it with 'updateAttendance'. 
                // We would need 'createAttendance'.
                // Let's restrict to editing existing records for now as per "Correction" requirement.
                alert("Can only edit days with check-in data.");
                return;
            }

            await apiService.updateAttendance(att.id, {
                status: editForm.status,
                checkIn: editForm.checkIn ? new Date(editForm.checkIn).toISOString() : undefined,
                checkOut: editForm.checkOut ? new Date(editForm.checkOut).toISOString() : undefined,
                remark: editForm.remark
            });

            setIsEditOpen(false);
            // Refresh
            const [attendanceData, statsData] = await Promise.all([
                apiService.getAttendance(id!),
                apiService.getAttendanceStats(id!)
            ]);
            setAttendance(attendanceData);
            setStats(statsData);
            // Re-fetch day
            const dayData = await apiService.getAttendanceByDate(id!, dateStr);
            setSelectedRecord(dayData);

        } catch (error) {
            console.error(error);
            alert("Failed to update attendance");
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Edit Dialog */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Edit Attendance</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={editForm.status}
                                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            >
                                <option value="Present">Present</option>
                                <option value="Late">Late</option>
                                <option value="Absent">Absent</option>
                                <option value="Holiday">Holiday</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Check In</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded"
                                value={editForm.checkIn}
                                onChange={e => setEditForm({ ...editForm, checkIn: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Check Out</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded"
                                value={editForm.checkOut}
                                onChange={e => setEditForm({ ...editForm, checkOut: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Remark</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={editForm.remark}
                                onChange={e => setEditForm({ ...editForm, remark: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded hover:bg-accent">Cancel</button>
                            <button onClick={handleUpdateAttendance} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">Save</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-2">
                <BackButton to="/employees" />
                <h1 className="text-xl font-semibold text-muted-foreground">Employee Attendance Record</h1>
            </div>

            <div className="grid gap-8 lg:grid-cols-12 items-start">

                {/* Left Column: Calendar */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="glass-card shadow-elegant border-primary/10">
                        {/* ... Calendar Header ... */}
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                Select Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-6">
                            <div className="flex justify-center w-full">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-lg border p-4 pointer-events-auto bg-background/40 shadow-sm w-full max-w-full"
                                    classNames={{
                                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                                        month: "space-y-6 w-full",
                                        caption: "flex justify-center pt-1 relative items-center w-full mb-4",
                                        caption_label: "text-xl font-bold",
                                        nav: "space-x-1 flex items-center",
                                        nav_button: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input rounded-md hover:bg-accent hover:text-accent-foreground",
                                        table: "w-full border-collapse space-y-2",
                                        head_row: "flex w-full justify-between mb-2",
                                        head_cell: "text-muted-foreground rounded-md w-12 font-medium text-[1rem] flex items-center justify-center",
                                        row: "flex w-full justify-between mt-2",
                                        cell: "h-12 w-12 text-center text-base p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-base",
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                        day_today: "bg-accent/50 text-accent-foreground font-bold",
                                        day_outside: "text-muted-foreground opacity-50",
                                        day_disabled: "text-muted-foreground opacity-50",
                                        day_hidden: "invisible",
                                    }}
                                    disabled={(date) => date > new Date()}
                                    modifiers={{
                                        present: presentDates,
                                        incomplete: incompleteDates,
                                        absent: isAbsent,
                                        isToday: new Date()
                                    }}
                                    modifiersClassNames={{
                                        present: "bg-green-500 text-white hover:bg-green-600 hover:text-white font-bold",
                                        incomplete: "bg-orange-400 text-white hover:bg-orange-500 hover:text-white font-bold",
                                        absent: "bg-red-500 text-white hover:bg-red-600 hover:text-white font-bold",
                                        isToday: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-bold tracking-wide ring-2 ring-blue-300"
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Summary (Moved to bottom of calendar column) */}
                    {stats && (
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 shadow-none">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase">Present</p>
                                        <p className="text-xl font-bold text-foreground">{stats.presentDays}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 shadow-none">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-700 dark:text-red-300">
                                        <XCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase">Late</p>
                                        <p className="text-xl font-bold text-foreground">{stats.lateDays}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Right Column: User Details + Attendance Data */}
                <div className="lg:col-span-7 space-y-6">

                    {/* 1. User Profile Details */}
                    <Card className="glass-card shadow-elegant overflow-hidden border-primary/10">
                        <div className="h-2 bg-gradient-to-r from-primary to-purple-600" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                Employee Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                                <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/10">
                                    <AvatarImage src={user.profilePhoto} alt={user.username} className="object-cover" />
                                    <AvatarFallback className="text-3xl bg-primary/5 text-primary font-bold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-4 text-center sm:text-left flex-1">
                                    <div>
                                        <h2 className="text-3xl font-bold text-foreground tracking-tight">{user.username}</h2>
                                        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-1">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                            <span className="font-medium capitalize">{user.role?.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
                                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs text-muted-foreground font-semibold uppercase">Email</p>
                                                <p className="text-sm font-medium truncate max-w-[180px]" title={user.email || user.companyEmail}>
                                                    {user.email || user.companyEmail || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
                                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                                <Hash className="h-4 w-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs text-muted-foreground font-semibold uppercase">
                                                    {user.role?.toLowerCase() === 'hr' ? 'HR ID' :
                                                        user.role?.toLowerCase().includes('marketing') ? 'MKT ID' : 'EMP ID'}
                                                </p>
                                                <p className="text-sm font-medium">{user.employeeId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Selected Date Attendance Data */}
                    <Card className="glass-card shadow-elegant border-primary/10 min-h-[300px]">
                        <CardHeader className="border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Activity: <span className="text-primary">{selectedDate ? format(selectedDate, 'MMM do, yyyy') : 'None'}</span>
                            </CardTitle>
                            {selectedRecord && (
                                <button onClick={handleEditClick} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:opacity-90">
                                    Edit
                                </button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loadingDay ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground animate-pulse">
                                    <Clock className="h-8 w-8 animate-spin" />
                                    <p>Fetching attendance records...</p>
                                </div>
                            ) : !selectedDate ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                                    <CalendarDays className="h-10 w-10 opacity-20" />
                                    <p>Please select a date from the calendar</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Status Banner */}
                                    <div className={`flex items-center justify-between p-4 rounded-xl border ${selectedRecord?.status?.toUpperCase() === 'PRESENT' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/30' :
                                        selectedRecord?.status?.toUpperCase() === 'LATE' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/30' :
                                            selectedRecord?.status?.toUpperCase() === 'HOLIDAY' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/30' :
                                                'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${selectedRecord?.status?.toUpperCase() === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                                selectedRecord?.status?.toUpperCase() === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                                                    selectedRecord?.status?.toUpperCase() === 'HOLIDAY' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {selectedRecord?.status?.toUpperCase() === 'PRESENT' ? <CheckCircle className="h-5 w-5" /> :
                                                    selectedRecord?.status?.toUpperCase() === 'LATE' ? <Clock className="h-5 w-5" /> :
                                                        selectedRecord?.status?.toUpperCase() === 'HOLIDAY' ? <CalendarDays className="h-5 w-5" /> :
                                                            <XCircle className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold uppercase tracking-wide opacity-70">Status</p>
                                                <p className="text-lg font-bold">
                                                    {selectedRecord?.status || (isRecordSunday ? 'HOLIDAY' : 'ABSENT')}
                                                </p>
                                            </div>
                                        </div>
                                        {(selectedRecord?.remark || isRecordSunday) && (
                                            <div className="text-right max-w-[200px]">
                                                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Remark</p>
                                                <p className="text-sm font-medium truncate" title={selectedRecord?.remark}>
                                                    {selectedRecord?.remark || 'Weekend'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Timings */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3 p-4 bg-background/50 rounded-xl border hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">Check In Time</p>
                                                <CheckCircle className="h-4 w-4 text-green-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-2xl font-bold tracking-tight">
                                                {selectedRecord?.checkIn ? new Date(selectedRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </p>
                                            {selectedRecord?.ipAddress && (
                                                <div className="flex items-center gap-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3 text-primary" />
                                                    <span className="truncate" title={selectedRecord.ipAddress}>IP: {selectedRecord.ipAddress}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 p-4 bg-background/50 rounded-xl border hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Check Out Time</p>
                                                <XCircle className="h-4 w-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-2xl font-bold tracking-tight">
                                                {selectedRecord?.checkOut ? new Date(selectedRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </p>
                                            {selectedRecord?.logoutIpAddress && (
                                                <div className="flex items-center gap-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3 text-primary" />
                                                    <span className="truncate" title={selectedRecord.logoutIpAddress}>IP: {selectedRecord.logoutIpAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* IP History Display for Admin/HR */}
                                    {selectedRecord?.ipHistory && selectedRecord.ipHistory.length > 0 && (
                                        <div className="space-y-3 p-4 bg-background/50 rounded-xl border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <h3 className="font-semibold text-sm">Session IP History</h3>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {selectedRecord.ipHistory.map((item, index) => (
                                                    <div key={index} className="flex justify-between text-xs text-muted-foreground border-b border-border/50 pb-1 last:border-0 last:pb-0">
                                                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="font-mono">{item.ip}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EmployeeHistoryPage;
