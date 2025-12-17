import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { BackButton } from '@/components/common/BackButton';

const EmployeesListPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const roleFilter = searchParams.get('role');

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await apiService.getAllUsers();

            // Initial filter by role if present
            let initialUsers = data;
            if (roleFilter) {
                initialUsers = data.filter(u => {
                    if (roleFilter === 'marketing') {
                        return u.role === 'marketing' || u.role === 'marketing_executive';
                    }
                    return u.role === roleFilter;
                });
            }

            setUsers(initialUsers);
            setFilteredUsers(initialUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPageTitle = () => {
        if (roleFilter === 'hr') return 'HR Managers';
        if (roleFilter === 'marketing') return 'Marketing Executives';
        return 'Total Employees';
    };

    const getPageDescription = () => {
        if (roleFilter === 'hr') return 'View all HR managers and their work history';
        if (roleFilter === 'marketing') return 'View all Marketing Executives and their work history';
        return 'View all employees and their work history';
    };

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = users.filter(user =>
            user.username.toLowerCase().includes(lowerQuery) ||
            user.email.toLowerCase().includes(lowerQuery) ||
            (user.role && user.role.toLowerCase().includes(lowerQuery))
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    if (loading) {
        return (
            <div className="space-y-6">
                <BackButton to="/dashboard" />
                <h1 className="text-3xl font-bold">Employees</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <BackButton to="/dashboard" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
                    <p className="text-muted-foreground">{getPageDescription()}</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                    <Card key={user.id} className="glass-card shadow-elegant hover:shadow-glow transition-smooth">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar
                                    className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => user.profilePhoto && setSelectedImage(user.profilePhoto)}
                                >
                                    <AvatarImage src={user.profilePhoto} />
                                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{user.username}</h3>
                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-muted-foreground mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 flex items-center justify-center">@</span>
                                    <span className="truncate">{user.email}</span>
                                </div>
                                {user.companyEmail && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 flex items-center justify-center">🏢</span>
                                        <span className="truncate">{user.companyEmail}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Link to={`/employees/${user.id}/history`} className="w-full">
                                    <Button variant="outline" className="w-full gap-2">
                                        <Calendar className="h-4 w-4" />
                                        View History
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No employees found matching your search.
                </div>
            )}

            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none flex justify-center items-center">
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Profile"
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black/50"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeesListPage;
