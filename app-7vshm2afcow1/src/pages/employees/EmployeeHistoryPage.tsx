import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, CheckCircle, XCircle, User as UserIcon, CalendarDays, MapPin, Mail, Briefcase, Hash, Pencil, Shield } from 'lucide-react';
import { BackButton } from '@/components/common/BackButton';
import type { Attendance, AttendanceStats, User, AttendanceRecord } from '@/types';
import { format, isSunday } from 'date-fns';
import { calculateDuration } from '@/lib/utils';

const EmployeeHistoryPage: React.FC = () => {
    const { id: routeId, employeeId } = useParams<{ id: string; employeeId: string }>();
    const id = routeId || employeeId;
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDay, setLoadingDay] = useState(false);

    // Auth & Permissions
    const { user: currentUser } = useAuth();
    const [isEditingJoiningDate, setIsEditingJoiningDate] = useState(false);
    const [newJoiningDate, setNewJoiningDate] = useState('');

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
                console.error('Failed to fetch  the employee history:', error);
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
            const att = attendance.find(a => a.date === dateStr || (a.loginTime && a.loginTime.startsWith(dateStr)));

            // If no record exists, we can't update (create not supported yet). 
            // BUT wait, user might want to Mark Present on an Absent day (create).
            // Current backend update only updates EXISTING. 
            // For now let's assume valid ID exists or fallback to showing error.

            // If no record, or virtual ID, we create new
            if (!att || att.id.length > 36) {
                // Creation flow
                if (!editForm.checkIn) {
                    alert("Check-in time is required to create a new record.");
                    return;
                }

                await apiService.createAttendance({
                    userId: id!,
                    status: editForm.status,
                    checkIn: new Date(editForm.checkIn).toISOString(),
                    checkOut: editForm.checkOut ? new Date(editForm.checkOut).toISOString() : undefined,
                    remark: editForm.remark
                });
            } else {
                // Update flow
                await apiService.updateAttendance(att.id, {
                    status: editForm.status,
                    checkIn: editForm.checkIn ? new Date(editForm.checkIn).toISOString() : undefined,
                    checkOut: editForm.checkOut ? new Date(editForm.checkOut).toISOString() : undefined,
                    remark: editForm.remark
                });
            }

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

    const handleBlockUser = async () => {
        if (!user || !confirm(`Are you sure you want to block ${user.username}?`)) return;
        try {
            await apiService.blockUser(user.id);
            alert('User blocked successfully');
            // Refresh user
            const allUsers = await apiService.getAllUsers();
            const foundUser = allUsers.find(u => u.id === id);
            setUser(foundUser || null);
        } catch (error) {
            alert('Failed to block user');
        }
    };

    const handleUnblockUser = async () => {
        if (!user || !confirm(`Are you sure you want to unblock ${user.username}?`)) return;
        try {
            await apiService.unblockUser(user.id);
            alert('User unblocked successfully');
            // Refresh user
            const allUsers = await apiService.getAllUsers();
            const foundUser = allUsers.find(u => u.id === id);
            setUser(foundUser || null);
        } catch (error) {
            alert('Failed to unblock user');
        }
    };

    const handleUpdateJoiningDate = async () => {
        if (!user || !newJoiningDate) return;
        try {
            await apiService.updateJoiningDate(user.id, newJoiningDate);
            setUser({ ...user, joiningDate: newJoiningDate });
            setIsEditingJoiningDate(false);
            toast.success('Joining Date updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update Joining Date');
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

            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-slate-900 rounded-[28px] flex items-center justify-center shadow-2xl">
                        <Clock className="h-8 w-8 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">
                            Entity <span className="text-blue-600">History</span>
                        </h1>
                        <p className="text-slate-600 font-bold text-xs uppercase tracking-[0.3em] pl-1 opacity-80">Biometric Audit Protocol</p>
                    </div>
                </div>
                <BackButton to="/employees" />
            </div>

            <div className="grid gap-10 lg:grid-cols-12 items-start">

                {/* Left Column: Calendar */}
                <div className="lg:col-span-5 space-y-10">
                    <Card className="premium-card bg-white shadow-saas border-slate-100 overflow-hidden">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Matrix Period</span>
                                <CalendarDays className="h-5 w-5 text-slate-400" strokeWidth={2.5} />
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
                        <div className="grid grid-cols-2 gap-6">
                            <Card className="premium-card p-6 bg-emerald-50/50 border-emerald-100 shadow-none flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.presentDays}</p>
                                </div>
                            </Card>
                            <Card className="premium-card p-6 bg-amber-50/50 border-amber-100 shadow-none flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Delays</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.lateDays}</p>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Right Column: User Details + Attendance Data */}
                <div className="lg:col-span-7 space-y-10">

                    {/* 1. User Profile Details */}
                    <Card className="premium-card bg-white shadow-saas border-slate-100 overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
                        <CardHeader className="p-10 pb-4">
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Entity Intelligence</span>
                                <UserIcon className="h-5 w-5 text-slate-400" strokeWidth={2.5} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col xl:flex-row items-start gap-8">
                                <Avatar className="h-32 w-32 border-[6px] border-background shadow-2xl ring-4 ring-slate-50 shrink-0">
                                    <AvatarImage src={user.profilePhoto} alt={user.username} className="object-cover" />
                                    <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black">
                                        {user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-8 flex-1 w-full min-w-0 py-2">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                        <div className="space-y-2">
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{user.username}</h2>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                                    <Briefcase className="h-3.5 w-3.5" />
                                                    {user.role?.replace('_', ' ')}
                                                </span>
                                                {user.isBlocked && (
                                                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                                        <Shield className="h-3.5 w-3.5" />
                                                        Access Revoked
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            {user.isBlocked ? (
                                                <button onClick={handleUnblockUser} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4" /> Unblock Access
                                                </button>
                                            ) : (
                                                <button onClick={handleBlockUser} className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 group">
                                                    <Shield className="h-4 w-4 group-hover:fill-red-200" /> Block Access
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4">
                                        {/* Email Section - Full Width Row */}
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 hover:bg-blue-50/50 hover:border-blue-100 transition-colors group">
                                            <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 text-blue-600 shadow-sm flex items-center justify-center shrink-0">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate select-all" title={user.email || user.companyEmail}>
                                                    {user.email || user.companyEmail || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Emp ID Section - Full Width Row */}
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 hover:bg-purple-50/50 hover:border-purple-100 transition-colors group">
                                            <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 text-purple-600 shadow-sm flex items-center justify-center shrink-0">
                                                <Hash className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                                                    {user.role?.toLowerCase() === 'hr' ? 'HR Personnel ID' :
                                                        user.role?.toLowerCase().includes('marketing') ? 'Marketing ID' : 'Employee ID'}
                                                </p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tracking-wider">
                                                    {user.employeeId || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Joining Date Section - Full Width Row */}
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 hover:bg-emerald-50/50 hover:border-emerald-100 transition-colors group/date">
                                            <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 text-emerald-600 shadow-sm flex items-center justify-center shrink-0">
                                                <CalendarDays className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Joining Date</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                        {!isEditingJoiningDate && (user.joiningDate
                                                            ? new Date(user.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : <span className="text-slate-400 italic font-normal text-xs">Not Set</span>)
                                                        }
                                                    </p>
                                                </div>

                                                {/* Edit Controls aligned to right */}
                                                <div>
                                                    {isEditingJoiningDate ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="date"
                                                                className="h-9 text-xs px-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm"
                                                                value={newJoiningDate}
                                                                onChange={(e) => setNewJoiningDate(e.target.value)}
                                                                max={new Date().toISOString().split('T')[0]}
                                                            />
                                                            <button
                                                                onClick={handleUpdateJoiningDate}
                                                                className="h-9 w-9 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20"
                                                                title="Save"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setIsEditingJoiningDate(false)}
                                                                className="h-9 w-9 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center shrink-0"
                                                                title="Cancel"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        ['admin', 'hr', 'manager'].includes(currentUser?.role || '') && (
                                                            <button
                                                                onClick={() => {
                                                                    setNewJoiningDate(user.joiningDate ? user.joiningDate.toString() : '');
                                                                    setIsEditingJoiningDate(true);
                                                                }}
                                                                className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-all shadow-sm opacity-100 sm:opacity-0 sm:group-hover/date:opacity-100 flex items-center gap-2"
                                                            >
                                                                <Pencil className="h-3 w-3" /> Edit
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Selected Date Attendance Data */}
                    <Card className="premium-card bg-white shadow-saas border-slate-100 overflow-hidden min-h-[400px]">
                        <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Log Intelligence</h3>
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                                    {selectedDate ? format(selectedDate, 'MMM do, yyyy') : 'Void Cycle'}
                                </CardTitle>
                            </div>
                            {selectedRecord && (
                                <button onClick={handleEditClick} className="h-10 px-6 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                                    Override
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                                        <div className="space-y-3 p-4 bg-background/50 rounded-xl border hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Total Duration</p>
                                                <Clock className="h-4 w-4 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-2xl font-bold tracking-tight">
                                                {(selectedRecord?.checkIn && selectedRecord?.checkOut)
                                                    ? calculateDuration(selectedRecord.checkIn, selectedRecord.checkOut)
                                                    : '--'}
                                            </p>
                                            <div className="flex items-center gap-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                                <span className="truncate">Working Hours</span>
                                            </div>
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
