import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { User } from '@/types';
import { toast } from 'sonner';
import { Send, Users, User as UserIcon, BellRing } from 'lucide-react';

const NotificationManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [mode, setMode] = useState<'single' | 'broadcast'>('single');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('INFO');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = await apiService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to users:', error);
            toast.error('Failed to load users list');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }
        if (mode === 'single' && !selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        try {
            setSubmitting(true);
            if (mode === 'single') {
                await apiService.sendNotification(selectedUserId, title, message, type);
                toast.success(`Notification sent to ${users.find(u => u.id === selectedUserId)?.username || 'User'}`);
            } else {
                await apiService.broadcastNotification(title, message, type);
                toast.success('Broadcast notification sent to all users');
            }

            // Reset form
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto container p-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Send className="h-8 w-8 text-primary" />
                    Notification Management
                </h1>
                <p className="text-muted-foreground p-1">Send alerts and announcements to employees</p>
            </div>

            <div className="bg-card border rounded-lg shadow-sm p-6 max-w-3xl glass-card shadow-elegant">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setMode('single')}
                            className={`
                flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                ${mode === 'single'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'}
              `}
                        >
                            <UserIcon className="h-5 w-5" />
                            <div className="font-medium">Direct Message</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('broadcast')}
                            className={`
                flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                ${mode === 'broadcast'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'}
              `}
                        >
                            <Users className="h-5 w-5" />
                            <div className="font-medium">Broadcast</div>
                        </button>
                    </div>

                    {/* User Selection (Single Mode Only) */}
                    {mode === 'single' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Recipient
                            </label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loadingUsers}
                            >
                                <option value="">Select a user...</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username} ({user.role}) {user.email ? `- ${user.email}` : ''}
                                    </option>
                                ))}
                            </select>
                            {loadingUsers && <p className="text-xs text-muted-foreground">Loading users...</p>}
                        </div>
                    )}

                    {/* Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Notification Type</label>
                        <div className="flex gap-4">
                            {['INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((t) => (
                                <label key={t} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={t}
                                        checked={type === t}
                                        onChange={(e) => setType(e.target.value)}
                                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                    />
                                    <span className="text-sm capitalize font-medium text-muted-foreground">{t.toLowerCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Content Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., System Maintenance"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                rows={4}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            {submitting ? (
                                <>Sending...</>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <BellRing className="h-4 w-4" />
                                    Send Notification
                                </div>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default NotificationManagementPage;
