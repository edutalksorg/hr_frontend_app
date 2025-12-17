import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Notification } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Bell, CheckCircle, Clock, Info, AlertTriangle, Check } from 'lucide-react';

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await apiService.getMyNotifications();
            // Sort by newest first
            // Assuming createdAt is ISO string
            const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotifications(sorted);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return;

        try {
            await apiService.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
            toast.success('Marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case 'WARNING':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'SUCCESS':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'ERROR':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-1">
                        Stay updated with your latest alerts and messages.
                    </p>
                </div>
                <div className="relative">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                    {notifications.some(n => !n.read) && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border shadow-sm">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No notifications</h3>
                    <p className="text-muted-foreground mt-2">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`
                group relative flex gap-4 p-4 rounded-lg border transition-all duration-200
                ${notification.read ? 'bg-card/50' : 'bg-card shadow-sm border-l-4 border-l-primary'}
                hover:shadow-md
              `}
                        >
                            <div className="flex-shrink-0 mt-1">
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <h4 className={`text-base font-semibold ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                        {notification.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                                    </div>
                                </div>

                                <p className={`mt-1 text-sm ${notification.read ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
                                    {notification.message}
                                </p>
                            </div>

                            {!notification.read && (
                                <button
                                    onClick={() => handleMarkAsRead(notification.id, notification.read)}
                                    className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Mark as read"
                                >
                                    <Check className="h-4 w-4 text-green-600" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
