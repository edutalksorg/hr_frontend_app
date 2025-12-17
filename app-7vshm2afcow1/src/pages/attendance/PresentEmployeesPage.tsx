import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, User as UserIcon } from 'lucide-react';
import { BackButton } from '@/components/common/BackButton';
import type { User, Attendance } from '@/types';

interface PresentUser extends User {
    checkInTime: string;
}

const PresentEmployeesPage: React.FC = () => {
    const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [users, allAttendance] = await Promise.all([
                apiService.getAllUsers(),
                apiService.getAllAttendance()
            ]);

            const todayStr = new Date().toDateString();

            // Filter attendance for today
            const todayAttendance = allAttendance.filter(a => {
                if (!a.loginTime) return false;
                return new Date(a.loginTime).toDateString() === todayStr;
            });

            // Map to users
            const presentList: PresentUser[] = [];
            todayAttendance.forEach(att => {
                const user = users.find(u => u.id === att.userId);
                if (user) {
                    presentList.push({
                        ...user,
                        checkInTime: att.loginTime
                    });
                }
            });

            setPresentUsers(presentList);
        } catch (error) {
            console.error('Failed to fetch present employees:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <BackButton to="/dashboard" />
                <h1 className="text-3xl font-bold">Present Today</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <BackButton to="/dashboard" />
            <div>
                <h1 className="text-3xl font-bold">Present Employees</h1>
                <p className="text-muted-foreground">List of employees checked in today</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {presentUsers.map((user) => (
                    <Card key={user.id} className="glass-card shadow-elegant hover:shadow-glow transition-smooth">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.profilePhoto} />
                                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{user.username}</h3>
                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">ID:</span>
                                    <span>{user.id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">Email:</span>
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Checked In:</span>
                                    <span>{new Date(user.checkInTime).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {presentUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No employees have checked in today yet.
                </div>
            )}
        </div>
    );
};

export default PresentEmployeesPage;
