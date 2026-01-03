import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { WorkUpdate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Trash2, Edit2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const WorkUpdatesPage: React.FC = () => {
    const { user } = useAuth();
    const [updates, setUpdates] = useState<WorkUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Filters
    const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [filterRole, setFilterRole] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        hoursSpent: '',
        id: '' // For editing
    });

    const canSubmit = user?.role !== 'admin';
    const canViewOthers = ['admin', 'hr', 'manager'].includes(user?.role || '');
    const canDelete = user?.role === 'admin';

    useEffect(() => {
        fetchUpdates();
    }, [filterDate, filterRole, user]);

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            const filters: any = { date: filterDate };
            if (filterRole !== 'all') filters.role = filterRole;
            if (!canViewOthers) filters.userId = user?.id; // Employees only see their own

            const data = await apiService.getWorkUpdates(filters);
            setUpdates(data);
        } catch (error) {
            // toast.error('Failed to load work updates');
            console.error(error);
            setUpdates([]); // Fallback to empty
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) return toast.error('Title and description are required');

        setIsSubmitting(true);
        try {
            if (formData.id) {
                // Edit mode
                await apiService.updateWorkUpdate(formData.id, {
                    title: formData.title,
                    description: formData.description,
                    hoursSpent: parseFloat(formData.hoursSpent) || 0
                });
                toast.success('Update modified successfully');
            } else {
                // Create mode
                await apiService.createWorkUpdate({
                    title: formData.title,
                    description: formData.description,
                    date: new Date().toISOString().split('T')[0],
                    hoursSpent: parseFloat(formData.hoursSpent) || 0
                });
                toast.success('Daily update submitted successfully');
            }
            setShowForm(false);
            resetForm();
            fetchUpdates();
        } catch (error) {
            toast.error('Failed to submit update');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this update?')) return;
        try {
            await apiService.deleteWorkUpdate(id);
            toast.success('Update deleted');
            fetchUpdates();
        } catch (error) {
            toast.error('Failed to delete update');
        }
    };

    const handleEdit = (update: WorkUpdate) => {
        setFormData({
            id: update.id,
            title: update.title,
            description: update.description,
            hoursSpent: update.hoursSpent?.toString() || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', hoursSpent: '', id: '' });
    };

    const filteredUpdates = updates.filter(u =>
        u.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900">Daily Work Updates</h1>
                    <p className="text-slate-500 font-medium">Track productivity and team progress</p>
                </div>

                {canSubmit && (
                    <Button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Submit Daily Update
                    </Button>
                )}
            </div>

            {/* Filters & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search updates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                    />
                </div>

                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                    />
                </div>

                {canViewOthers && (
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                            <SelectValue placeholder="Filter by Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="manager">Managers</SelectItem>
                            <SelectItem value="employee">Employees</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                <div className="flex items-center justify-end px-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{filteredUpdates.length} Records</span>
                </div>
            </div>

            {/* Updates List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                </div>
            ) : filteredUpdates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <Clock className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold text-lg">No updates found</p>
                    <p className="text-slate-400 text-sm">Try adjusting your filters or date selection</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredUpdates.map((update) => (
                        <Card key={update.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                            <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 pb-4 border-b border-slate-100">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={update.user?.profilePhoto} />
                                    <AvatarFallback className="bg-blue-600 text-white font-bold">
                                        {update.user?.username?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{update.user?.username}</h3>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{update.user?.role?.replace('_', ' ')}</p>
                                        </div>
                                        {update.hoursSpent && (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                {update.hoursSpent} Hours
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-xl font-bold text-slate-800">{update.title}</h4>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{format(new Date(update.date), 'MMM dd, yyyy')}</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{update.description}</p>

                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canDelete && (
                                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => handleDelete(update.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {/* User can edit their own update only if it's today (simple rule) */}
                                    {canSubmit && update.userId === user?.id && update.date === new Date().toISOString().split('T')[0] && (
                                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => handleEdit(update)}>
                                            <Edit2 className="h-4 w-4 text-slate-600" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Submission Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-xl rounded-2xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">
                            {formData.id ? 'Edit Work Update' : 'Submit Daily Work'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Summary / Title <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="e.g. Completed API Integration for Module X"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="font-semibold h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description <span className="text-red-500">*</span></label>
                            <Textarea
                                placeholder="Detailed description of tasks accomplished..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[150px] resize-none rounded-xl p-4 leading-relaxed bg-slate-50 focus:bg-white transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hours Spent (Optional)</label>
                            <Input
                                type="number"
                                placeholder="e.g. 8"
                                step="0.5"
                                value={formData.hoursSpent}
                                onChange={e => setFormData({ ...formData, hoursSpent: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20">
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (formData.id ? 'Save Changes' : 'Submit Update')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default WorkUpdatesPage;
