import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { WorkUpdate } from '@/types';

const MyWorkUpdatesPage = () => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingUpdate, setExistingUpdate] = useState<WorkUpdate | null>(null);
    const [history, setHistory] = useState<WorkUpdate[]>([]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const today = await apiService.getMyTodayUpdate();
            setExistingUpdate(today);

            const prev = await apiService.getMyWorkUpdates();
            setHistory(prev);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setLoading(true);
        try {
            await apiService.submitWorkUpdate(description);
            toast.success('Work update submitted successfully!');
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to submit update');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                    My Work Updates
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Submit your daily work progress and view history.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <FileText className="w-5 h-5 text-primary" />
                            Today's Update
                        </CardTitle>
                        <CardDescription className="text-base">
                            {format(new Date(), 'EEEE, MMMM do, yyyy')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {existingUpdate ? (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-8 flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-emerald-900">All caught up!</h3>
                                    <p className="text-emerald-700 font-medium">You have already submitted your work update for today.</p>
                                </div>
                                <div className="w-full bg-white p-6 rounded-xl border border-emerald-100 text-left mt-6 shadow-sm">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your Submission</p>
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{existingUpdate.workDescription}</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold">{format(new Date(), 'dd MMM yyyy')}</span>
                                    </div>
                                    {user?.shift && (
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold">
                                                {user.shift.startTime} - {user.shift.endTime}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700">Work Description</label>
                                    <Textarea
                                        placeholder="Describe the tasks you completed today, any issues faced, etc..."
                                        className="min-h-[200px] resize-none focus:ring-2 focus:ring-primary/20 border-slate-200 text-base"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={loading || !description.trim()}
                                        className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Update'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm h-fit bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Recent History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                    <p className="text-slate-400 font-medium">No history yet.</p>
                                </div>
                            ) : (
                                history.slice(0, 5).map((item) => (
                                    <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all shadow-sm group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{format(new Date(item.date), 'MMM dd')}</span>
                                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-auto border-emerald-200 text-emerald-700 bg-emerald-50 font-bold">Submitted</Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2 group-hover:text-slate-900 transition-colors font-medium">
                                            {item.workDescription}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MyWorkUpdatesPage;
