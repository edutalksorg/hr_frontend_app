import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { User, Team } from '@/types';
import { toast } from 'sonner';
import { Send, Users, User as UserIcon, BellRing, UsersRound, CheckSquare, Search, MessageSquare, AlertTriangle, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const SendNotificationPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [mode, setMode] = useState<'single' | 'multiple' | 'team' | 'broadcast'>('single');

    // Selections
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');

    // Search & Filter
    const [userSearch, setUserSearch] = useState('');

    // ContentState
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('INFO');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersData, teamsData] = await Promise.all([
                apiService.getAllUsers(),
                apiService.getTeams()
            ]);
            setUsers(usersData);
            setTeams(teamsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load users/teams');
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectRecipientsByRole = (role: string) => {
        const roleUsers = users.filter(u => u.role?.toUpperCase() === role.toUpperCase()).map(u => u.id);
        const newIds = [...new Set([...selectedUserIds, ...roleUsers])];
        setSelectedUserIds(newIds);
        toast.success(`Broadcasting to ${roleUsers.length} ${role.toLowerCase().replace('_', ' ')}s`);
    };

    const clearSelection = () => {
        setSelectedUserIds([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error('Transmission Error: Title and message are required');
            return;
        }

        try {
            setSubmitting(true);
            const promise = (async () => {
                if (mode === 'single') {
                    if (!selectedUserId) throw new Error('Target unspecified');
                    await apiService.sendNotification(selectedUserId, title, message, type);
                } else if (mode === 'multiple') {
                    if (selectedUserIds.length === 0) throw new Error('No targets selected');
                    await apiService.sendNotificationBatch(selectedUserIds, title, message, type);
                } else if (mode === 'team') {
                    if (!selectedTeamId) throw new Error('No team sector selected');
                    await apiService.sendNotificationToTeam(selectedTeamId, title, message, type);
                } else if (mode === 'broadcast') {
                    await apiService.broadcastNotification(title, message, type);
                }
            })();

            toast.promise(promise, {
                loading: 'Transmitting secure message...',
                success: 'Transmission Sent Successfully',
                error: (err) => `Transmission Failed: ${err.message}`
            });

            await promise;

            // Reset form content (keep selections)
            setTitle('');
            setMessage('');
            setType('INFO');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter users for display
    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const getTypeIcon = (t: string) => {
        switch (t) {
            case 'INFO': return <Info className="h-4 w-4" />;
            case 'SUCCESS': return <CheckCircle className="h-4 w-4" />;
            case 'WARNING': return <AlertTriangle className="h-4 w-4" />;
            case 'ERROR': return <ShieldAlert className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const getTypeColor = (t: string) => {
        switch (t) {
            case 'INFO': return 'bg-blue-500 text-white border-blue-600';
            case 'SUCCESS': return 'bg-emerald-500 text-white border-emerald-600';
            case 'WARNING': return 'bg-amber-500 text-white border-amber-600';
            case 'ERROR': return 'bg-red-500 text-white border-red-600';
            default: return 'bg-slate-500 text-white border-slate-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-10 animate-in fade-in duration-700 pb-20">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
                        <MessageSquare className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">Comms <span className="text-primary">Console</span></h1>
                </div>
                <p className="text-muted-foreground font-bold text-sm tracking-tight opacity-70 uppercase tracking-[0.1em]">Secure Internal Messaging Protocol</p>
            </header>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Panel: Target Selection */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="rounded-[32px] border border-border shadow-sm bg-card overflow-hidden">
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Mode Selection Grid */}
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Transmission Mode</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'single', label: 'Direct', icon: UserIcon },
                                            { id: 'multiple', label: 'Multi-Target', icon: Users },
                                            { id: 'team', label: 'Team', icon: UsersRound },
                                            { id: 'broadcast', label: 'Broadcast', icon: BellRing }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setMode(item.id as any)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all h-28 group relative overflow-hidden",
                                                    mode === item.id
                                                        ? "border-primary bg-primary/5 text-primary shadow-lg scale-[1.02]"
                                                        : "border-border bg-card hover:border-primary/50 hover:bg-muted"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2.5 rounded-xl transition-colors",
                                                    mode === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                                )}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-wider">{item.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic Selection Area */}
                                <div className="bg-muted/30 p-6 rounded-[24px] border border-border min-h-[120px] flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                    {mode === 'single' && (
                                        <div className="space-y-3 relative z-10">
                                            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Target Recipient</Label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <select
                                                    value={selectedUserId}
                                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                                    className="flex h-12 w-full pl-12 rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm appearance-none"
                                                >
                                                    <option value="">Select Personnel...</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.username} ({user.role})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'multiple' && (
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                                    <Button type="button" size="sm" variant="outline" onClick={() => selectRecipientsByRole('EMPLOYEE')} className="rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary hover:border-primary">
                                                        + Employees
                                                    </Button>
                                                    <Button type="button" size="sm" variant="outline" onClick={() => selectRecipientsByRole('MARKETING_EXECUTIVE')} className="rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary hover:border-primary">
                                                        + Marketing
                                                    </Button>
                                                    {selectedUserIds.length > 0 && (
                                                        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 rounded-lg text-[10px] font-bold uppercase tracking-wider ml-auto md:ml-0" onClick={clearSelection}>
                                                            Clear ({selectedUserIds.length})
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="relative w-full md:w-64">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                    <Input
                                                        placeholder="SEARCH DATABASE..."
                                                        value={userSearch}
                                                        onChange={(e) => setUserSearch(e.target.value)}
                                                        className="pl-9 h-9 rounded-lg border-input bg-background text-[10px] font-bold uppercase tracking-wider shadow-sm focus-visible:ring-primary"
                                                    />
                                                </div>
                                            </div>

                                            <ScrollArea className="h-[240px] rounded-xl border border-input bg-background p-2">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                                        <Search className="h-8 w-8 mb-2" />
                                                        <p className="text-[10px] uppercase font-black tracking-widest">No matching records</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {filteredUsers.map(user => (
                                                            <div
                                                                key={user.id}
                                                                onClick={() => toggleUserSelection(user.id)}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                                                                    selectedUserIds.includes(user.id)
                                                                        ? "bg-primary/10 border-primary shadow-sm"
                                                                        : "bg-card border-transparent hover:bg-muted hover:border-border"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shadow-sm",
                                                                    selectedUserIds.includes(user.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 bg-background"
                                                                )}>
                                                                    {selectedUserIds.includes(user.id) && <CheckSquare className="h-3.5 w-3.5" />}
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-xs font-bold truncate">{user.username}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-[4px] h-4 leading-none uppercase tracking-wider border border-border/50">
                                                                            {user.role?.replace('_', ' ')}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-right text-muted-foreground">{selectedUserIds.length} Targets Locked</p>
                                        </div>
                                    )}

                                    {mode === 'team' && (
                                        <div className="space-y-3 relative z-10">
                                            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Target Sector</Label>
                                            <div className="relative">
                                                <UsersRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <select
                                                    value={selectedTeamId}
                                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                                    className="flex h-12 w-full pl-12 rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm appearance-none"
                                                >
                                                    <option value="">Select Team...</option>
                                                    {teams.map(team => (
                                                        <option key={team.id} value={team.id}>
                                                            {team.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'broadcast' && (
                                        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-amber-200 bg-amber-50/50 rounded-2xl relative z-10">
                                            <div className="p-3 bg-amber-100 rounded-full mb-3 shadow-inner">
                                                <BellRing className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <h4 className="text-sm font-black uppercase tracking-wider text-amber-800 mb-1">Global Broadcast Protocol</h4>
                                            <p className="text-xs font-medium text-amber-600/80 max-w-sm">
                                                Message will be transmitted to ALL active personnel across all sectors. Use with caution.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Content Inputs */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Subject / Header</Label>
                                        <Input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-14 rounded-2xl text-lg font-bold bg-muted/30 border-border focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                                            placeholder="ENTER MESSAGE TITLE..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Message Body</Label>
                                        <Textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="min-h-[180px] rounded-2xl p-6 text-sm font-medium bg-muted/30 border-border focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 resize-none leading-relaxed"
                                            placeholder="Compose your detailed notification message here..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-16 w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                                    >
                                        {submitting ? 'Transmitting...' : (
                                            <span className="flex items-center gap-3">
                                                <Send className="h-5 w-5" />
                                                Transmit Notification
                                            </span>
                                        )}
                                    </Button>
                                </div>

                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Priority & Preview */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[32px] border border-border shadow-sm bg-card overflow-hidden">
                        <CardContent className="p-8 space-y-8">

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Message Priority</Label>
                                <div className="space-y-3">
                                    {['INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((t) => (
                                        <label key={t} className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group",
                                            type === t ? getTypeColor(t) + " shadow-lg scale-[1.02]" : "border-transparent bg-muted hover:bg-muted/80 text-muted-foreground"
                                        )}>
                                            <input
                                                type="radio"
                                                name="type"
                                                value={t}
                                                checked={type === t}
                                                onChange={(e) => setType(e.target.value as any)}
                                                className="hidden"
                                            />
                                            <div className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                                type === t ? "bg-white/20" : "bg-background"
                                            )}>
                                                {getTypeIcon(t)}
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest">{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-border">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 block">Live Preview</Label>
                                <div className="bg-background rounded-2xl border border-border shadow-sm p-4 relative overflow-hidden">
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", type === 'INFO' ? 'bg-blue-500' : type === 'SUCCESS' ? 'bg-emerald-500' : type === 'WARNING' ? 'bg-amber-500' : 'bg-red-500')} />
                                    <div className="flex gap-3 pl-2">
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", type === 'INFO' ? 'bg-blue-100 text-blue-600' : type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : type === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}>
                                            {getTypeIcon(type)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground leading-tight mb-1">{title || 'Message Header'}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{message || 'Message content preview will appear here...'}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground/50 mt-2 uppercase">Now • {type} Protocol</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SendNotificationPage;
