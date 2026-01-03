import React, { useEffect, useState, useMemo } from 'react';
import { apiService } from '@/services/api';
import { WorkUpdate, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const WorkUpdatesDashboardPage = () => {
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [updates, setUpdates] = useState<WorkUpdate[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

    // Dialog for Day Details
    const [selectedDayUpdates, setSelectedDayUpdates] = useState<WorkUpdate[] | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchUpdates();
    }, [selectedMonth, selectedYear, selectedRole, selectedEmployeeId]);

    const fetchEmployees = async () => {
        try {
            const users = await apiService.getAllUsers();
            setEmployees(users);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            const m = parseInt(selectedMonth);
            const y = parseInt(selectedYear);

            const filters: any = { month: m, year: y };
            if (selectedRole !== 'all') filters.role = selectedRole;
            if (selectedEmployeeId !== 'all') filters.userId = selectedEmployeeId;

            const data = await apiService.getAllWorkUpdates(filters);
            setUpdates(data);
        } catch (e) {
            toast.error('Failed to fetch updates');
        } finally {
            setLoading(false);
        }
    };

    const handleDayClick = (day: Date) => {
        const dayUpdates = updates.filter(u => isSameDay(parseISO(u.date), day));
        if (dayUpdates.length > 0) {
            setSelectedDayUpdates(dayUpdates);
            setDetailOpen(true);
        } else {
            toast.info('No updates for this date');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this update?')) return;
        try {
            await apiService.deleteWorkUpdate(id);
            toast.success('Deleted');
            fetchUpdates();
            setDetailOpen(false);
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const updatedDates = useMemo(() => {
        return updates.map(u => parseISO(u.date));
    }, [updates]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Work Updates Dashboard</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage and track daily work reports.</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>{format(new Date(2000, i, 1), 'MMMM')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                            <SelectItem value="MARKETING_EXECUTIVE">Marketing</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.username}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')} className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2 mb-4 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold">Calendar View</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold">List View</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar">
                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                        <CardContent className="p-8 flex justify-center w-full">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                onDayClick={handleDayClick}
                                className="rounded-2xl border bg-white p-6 shadow-sm"
                                modifiers={{
                                    worked: (d) => updatedDates.some(ud => isSameDay(ud, d))
                                }}
                                modifiersClassNames={{
                                    worked: "bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200"
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list">
                    <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-slate-50/50">
                                    <TableHead className="font-bold text-slate-700">Date</TableHead>
                                    <TableHead className="font-bold text-slate-700">Employee</TableHead>
                                    <TableHead className="font-bold text-slate-700">Role</TableHead>
                                    <TableHead className="font-bold text-slate-700">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-700">Description</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {updates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium">No updates found for selected filters.</TableCell>
                                    </TableRow>
                                ) : (
                                    updates.map(u => (
                                        <TableRow key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-bold text-slate-600">{u.date}</TableCell>
                                            <TableCell className="font-medium text-slate-900">{u.user?.username || 'Unknown'}</TableCell>
                                            <TableCell><span className="text-[10px] uppercase font-black tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{u.role}</span></TableCell>
                                            <TableCell className="text-slate-600">{u.branch?.name || '-'}</TableCell>
                                            <TableCell className="max-w-[300px] truncate text-slate-600" title={u.workDescription}>{u.workDescription}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" onClick={() => handleDelete(u.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-6 rounded-2xl">
                    <DialogHeader className="flex-none">
                        <DialogTitle className="text-2xl font-black text-slate-900">Updates for {selectedDayUpdates?.[0]?.date}</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            {selectedDayUpdates?.length} updates found.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mt-4">
                        {selectedDayUpdates?.map(u => (
                            <div key={u.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-sm">
                                            {u.user?.username?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-slate-900">{u.user?.username}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{u.role}</span>
                                                {u.branch && <span className="text-[10px] text-slate-300">•</span>}
                                                {u.branch && <span className="text-[10px] font-bold text-slate-400">{u.branch.name}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(u.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="pl-[3.5rem]">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{u.workDescription}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WorkUpdatesDashboardPage;
