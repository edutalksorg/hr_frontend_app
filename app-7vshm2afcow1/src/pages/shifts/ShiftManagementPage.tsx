import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
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
import { Clock, Plus, Trash2, UserCog, Settings } from 'lucide-react';

import { apiService } from '@/services/api';
import { Shift, User } from '@/types';
import { toast } from 'sonner';

const ShiftManagementPage: React.FC = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // New Shift State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentShift, setCurrentShift] = useState<{ id?: string, name: string, startTime: string, endTime: string, lateGraceMinutes: number, halfDayTime?: string, absentTime?: string, lateCountLimit?: number }>({
        name: '', startTime: '', endTime: '', lateGraceMinutes: 15, lateCountLimit: 3
    });
    const isEditing = !!currentShift.id;

    // Load Data
    const loadData = async () => {
        setLoading(true);
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
            setLoading(false);
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
        <div className="space-y-6 max-w-5xl mx-auto container p-6">
            <div>
                <h1 className="text-3xl font-bold">Shift Management</h1>
                <p className="text-muted-foreground p-1">Manage work shifts and assignments</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Manage Shifts */}
                <Card className="glass-card shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Manage Shifts
                            </CardTitle>
                            <CardDescription>Define work shifts and timings</CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Shift</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{isEditing ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
                                    <DialogDescription>{isEditing ? 'Update shift details.' : 'Create a new shift schedule.'}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label>Shift Name</Label>
                                        <Input
                                            placeholder="e.g. Morning Shift"
                                            value={currentShift.name}
                                            onChange={e => setCurrentShift({ ...currentShift, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input type="time"
                                                value={currentShift.startTime}
                                                onChange={e => setCurrentShift({ ...currentShift, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input type="time"
                                                value={currentShift.endTime}
                                                onChange={e => setCurrentShift({ ...currentShift, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Late Grace Period (minutes)</Label>
                                        <Input type="number"
                                            value={currentShift.lateGraceMinutes}
                                            onChange={e => setCurrentShift({ ...currentShift, lateGraceMinutes: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Half Day Time (Cutoff)</Label>
                                            <Input type="time"
                                                value={currentShift.halfDayTime || ''}
                                                onChange={e => setCurrentShift({ ...currentShift, halfDayTime: e.target.value })}
                                                placeholder="e.g. 14:00"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Leaving before this marks Half Day</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Absent Time (Cutoff)</Label>
                                            <Input type="time"
                                                value={currentShift.absentTime || ''}
                                                onChange={e => setCurrentShift({ ...currentShift, absentTime: e.target.value })}
                                                placeholder="e.g. 11:00"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Check-in after this marks Absent</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Late Count Limit</Label>
                                        <Input type="number"
                                            value={currentShift.lateCountLimit || 3}
                                            onChange={e => setCurrentShift({ ...currentShift, lateCountLimit: parseInt(e.target.value) })}
                                        />
                                        <p className="text-[10px] text-muted-foreground">Number of lates allowed before penalty</p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSaveShift}>{isEditing ? 'Update Shift' : 'Create Shift'}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Timing</TableHead>
                                    <TableHead>Grace</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.map(shift => (
                                    <TableRow key={shift.id}>
                                        <TableCell className="font-medium">{shift.name}</TableCell>
                                        <TableCell>{shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)}</TableCell>
                                        <TableCell>{shift.lateGraceMinutes} min</TableCell>
                                        <TableCell className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditShift(shift)}>
                                                <Settings className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteShift(shift.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {shifts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No shifts defined</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Attendance Rules */}
                <Card className="glass-card shadow-elegant">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Attendance Rules
                        </CardTitle>
                        <CardDescription>Global tracking settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Calculation Logic</Label>
                            <p className="text-sm text-muted-foreground">
                                Attendance percentage is calculated as: <br />
                                <code>(Present + Late) / Total Working Days * 100</code>
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Shift Assignment</Label>
                            <p className="text-sm text-muted-foreground">
                                Employees without a shift are marked Late after <strong>09:45 AM</strong> (Default).
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assign Shifts - Grouped by Shift */}
            <div className="space-y-8">
                <h2 className="text-2xl font-bold border-b pb-2">Shift Assignments</h2>

                {/* 1. Mapped Shifts */}
                {shifts.map(shift => (
                    <Card key={shift.id} className="glass-card shadow-elegant border-l-4 border-l-primary/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    {shift.name}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        ({shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)})
                                    </span>
                                </div>
                                <span className="text-sm px-3 py-1 bg-primary/10 rounded-full text-primary">
                                    {users.filter(u => u.shift?.id === shift.id).length} Employees
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Employee ID</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.filter(u => u.shift?.id === shift.id).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground italic">
                                                No employees assigned to this shift
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.filter(u => u.shift?.id === shift.id).map(u => (
                                            <TableRow key={u.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={u.profilePhoto} />
                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium leading-none">{u.username}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium border">
                                                        {u.role.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {u.employeeId || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Select onValueChange={(val) => handleAssignShift(u.id, val)} value={u.shift?.id || "none"}>
                                                        <SelectTrigger className="w-[180px] ml-auto">
                                                            <SelectValue placeholder="Assign Shift" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">No Shift (Default)</SelectItem>
                                                            {shifts.map(s => (
                                                                <SelectItem key={s.id} value={s.id}>
                                                                    {s.name} ({s.startTime.slice(0, 5)})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}

                {/* 2. Unassigned / Default Shift */}
                <Card className="glass-card shadow-elegant border-l-4 border-l-muted">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCog className="h-5 w-5 text-muted-foreground" />
                                Default / Unassigned
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                    (09:30 - 18:30)
                                </span>
                            </div>
                            <span className="text-sm px-3 py-1 bg-muted rounded-full text-muted-foreground">
                                {users.filter(u => !u.shift).length} Employees
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.filter(u => !u.shift).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground italic">
                                            All employees have been assigned a shift
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.filter(u => !u.shift).map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={u.profilePhoto} />
                                                        <AvatarFallback className="bg-muted text-muted-foreground">
                                                            {u.username.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium leading-none">{u.username}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{u.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium border">
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {u.employeeId || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Select onValueChange={(val) => handleAssignShift(u.id, val)} value="none">
                                                    <SelectTrigger className="w-[180px] ml-auto">
                                                        <SelectValue placeholder="Assign Shift" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Shift (Default)</SelectItem>
                                                        {shifts.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                {s.name} ({s.startTime.slice(0, 5)})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>        </div>
    );
};

export default ShiftManagementPage;
