import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Plus, Trash2, UserCog, Settings, CalendarClock, Briefcase } from 'lucide-react';

import { apiService } from '@/services/api';
import { Shift, User } from '@/types';
import { toast } from 'sonner';


const ShiftManagementPage: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [users, setUsers] = useState<User[]>([]);


    // New Shift State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentShift, setCurrentShift] = useState<{ id?: string, name: string, startTime: string, endTime: string, lateGraceMinutes: number, halfDayTime?: string, absentTime?: string, lateCountLimit?: number }>({
        name: '', startTime: '', endTime: '', lateGraceMinutes: 15, lateCountLimit: 3
    });
    const isEditing = !!currentShift.id;

    // Load Data
    const loadData = async () => {

        try {
            const [shiftsData, usersData] = await Promise.all([
                apiService.getAllShifts(),
                apiService.getAllUsers()
            ]);
            setShifts(shiftsData);
            setUsers(usersData.filter(u => ['employee', 'marketing', 'marketing_executive'].includes(u.role)));
        } catch (error) {
            console.error(error);
            toast.error('Failed to load shift data');
        } finally {

        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveShift = async () => {
        try {
            if (!currentShift.name || !currentShift.startTime || !currentShift.endTime) {
                toast.error('Please fill all fields');
                return;
            }
            // Ensure time format HH:MM:00
            const formatTime = (t?: string) => {
                if (!t) return undefined;
                return t.length === 5 ? `${t}:00` : t;
            };

            const payload = {
                ...currentShift,
                startTime: formatTime(currentShift.startTime)!,
                endTime: formatTime(currentShift.endTime)!,
                halfDayTime: formatTime(currentShift.halfDayTime),
                absentTime: formatTime(currentShift.absentTime)
            };

            if (isEditing && currentShift.id) {
                await apiService.updateShift(currentShift.id, payload);
                toast.success('Shift updated');
            } else {
                await apiService.createShift(payload);
                toast.success('Shift created');
            }
            setIsDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error(isEditing ? 'Failed to update shift' : 'Failed to create shift');
        }
    };

    const handleEditShift = (shift: Shift) => {
        setCurrentShift({
            id: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            lateGraceMinutes: shift.lateGraceMinutes || 15,
            halfDayTime: shift.halfDayTime,
            absentTime: shift.absentTime,
            lateCountLimit: shift.lateCountLimit || 3
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setCurrentShift({ name: '', startTime: '', endTime: '', lateGraceMinutes: 15, lateCountLimit: 3, halfDayTime: '', absentTime: '' });
    };

    const handleDeleteShift = async (id: string) => {
        try {
            await apiService.deleteShift(id);
            toast.success('Shift deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete shift');
        }
    };

    const handleAssignShift = async (userId: string, shiftId: string) => {
        try {
            await apiService.assignShift(userId, shiftId === 'none' ? null : shiftId);
            toast.success('Shift assigned');
            loadData();
        } catch (error) {
            toast.error('Failed to assign shift');
        }
    };

    return (
        <div className={cn("space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto container", hideHeader ? "pt-0 px-2" : "p-6 pb-20")}>
            {/* Header */}
            {hideHeader ? (
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white border border-slate-200 p-6 rounded-[24px] shadow-sm mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <CalendarClock className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Shift Manager</h2>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:scale-105 active:scale-95 shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> New Roster
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[32px] border-border bg-card">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">{isEditing ? 'Update Roster' : 'New Shift Configuration'}</DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground uppercase text-xs tracking-wider">Define operational timings and attendance protocols.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Shift Identity</Label>
                                    <Input
                                        placeholder="e.g. MORNING OPERATIONS"
                                        value={currentShift.name}
                                        onChange={e => setCurrentShift({ ...currentShift, name: e.target.value.toUpperCase() })}
                                        className="h-12 rounded-xl font-bold bg-muted border-transparent focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Start Time</Label>
                                        <Input type="time"
                                            value={currentShift.startTime}
                                            onChange={e => setCurrentShift({ ...currentShift, startTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">End Time</Label>
                                        <Input type="time"
                                            value={currentShift.endTime}
                                            onChange={e => setCurrentShift({ ...currentShift, endTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Late Arrival Tolerance (MIN)</Label>
                                    <Input type="number"
                                        value={currentShift.lateGraceMinutes}
                                        onChange={e => setCurrentShift({ ...currentShift, lateGraceMinutes: parseInt(e.target.value) })}
                                        className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Half Day Cutoff</Label>
                                        <Input type="time"
                                            value={currentShift.halfDayTime || ''}
                                            onChange={e => setCurrentShift({ ...currentShift, halfDayTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Absent Mark Cutoff</Label>
                                        <Input type="time"
                                            value={currentShift.absentTime || ''}
                                            onChange={e => setCurrentShift({ ...currentShift, absentTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveShift} className="h-12 rounded-xl w-full bg-primary font-bold uppercase tracking-widest">{isEditing ? 'Save Changes' : 'Initialize Shift'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
                                <CalendarClock className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter text-foreground">Shift <span className="text-primary">Manager</span></h1>
                        </div>
                        <p className="text-muted-foreground font-bold text-sm tracking-tight opacity-70 uppercase tracking-[0.1em]">Schedule & Rostering Control</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 shadow-primary/20">
                                <Plus className="mr-3 h-5 w-5" /> Create Roster
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[32px] border-border bg-card">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">{isEditing ? 'Update Roster' : 'New Shift Configuration'}</DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground uppercase text-xs tracking-wider">Define operational timings and attendance protocols.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Shift Identity</Label>
                                    <Input
                                        placeholder="e.g. MORNING OPERATIONS"
                                        value={currentShift.name}
                                        onChange={e => setCurrentShift({ ...currentShift, name: e.target.value.toUpperCase() })}
                                        className="h-12 rounded-xl font-bold bg-muted border-transparent focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Start Time</Label>
                                        <Input type="time"
                                            value={currentShift.startTime}
                                            onChange={e => setCurrentShift({ ...currentShift, startTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">End Time</Label>
                                        <Input type="time"
                                            value={currentShift.endTime}
                                            onChange={e => setCurrentShift({ ...currentShift, endTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Late Arrival Tolerance (MIN)</Label>
                                    <Input type="number"
                                        value={currentShift.lateGraceMinutes}
                                        onChange={e => setCurrentShift({ ...currentShift, lateGraceMinutes: parseInt(e.target.value) })}
                                        className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Half Day Cutoff</Label>
                                        <Input type="time"
                                            value={currentShift.halfDayTime || ''}
                                            onChange={e => setCurrentShift({ ...currentShift, halfDayTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Absent Mark Cutoff</Label>
                                        <Input type="time"
                                            value={currentShift.absentTime || ''}
                                            onChange={e => setCurrentShift({ ...currentShift, absentTime: e.target.value })}
                                            className="h-12 rounded-xl bg-muted border-transparent focus:bg-background"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveShift} className="h-12 rounded-xl w-full bg-primary font-bold uppercase tracking-widest">{isEditing ? 'Save Changes' : 'Initialize Shift'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </header>
            )}

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Manage Shifts & Rules */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[32px] border border-border shadow-sm overflow-hidden bg-card/50">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight text-foreground">
                                <Clock className="h-5 w-5 text-primary" />
                                Active Rosters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {shifts.map(shift => (
                                        <TableRow key={shift.id} className="hover:bg-muted/50 border-border/50">
                                            <TableCell className="font-bold py-4 pl-6">
                                                <div className="text-sm text-foreground">{shift.name}</div>
                                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)}</div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex gap-1 justify-end">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditShift(shift)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteShift(shift.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {shifts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-xs font-bold uppercase tracking-widest">No shift patterns defined</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border border-border shadow-sm overflow-hidden bg-card/50">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight text-foreground">
                                <Settings className="h-5 w-5 text-primary" />
                                Protocol Logic
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-secondary tracking-widest">Attendance</Label>
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                    Efficiency = (Present + Late) / Total Days * 100
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-destructive tracking-widest">Penalty</Label>
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                    Unassigned personnel marked Late after <span className="text-foreground font-bold">09:45 AM</span>.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignments */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Mapped Shifts */}
                    {shifts.map(shift => (
                        <Card key={shift.id} className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <CardHeader className="bg-muted/10 border-b border-border/50 flex flex-row items-center justify-between py-6 px-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">{shift.name}</CardTitle>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)} • {shift.lateGraceMinutes} min grace</p>
                                    </div>
                                </div>
                                <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                    {users.filter(u => u.shift?.id === shift.id).length} Active
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 px-8 bg-muted/20 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border/50">
                                    <div>Personnel</div>
                                    <div>Role</div>
                                    <div>ID</div>
                                    <div className="text-right">Action</div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {users.filter(u => u.shift?.id === shift.id).length === 0 ? (
                                        <div className="p-10 text-center text-muted-foreground">
                                            <Briefcase className="h-10 w-10 opacity-20 mx-auto mb-3" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Sector Unmanned</p>
                                        </div>
                                    ) : (
                                        users.filter(u => u.shift?.id === shift.id).map(u => (
                                            <div key={u.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 px-8 border-b border-border/50 items-center hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                        <AvatarImage src={u.profilePhoto} />
                                                        <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                                                            {u.username.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-sm text-foreground leading-tight">{u.username}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground">{u.email}</p>
                                                    </div>
                                                </div>
                                                <div className="hidden md:block">
                                                    <span className="px-2.5 py-1 rounded-lg bg-muted border border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                                        {u.role.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="hidden md:block text-xs font-bold text-muted-foreground font-mono">
                                                    {u.employeeId || '---'}
                                                </div>
                                                <div className="flex justify-end">
                                                    <Select onValueChange={(val) => handleAssignShift(u.id, val)} value={u.shift?.id || "none"}>
                                                        <SelectTrigger className="w-[160px] h-9 rounded-xl text-[10px] uppercase font-bold tracking-wider bg-background border-border">
                                                            <SelectValue placeholder="Assign" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Unassigned</SelectItem>
                                                            {shifts.map(s => (
                                                                <SelectItem key={s.id} value={s.id}>
                                                                    {s.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Unassigned */}
                    <Card className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all opacity-80 hover:opacity-100">
                        <CardHeader className="bg-muted/10 border-b border-border/50 flex flex-row items-center justify-between py-6 px-8">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                                    <UserCog className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">Reserves / Unassigned</CardTitle>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Default Protocol: 09:30 - 18:30</p>
                                </div>
                            </div>
                            <div className="bg-muted text-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-border/50">
                                {users.filter(u => !u.shift).length} Pending
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Reuse similar structure for list */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {users.filter(u => !u.shift).map(u => (
                                    <div key={u.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 px-8 border-b border-border/50 items-center hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-border shadow-sm grayscale opacity-70">
                                                <AvatarImage src={u.profilePhoto} />
                                                <AvatarFallback className="bg-muted text-muted-foreground font-black text-xs">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-sm text-foreground leading-tight">{u.username}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="hidden md:block">
                                            <span className="px-2.5 py-1 rounded-lg bg-muted border border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="hidden md:block text-xs font-bold text-muted-foreground font-mono">
                                            {u.employeeId || '---'}
                                        </div>
                                        <div className="flex justify-end">
                                            <Select onValueChange={(val) => handleAssignShift(u.id, val)} value="none">
                                                <SelectTrigger className="w-[160px] h-9 rounded-xl text-[10px] uppercase font-bold tracking-wider bg-background border-border">
                                                    <SelectValue placeholder="DEPLOY" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Unassigned</SelectItem>
                                                    {shifts.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                                {users.filter(u => !u.shift).length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                                        All personnel assigned
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default ShiftManagementPage;
