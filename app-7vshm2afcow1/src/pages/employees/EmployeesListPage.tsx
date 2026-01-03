import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, Search, Shield, Ban, Trash2, Landmark } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import type { User, Branch } from '@/types';
import { BackButton } from '@/components/common/BackButton';
import { MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const EmployeesListPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const roleFilter = searchParams.get('role');

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

    // Geo-restriction state
    const [geoDialogOpen, setGeoDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [geoEnabled, setGeoEnabled] = useState(false);
    const [geoLat, setGeoLat] = useState<string>('');
    const [geoLng, setGeoLng] = useState<string>('');
    const [geoRadius, setGeoRadius] = useState<string>('50');
    const [isSaving, setIsSaving] = useState(false);

    // Branch state
    const [branchDialogOpen, setBranchDialogOpen] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');

    const { pathname } = window.location;

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, [pathname, roleFilter]);

    const fetchUsers = async () => {
        try {
            const data = await apiService.getAllUsers();

            // Map path to role
            let targetRole = roleFilter;
            if (!targetRole) {
                if (pathname === '/admins') targetRole = 'admin';
                else if (pathname === '/hr') targetRole = 'hr';
                else if (pathname === '/developers') targetRole = 'employee';
            }

            // Initial filter by role if present
            let initialUsers = data;
            if (targetRole) {
                const lowerTarget = targetRole.toLowerCase();
                initialUsers = data.filter(u => {
                    const userRole = (u.role || '').toLowerCase();
                    if (lowerTarget === 'marketing') {
                        return userRole === 'marketing' || userRole === 'marketing_executive';
                    }
                    return userRole === lowerTarget;
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

    const fetchBranches = async () => {
        try {
            const data = await apiService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Failed to fetch branches');
        }
    };

    const handleTransferBranch = async () => {
        if (!selectedUser || !selectedBranchId) return;
        setIsSaving(true);
        try {
            await apiService.transferUserToBranch(selectedUser.id, selectedBranchId);
            toast.success('User transferred to branch');
            setBranchDialogOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to transfer user');
        } finally {
            setIsSaving(false);
        }
    };

    const openBranchDialog = (user: User) => {
        setSelectedUser(user);
        setSelectedBranchId(user.branch?.id || '');
        setBranchDialogOpen(true);
    };

    const getPageTitle = () => {
        const { pathname } = window.location;
        const targetRole = roleFilter || (pathname === '/admins' ? 'admin' : pathname === '/hr' ? 'hr' : pathname === '/developers' ? 'employee' : '');

        if (targetRole === 'hr') return 'HR Managers';
        if (targetRole === 'manager') return 'Company Managers';
        if (targetRole === 'marketing') return 'Marketing Executives';
        if (targetRole === 'admin') return 'System Administrators';
        if (targetRole === 'employee') return 'Technical Team';
        return 'Total Employees';
    };

    const getPageDescription = () => {
        const { pathname } = window.location;
        const targetRole = roleFilter || (pathname === '/admins' ? 'admin' : pathname === '/hr' ? 'hr' : pathname === '/developers' ? 'employee' : '');

        if (targetRole === 'hr') return 'View all HR managers and their work history';
        if (targetRole === 'manager') return 'View all Company Managers and their work history';
        if (targetRole === 'marketing') return 'View all Marketing Executives and their work history';
        if (targetRole === 'admin') return 'View all System Administrators and their protocols';
        if (targetRole === 'employee') return 'View all technical staff and developers';
        return 'View all employees and their work history';
    };

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = users.filter(user =>
            user.username.toLowerCase().includes(lowerQuery) ||
            user.email.toLowerCase().includes(lowerQuery) ||
            (user.role && user.role.toLowerCase().includes(lowerQuery)) ||
            (user.branch?.name?.toLowerCase().includes(lowerQuery))
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const openGeoDialog = (user: User) => {
        setSelectedUser(user);
        setGeoEnabled(user.geoRestrictionEnabled || false);
        setGeoLat(user.officeLatitude?.toString() || '');
        setGeoLng(user.officeLongitude?.toString() || '');
        setGeoRadius(user.geoRadius?.toString() || '50');
        setGeoDialogOpen(true);
    };

    const handleSaveGeoRestriction = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            const data = {
                enabled: geoEnabled,
                latitude: geoLat === '' ? null : parseFloat(geoLat),
                longitude: geoLng === '' ? null : parseFloat(geoLng),
                radius: geoRadius === '' ? null : parseFloat(geoRadius)
            };

            await apiService.updateGeoRestriction(selectedUser.id, data as any);
            toast.success('Geo-restriction updated successfully');
            setGeoDialogOpen(false);
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error('Failed to update geo-restriction:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBlockUser = async (userId: string) => {
        try {
            await apiService.blockUser(userId);
            toast.success('User blocked successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to block user');
        }
    };

    const handleUnblockUser = async (userId: string) => {
        try {
            await apiService.unblockUser(userId);
            toast.success('User unblocked successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to unblock user');
        }
    };

    const handleApproveUser = async (userId: string) => {
        try {
            await apiService.approveUser(userId);
            toast.success('User approved successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to approve user');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await apiService.deleteUser(userId);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

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
                    <h1 className="text-3xl font-bold text-slate-900">{getPageTitle()}</h1>
                    <p className="text-slate-500">{getPageDescription()}</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white border-slate-200"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                    <Card key={user.id} className="premium-card hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar
                                    className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => user.profilePhoto && setSelectedImage(user.profilePhoto)}
                                >
                                    <AvatarImage src={user.profilePhoto} />
                                    <AvatarFallback className="bg-slate-100 text-slate-500">{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{user.username}</h3>
                                    <p className="text-sm text-slate-500 capitalize">{user.role}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {user.isApproved ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Approved</span>
                                        ) : (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Pending</span>
                                        )}
                                        {user.isBlocked && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Blocked</span>
                                        )}
                                        {user.branch && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 uppercase">{user.branch.name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-500 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 flex items-center justify-center text-slate-400">@</span>
                                    <span className="truncate">{user.email}</span>
                                </div>
                                {user.companyEmail && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 flex items-center justify-center text-slate-400">🏢</span>
                                        <span className="truncate">{user.companyEmail}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link to={`/attendance/employee/${user.id}`}>
                                    <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-200">
                                        <Calendar className="h-4 w-4" />
                                        History
                                    </Button>
                                </Link>
                                {(currentUser?.role === 'admin' || currentUser?.role === 'hr') && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openGeoDialog(user)}
                                            title="Geo-Restriction Settings"
                                            className="bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        >
                                            <MapPin className={`h-4 w-4 ${user.geoRestrictionEnabled ? 'text-red-500' : ''}`} />
                                        </Button>
                                        {currentUser?.role === 'admin' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openBranchDialog(user)}
                                                title="Assign Branch"
                                                className="border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                                            >
                                                <Landmark className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {!user.isApproved && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleApproveUser(user.id)}
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                            >
                                                <Shield className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {user.isBlocked ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUnblockUser(user.id)}
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                            >
                                                <Shield className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleBlockUser(user.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            >
                                                <Ban className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {currentUser?.role === 'admin' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    No employees found matching your search.
                </div>
            )}

            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none flex justify-center items-center">
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Profile"
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain bg-slate-900"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Geo-Restriction Dialog */}
            <Dialog open={geoDialogOpen} onOpenChange={setGeoDialogOpen}>
                <DialogContent className="sm:max-w-[425px] premium-card">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <MapPin className="h-5 w-5 text-red-500" />
                            Geo-Restriction Settings
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Configure location-based access control for <strong>{selectedUser?.username}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="geo-enabled" className="text-slate-900">Enable Geo-Restriction</Label>
                                <p className="text-xs text-slate-500">
                                    User must be inside the office radius to login.
                                </p>
                            </div>
                            <Switch
                                id="geo-enabled"
                                checked={geoEnabled}
                                onCheckedChange={setGeoEnabled}
                            />
                        </div>

                        {geoEnabled && (
                            <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid gap-2">
                                    <Label htmlFor="lat" className="text-slate-700">Office Latitude</Label>
                                    <Input
                                        id="lat"
                                        type="number"
                                        step="any"
                                        placeholder="e.g. 23.8103"
                                        value={geoLat}
                                        onChange={(e) => setGeoLat(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lng" className="text-slate-700">Office Longitude</Label>
                                    <Input
                                        id="lng"
                                        type="number"
                                        step="any"
                                        placeholder="e.g. 90.4125"
                                        value={geoLng}
                                        onChange={(e) => setGeoLng(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="radius" className="text-slate-700">Allowed Radius (meters)</Label>
                                    <Input
                                        id="radius"
                                        type="number"
                                        placeholder="Default is 50m"
                                        value={geoRadius}
                                        onChange={(e) => setGeoRadius(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 p-2 rounded-lg text-center">
                                    Note: If coordinates are empty, branch defaults will apply.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGeoDialogOpen(false)} className="border-slate-200">Cancel</Button>
                        <Button
                            onClick={handleSaveGeoRestriction}
                            disabled={isSaving}
                            className="bg-red-600 hover:bg-red-700 font-bold uppercase tracking-widest text-xs h-12 rounded-xl text-white"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Branch Transfer Dialog */}
            <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
                <DialogContent className="sm:max-w-[425px] premium-card">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Landmark className="h-5 w-5 text-blue-600" />
                            Branch Assignment
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Select the operational sector for <strong>{selectedUser?.username}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <Label className="text-slate-700">Select Sector</Label>
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="w-full h-12 rounded-xl bg-slate-50 border-slate-200 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                        >
                            <option value="">No Branch Assigned</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic pt-2">
                            Transferring a user will apply the new branch's geolocation rules if individual settings are missing.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBranchDialogOpen(false)} className="h-12 rounded-xl uppercase tracking-widest text-[10px] font-black border-slate-200">Abort</Button>
                        <Button
                            onClick={handleTransferBranch}
                            disabled={isSaving}
                            className="bg-sky-500 hover:bg-sky-600 text-white h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                        >
                            {isSaving ? 'Transferring...' : 'Authorize Transfer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeesListPage;
