import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { User, Team } from '@/types';
import { toast } from 'sonner';
import { Send, Users, User as UserIcon, BellRing, UsersRound, X, CheckSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SendNotificationPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
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
    const [type, setType] = useState('INFO');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, teamsData] = await Promise.all([
                apiService.getAllUsers(),
                apiService.getTeams()
            ]);
            setUsers(usersData);
            setTeams(teamsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load users/teams');
        } finally {
            setLoading(false);
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
        toast.success(`Added ${roleUsers.length} ${role.toLowerCase().replace('_', ' ')}s`);
    };

    const clearSelection = () => {
        setSelectedUserIds([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }

        try {
            setSubmitting(true);

            if (mode === 'single') {
                if (!selectedUserId) { toast.error('Please select a user'); return; }
                await apiService.sendNotification(selectedUserId, title, message, type);
                toast.success('Notification sent');
            } else if (mode === 'multiple') {
                if (selectedUserIds.length === 0) { toast.error('Please select at least one user'); return; }
                await apiService.sendNotificationBatch(selectedUserIds, title, message, type);
                toast.success(`Notification sent to ${selectedUserIds.length} users`);
            } else if (mode === 'team') {
                if (!selectedTeamId) { toast.error('Please select a team'); return; }
                await apiService.sendNotificationToTeam(selectedTeamId, title, message, type);
                toast.success('Notification sent to team members');
            } else if (mode === 'broadcast') {
                await apiService.broadcastNotification(title, message, type);
                toast.success('Broadcast notification sent to all users');
            }

            // Reset form content (keep selections)
            setTitle('');
            setMessage('');
            setType('INFO');
        } catch (error) {
            console.error('Failed to send notification:', error);
            toast.error('Failed to send notification');
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

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Send className="h-6 w-6 text-primary" />
                    Send Notifications
                </h1>
                <p className="text-muted-foreground mt-1">
                    Send private messages, team updates, or broadcast announcements.
                </p>
            </div>

            <div className="bg-card border rounded-lg shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Mode Selection Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { id: 'single', label: 'Single User', icon: UserIcon },
                            { id: 'multiple', label: 'Multiple Users', icon: Users },
                            { id: 'team', label: 'Entire Team', icon: UsersRound },
                            { id: 'broadcast', label: 'Broadcast All', icon: BellRing }
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setMode(item.id as any)}
                                className={`
                                    flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all h-24
                                    ${mode === item.id
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'}
                                `}
                            >
                                <item.icon className="h-6 w-6" />
                                <div className="text-xs font-medium">{item.label}</div>
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Selection Area */}
                    <div className="bg-muted/30 p-4 rounded-lg border min-h-[100px] flex flex-col justify-center">
                        {mode === 'single' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Recipient</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Select a user...</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.username} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {mode === 'multiple' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => selectRecipientsByRole('EMPLOYEE')}>
                                            + All Employees
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => selectRecipientsByRole('MARKETING_EXECUTIVE')}>
                                            + All Marketing
                                        </Button>
                                        {selectedUserIds.length > 0 && (
                                            <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={clearSelection}>
                                                Clear ({selectedUserIds.length})
                                            </Button>
                                        )}
                                    </div>
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            placeholder="Search users..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>

                                <div className="border rounded-md bg-background max-h-[200px] overflow-y-auto p-2 space-y-1">
                                    {filteredUsers.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => toggleUserSelection(user.id)}
                                                className={`
                                                    flex items-center gap-3 p-2 rounded cursor-pointer transition-colors text-sm
                                                    ${selectedUserIds.includes(user.id) ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}
                                                `}
                                            >
                                                <div className={`
                                                    h-4 w-4 rounded border flex items-center justify-center
                                                    ${selectedUserIds.includes(user.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}
                                                `}>
                                                    {selectedUserIds.includes(user.id) && <CheckSquare className="h-3 w-3" />}
                                                </div>
                                                <span>{user.username}</span>
                                                <span className="text-xs text-muted-foreground ml-auto bg-secondary px-2 py-0.5 rounded-full capitalize">
                                                    {user.role?.toLowerCase().replace('_', ' ')}
                                                </span>
                                                {user.email && <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground text-right">{selectedUserIds.length} users selected</p>
                            </div>
                        )}

                        {mode === 'team' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Team</label>
                                <select
                                    value={selectedTeamId}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Select a team...</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {mode === 'broadcast' && (
                            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded border border-amber-200">
                                <BellRing className="h-5 w-5" />
                                <div className="text-sm font-medium">
                                    Warning: This message will be sent to ALL active users in the system.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Inputs */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject / Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Brief title..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message Body</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                                    placeholder="Type your detailed notification message here..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type / Priority</label>
                            <div className="space-y-2">
                                {['INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((t) => (
                                    <label key={t} className={`
                                        flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-secondary/50 transition-colors
                                        ${type === t ? 'border-primary bg-primary/5' : 'border-input'}
                                    `}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value={t}
                                            checked={type === t}
                                            onChange={(e) => setType(e.target.value)}
                                            className="h-4 w-4 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium capitalize">{t.toLowerCase()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full md:w-auto md:min-w-[200px] inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 shadow-sm"
                        >
                            {submitting ? 'Sending...' : (
                                <span className="flex items-center gap-2">
                                    <Send className="h-4 w-4" />
                                    Send Notification
                                </span>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SendNotificationPage;
