import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Branch, User } from '@/types';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Edit2, Landmark, Navigation, Users, Search, CheckCircle } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


const BranchManagementPage: React.FC<{ hideHeader?: boolean }> = ({ hideHeader }) => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Branch CRUD Dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);

    // User Assignment Dialog
    const [isUserListOpen, setIsUserListOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [branchUsers, setBranchUsers] = useState<User[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedBranchUserIds, setSelectedBranchUserIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [branchesData, usersData] = await Promise.all([
                apiService.getBranches(),
                apiService.getAllUsers()
            ]);
            setBranches(branchesData);
            setAllUsers(usersData);
        } catch (error) {
            toast.error('Failed to load system data');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const data = await apiService.getBranches();
            setBranches(data);
        } catch (error) {
            toast.error('Failed to refresh branches');
        }
    };

    const handleSave = async () => {
        if (!editingBranch?.name || !editingBranch?.code) {
            toast.error('Name and Code are required');
            return;
        }

        try {
            if (editingBranch.id) {
                await apiService.updateBranch(editingBranch.id, editingBranch);
                toast.success('Branch updated successfully');
            } else {
                await apiService.createBranch(editingBranch);
                toast.success('Branch created successfully');
            }
            setIsDialogOpen(false);
            fetchBranches();
        } catch (error) {
            toast.error('Failed to save branch');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this branch? This action is permanent.')) return;
        try {
            await apiService.deleteBranch(id);
            toast.success('Branch decommissioned');
            fetchBranches();
        } catch (error) {
            toast.error('Failed to delete branch');
        }
    };

    const openAddDialog = () => {
        setEditingBranch({ name: '', code: '', address: '', latitude: 0, longitude: 0, geoRadius: 100 });
        setIsDialogOpen(true);
    };

    const openEditDialog = (branch: Branch) => {
        setEditingBranch(branch);
        setIsDialogOpen(true);
    };

    const openUserList = async (branch: Branch) => {
        setSelectedBranch(branch);
        setIsUserListOpen(true);
        setSearchQuery('');
        setSelectedUserIds([]);
        setSelectedBranchUserIds([]);
        try {
            setLoading(true);
            const [usersInBranch, all] = await Promise.all([
                apiService.getUsersByBranch(branch.id),
                apiService.getAllUsers()
            ]);
            setBranchUsers(usersInBranch);
            setAvailableUsers(all.filter(u => u.branch?.id !== branch.id));
        } catch (error) {
            toast.error('Failed to load personnel data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignUsers = async () => {
        if (!selectedBranch || selectedUserIds.length === 0) return;
        setIsTransferring(true);
        try {
            await apiService.assignUsersToBranch(selectedBranch.id, selectedUserIds);
            toast.success(`${selectedUserIds.length} personnel successfully deployed`);

            // Refresh
            const [usersInBranch, all] = await Promise.all([
                apiService.getUsersByBranch(selectedBranch.id),
                apiService.getAllUsers()
            ]);
            setBranchUsers(usersInBranch);
            setAvailableUsers(all.filter((u: User) => u.branch?.id !== selectedBranch.id));
            setAllUsers(all); // Update global users list to refresh counts on cards
            setSelectedUserIds([]);
        } catch (error) {
            toast.error('Deployment failed');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleUnassignUsers = async () => {
        if (selectedBranchUserIds.length === 0) return;
        setIsTransferring(true);
        try {
            await apiService.unassignUsersFromBranch(selectedBranchUserIds);
            toast.success(`${selectedBranchUserIds.length} personnel moved to reserves`);

            // Refresh
            if (selectedBranch) {
                const [usersInBranch, all] = await Promise.all([
                    apiService.getUsersByBranch(selectedBranch.id),
                    apiService.getAllUsers()
                ]);
                setBranchUsers(usersInBranch);
                setAvailableUsers(all.filter(u => u.branch?.id !== selectedBranch.id));
                setAllUsers(all); // Update global users list
            }
            setSelectedBranchUserIds([]);
        } catch (error) {
            toast.error('Unassignment failed');
        } finally {
            setIsTransferring(false);
        }
    };


    const filteredAvailable = availableUsers.filter((u: User) => {
        const matchesSearch = !searchQuery ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className={cn("animate-in fade-in duration-700 w-full", !hideHeader && "container mx-auto py-10 px-6 max-w-7xl")}>
            {/* Header Section */}
            {!hideHeader && (
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
                                <Landmark className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-foreground">Branch <span className="text-primary">Command</span></h1>
                        </div>
                        <p className="text-muted-foreground font-bold text-sm tracking-tight opacity-70 uppercase tracking-[0.1em]">Regional HQ Configuration & Personnel Logistics</p>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={fetchInitialData} variant="ghost" className="h-14 w-14 rounded-2xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Navigation className="h-5 w-5" />
                        </Button>
                        <Button onClick={openAddDialog} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 shadow-primary/20">
                            <Plus className="mr-3 h-5 w-5" /> Initialize New Sector
                        </Button>
                    </div>
                </header>
            )}

            {/* Grid Layout */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[400px] rounded-[40px] bg-muted animate-pulse border border-border/50" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {branches.map(branch => (
                        <Card key={branch.id} className="group relative overflow-hidden rounded-[32px] border border-border shadow-md bg-card hover:shadow-2xl transition-all duration-500 flex flex-col h-full mx-auto w-full max-w-md md:max-w-none hover:-translate-y-1">
                            {/* Branch Accent */}
                            <div className="absolute top-0 right-0 p-5 z-10">
                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground border border-border font-black text-[10px] uppercase tracking-tighter group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-sm">
                                    {branch.code.slice(0, 3)}
                                </div>
                            </div>

                            <CardContent className="p-6 flex flex-col h-full relative z-0">
                                <div className="mb-6 pr-12">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-1.5 group-hover:text-primary transition-colors leading-tight break-words" title={branch.name}>
                                        {branch.name}
                                    </h3>
                                    <div className="flex items-start gap-1.5 text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-bold opacity-80 break-words leading-tight" title={branch.address}>
                                            {branch.address || 'Address Not Configured'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                                    <div className="p-3 rounded-2xl bg-muted/50 border border-border flex flex-col items-center justify-center text-center group-hover:border-primary/20 transition-colors">
                                        <Users className="h-4 w-4 text-primary mb-1.5" />
                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Personnel</span>
                                        <span className="text-base font-black text-foreground tracking-tighter">
                                            {allUsers.filter(u => u.branch?.id === branch.id).length}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center text-center group-hover:bg-blue-500/10 transition-colors">
                                        <Navigation className="h-4 w-4 text-blue-500 mb-1.5" />
                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Radius</span>
                                        <span className="text-base font-black text-blue-500 tracking-tighter">{branch.geoRadius || 100}m</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <Button
                                        onClick={() => openUserList(branch)}
                                        className="w-full h-10 rounded-xl bg-foreground hover:bg-primary text-background font-bold uppercase text-[10px] tracking-widest transition-all shadow-md hover:shadow-primary/20 active:scale-[0.98]"
                                    >
                                        <Users className="h-3.5 w-3.5 mr-2" /> Manage Personnel
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 h-10 rounded-xl bg-muted text-muted-foreground font-bold uppercase text-[10px] tracking-widest hover:bg-background hover:text-foreground transition-all border border-border hover:border-primary/50"
                                            onClick={() => openEditDialog(branch)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5 mr-2" /> Config
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="h-10 w-10 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all border border-destructive/10 hover:border-destructive hover:shadow-lg hover:shadow-destructive/20"
                                            onClick={() => handleDelete(branch.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Branch Editor Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl rounded-[40px] p-0 overflow-hidden border border-border shadow-2xl bg-card">
                    <div className="bg-primary p-8 text-primary-foreground relative">
                        <Landmark className="absolute right-8 top-8 h-20 w-20 opacity-10" />
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-primary-foreground">
                                {editingBranch?.id ? 'Adjust Sector' : 'Initialize Sector'}
                            </DialogTitle>
                            <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-[0.2em]">Operational HQ Data Matrix</p>
                        </DialogHeader>
                    </div>

                    <div className="p-10 space-y-8 bg-card">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Branch Identity</Label>
                                <Input value={editingBranch?.name || ''} onChange={(e) => setEditingBranch(prev => ({ ...prev, name: e.target.value }))} placeholder="E.g. HYDERABAD HQ" className="h-14 rounded-2xl bg-muted border-border font-bold focus:ring-primary text-foreground" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Sector Code</Label>
                                <Input value={editingBranch?.code || ''} onChange={(e) => setEditingBranch(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="HYD-01" className="h-14 rounded-2xl bg-muted border-border font-bold focus:ring-primary text-foreground" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Tactical Address</Label>
                            <Input value={editingBranch?.address || ''} onChange={(e) => setEditingBranch(prev => ({ ...prev, address: e.target.value }))} placeholder="Physical Location Details" className="h-14 rounded-2xl bg-muted border-border font-bold focus:ring-primary text-foreground" />
                        </div>

                        <div className="p-8 rounded-[32px] bg-blue-500/5 border border-blue-500/10 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <Navigation className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Geofencing Matrix</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground">Latitude</Label>
                                    <Input type="number" value={editingBranch?.latitude || ''} onChange={(e) => setEditingBranch(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))} className="h-12 rounded-xl bg-background border-border font-bold text-foreground" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground">Longitude</Label>
                                    <Input type="number" value={editingBranch?.longitude || ''} onChange={(e) => setEditingBranch(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))} className="h-12 rounded-xl bg-background border-border font-bold text-foreground" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground">Authorized Operational Radius (Meters)</Label>
                                <Input type="number" value={editingBranch?.geoRadius || ''} onChange={(e) => setEditingBranch(prev => ({ ...prev, geoRadius: parseFloat(e.target.value) }))} className="h-12 rounded-xl bg-background border-border font-bold text-foreground" />
                            </div>
                        </div>

                        <DialogFooter className="gap-3 pt-6 border-t border-border">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:text-foreground">Abort</Button>
                            <Button onClick={handleSave} className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20">Authorize Configuration</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Personnel Logistics Dialog */}
            <Dialog open={isUserListOpen} onOpenChange={setIsUserListOpen}>
                <DialogContent className="max-w-4xl rounded-[50px] p-0 overflow-hidden border border-border shadow-3xl bg-card h-[90vh] flex flex-col">
                    <div className="bg-primary p-8 pb-10 text-primary-foreground relative flex-shrink-0">
                        <Users className="absolute right-8 top-1/2 -translate-y-1/2 h-20 w-20 opacity-10" />
                        <DialogHeader className="relative z-10">
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-tight text-primary-foreground">
                                {selectedBranch?.name} <span className="text-secondary-foreground/60">Personnel</span>
                            </DialogTitle>
                            <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-[0.3em] pt-1 opacity-80">Operational Unit Logistics & Deployment</p>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Current Personnel */}
                        <div className="w-1/2 p-8 border-r border-border overflow-hidden flex flex-col bg-card">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Deployed Staff</h4>
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{branchUsers.length} Units</span>
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                    {branchUsers.length === 0 ? (
                                        <div className="p-10 text-center border-2 border-dashed border-border rounded-[32px]">
                                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-sm font-bold text-muted-foreground">No personnel currently assigned to this sector.</p>
                                        </div>
                                    ) : (
                                        branchUsers.map(u => {
                                            const isSelected = selectedBranchUserIds.includes(u.id);
                                            return (
                                                <div
                                                    key={u.id}
                                                    onClick={() => {
                                                        setSelectedBranchUserIds(prev =>
                                                            isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "p-4 rounded-2xl border flex items-center justify-between group transition-all cursor-pointer",
                                                        isSelected
                                                            ? "bg-destructive/10 border-destructive/30 shadow-lg scale-[1.02]"
                                                            : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 rounded-xl shadow-sm border border-border">
                                                            <AvatarImage src={u.profilePhoto} />
                                                            <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-foreground text-sm tracking-tight">{u.username}</p>
                                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{u.role}</p>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                                                        isSelected ? "bg-destructive text-destructive-foreground shadow-lg" : "bg-muted text-muted-foreground group-hover:bg-destructive/10 group-hover:text-destructive"
                                                    )}>
                                                        {isSelected ? <Trash2 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>

                            {selectedBranchUserIds.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-border animate-in slide-in-from-bottom-4">
                                    <Button
                                        variant="ghost"
                                        onClick={handleUnassignUsers}
                                        disabled={isTransferring}
                                        className="w-full h-14 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-black uppercase text-[11px] tracking-widest transition-all"
                                    >
                                        Recall {selectedBranchUserIds.length} Personnel to Reserves
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Assign Personnel */}
                        <div className="w-1/2 p-8 bg-muted/30 overflow-hidden flex flex-col">
                            <div className="mb-6 space-y-4">
                                <div className="flex items-center justify-between min-h-[32px]">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transfer & Deployment Protocol</h4>
                                    {selectedUserIds.length > 0 && (
                                        <Button
                                            size="sm"
                                            onClick={handleAssignUsers}
                                            disabled={isTransferring}
                                            className="h-8 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 animate-in fade-in zoom-in-95"
                                        >
                                            Transfer Selected ({selectedUserIds.length})
                                        </Button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search system users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-12 pl-12 rounded-2xl border-border bg-background font-bold text-xs focus:ring-primary shadow-sm text-foreground"
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-3">
                                    {filteredAvailable.length === 0 ? (
                                        <p className="text-center py-10 text-muted-foreground font-bold text-sm italic">
                                            {searchQuery ? 'No personnel found matching parameters.' : 'No personnel available for deployment.'}
                                        </p>
                                    ) : (
                                        filteredAvailable.map((u: User) => {
                                            const isSelected = selectedUserIds.includes(u.id);
                                            return (
                                                <div
                                                    key={u.id}
                                                    onClick={() => {
                                                        setSelectedUserIds(prev =>
                                                            isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "p-4 rounded-2xl bg-card border flex items-center justify-between hover:shadow-md transition-all group cursor-pointer",
                                                        isSelected ? "border-primary shadow-lg scale-[1.01]" : "border-border"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 rounded-xl shadow-sm border border-border">
                                                            <AvatarImage src={u.profilePhoto} />
                                                            <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-foreground text-xs tracking-tight">{u.username}</p>
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                                                                {u.branch ? u.branch.name : 'Unassigned'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isSelected && (
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAssignUsers();
                                                                }}
                                                                className="h-7 px-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[9px] font-black uppercase tracking-widest animate-in zoom-in-95 shadow-md flex-shrink-0"
                                                            >
                                                                Deploy
                                                            </Button>
                                                        )}
                                                        <div className={cn(
                                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                                                            isSelected ? "bg-primary border-primary" : "border-border"
                                                        )}>
                                                            {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>

                            {selectedUserIds.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-border animate-in slide-in-from-bottom-4">
                                    <Button
                                        onClick={handleAssignUsers}
                                        disabled={isTransferring}
                                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 gap-2"
                                    >
                                        <Navigation className="h-4 w-4" />
                                        Authorize Transfer of {selectedUserIds.length} Personnel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-border flex items-center justify-center bg-card flex-shrink-0">
                        <Button
                            onClick={() => setIsUserListOpen(false)}
                            className="w-[90%] h-14 rounded-[20px] bg-foreground hover:bg-primary text-background font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98]"
                        >
                            Close Logistics Console
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BranchManagementPage;
