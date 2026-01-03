import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
    Shield,
    UserCog,
    MapPin,
    Loader2,
    Navigation,
    Search,
    Landmark,
    Globe,
    Lock
} from 'lucide-react';
import type { User, Branch } from '@/types';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


// --- Error Boundary ---
class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("GeolocationPage Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-center bg-card rounded-3xl shadow-2xl border border-destructive/20 mt-10 max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="h-10 w-10 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-2">Interface Disruption</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">{this.state.error?.message || 'A critical rendering error occurred.'}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                        Restart Engine
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

interface GeoSectionProps {
    title: string;
    users: User[];
    onUpdate: (userId: string, data: any) => Promise<any>;
    onBulkUpdate?: (userIds: string[], data: any) => Promise<any>;
}

// --- Advanced Geofencing Component ---
const GeolocationManagementSection: React.FC<GeoSectionProps> = ({ title, users, onUpdate, onBulkUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);

    const [formData, setFormData] = useState({ enabled: false, latitude: 0, longitude: 0, radius: 100 });
    const [bulkFormData, setBulkFormData] = useState({ enabled: true, latitude: 0, longitude: 0, radius: 100 });

    const startEditing = (user: User) => {
        setEditingId(user.id);
        setFormData({
            enabled: user.geoRestrictionEnabled || false,
            latitude: user.officeLatitude || 0,
            longitude: user.officeLongitude || 0,
            radius: user.geoRadius || 100
        });
    };

    const handleDetectLocation = (isBulk: boolean = false, userId?: string, autoSave: boolean = false) => {
        setIsDetecting(true);
        if (!navigator.geolocation) {
            toast.error('GSP Protocol: Browser Sync Failed');
            setIsDetecting(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (p) => {
                const coords = { latitude: p.coords.latitude, longitude: p.coords.longitude };
                if (isBulk) {
                    setBulkFormData(prev => ({ ...prev, ...coords }));
                    toast.success('Matrix Sync: Coordinates Locked');
                } else {
                    setFormData(prev => ({ ...prev, ...coords }));
                    if (autoSave && userId) {
                        try {
                            setSavingId(userId);
                            const u = users.find(x => x.id === userId);
                            await onUpdate(userId, { ...coords, enabled: u?.geoRestrictionEnabled ?? true, radius: u?.geoRadius ?? 100 });
                            toast.success('Vector Identified');
                        } finally { setSavingId(null); }
                    }
                }
                setIsDetecting(false);
            },
            () => { toast.error('Signal Loss: GPS Link Abandoned'); setIsDetecting(false); },
            { enableHighAccuracy: true }
        );
    };

    if (!users || users.length === 0) return null;

    return (
        <div className="bg-card shadow-xl shadow-black/5 border border-white/10 rounded-[24px] overflow-hidden animate-in fade-in zoom-in-95 duration-700 mb-6 transition-all">
            {/* Collapsible Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-6 cursor-pointer flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 transition-colors relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-inset shadow-sm transition-all duration-300", isExpanded ? "bg-primary/20 ring-primary/30 text-blue-400" : "bg-white/5 ring-white/10 text-slate-500")}>
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={cn("text-lg font-black tracking-tighter uppercase drop-shadow-sm transition-colors", isExpanded ? "text-white" : "text-slate-300")}>{title}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Vector Authentication Zones ({users.length})</p>
                    </div>
                </div>

                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300", isExpanded ? "bg-primary text-white rotate-180" : "bg-white/5 text-slate-400 rotate-0")}>
                    <span className="text-xs font-bold leading-none select-none">▼</span>
                </div>
            </div>

            {/* Expanded Content */}
            <div className={cn("overflow-hidden transition-all duration-500 ease-in-out", isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="p-8 border-t border-white/10 bg-slate-900/30">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Configure Parameters
                        </div>
                        {!isBulkEditing ? (
                            <Button onClick={(e) => { e.stopPropagation(); setIsBulkEditing(true); }} className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 border border-primary/50">
                                <Navigation className="h-3.5 w-3.5" />
                                Mass Configuration
                            </Button>
                        ) : (
                            <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-[20px] border border-white/10 flex flex-wrap gap-3 items-center shadow-2xl relative z-10 w-full md:w-auto animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="flex items-center gap-3 px-3 border-r border-white/10 h-full">
                                    <Switch checked={bulkFormData.enabled} onCheckedChange={(v) => setBulkFormData({ ...bulkFormData, enabled: v })} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">Restrict</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={bulkFormData.latitude}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, latitude: parseFloat(e.target.value) })}
                                        className="h-8 w-20 rounded-lg bg-black/40 border-white/10 text-white font-bold text-[10px] focus:ring-primary/50"
                                        placeholder="LAT"
                                    />
                                    <Input
                                        type="number"
                                        value={bulkFormData.longitude}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, longitude: parseFloat(e.target.value) })}
                                        className="h-8 w-20 rounded-lg bg-black/40 border-white/10 text-white font-bold text-[10px] focus:ring-primary/50"
                                        placeholder="LON"
                                    />
                                    <Input
                                        type="number"
                                        value={bulkFormData.radius}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, radius: parseFloat(e.target.value) })}
                                        className="h-8 w-16 rounded-lg bg-black/40 border-white/10 text-white font-bold text-[10px] focus:ring-primary/50"
                                        placeholder="RAD"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => handleDetectLocation(true)} className="h-8 w-8 text-blue-400 hover:bg-blue-500/10 rounded-lg border border-blue-500/20">
                                        <Navigation className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <Button
                                    onClick={async () => {
                                        if (selectedIds.length === 0) return toast.error('Selection Error: Targets Empty');
                                        setIsBulkLoading(true);
                                        try {
                                            await onBulkUpdate?.(selectedIds, bulkFormData);
                                            toast.success('Bulk Update Applied');
                                        } catch (e) {
                                            toast.error('Bulk Update Failed');
                                        } finally {
                                            setIsBulkLoading(false);
                                            setIsBulkEditing(false);
                                            setSelectedIds([]);
                                        }
                                    }}
                                    disabled={isBulkLoading}
                                    className="h-8 px-4 rounded-lg bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:scale-105 active:scale-95 ml-auto border border-emerald-500/50"
                                >
                                    {isBulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                                </Button>
                                <Button variant="ghost" onClick={() => setIsBulkEditing(false)} className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white">Cancel</Button>
                            </div>
                        )}
                    </div>

                    <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-3 pb-4">
                            {/* Responsive Grid Header */}
                            <div className="hidden lg:grid grid-cols-12 gap-8 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-4 border-b border-white/5 pb-3">
                                <div className="col-span-1"><Checkbox checked={selectedIds.length === users.length} onCheckedChange={(v) => setSelectedIds(v ? users.map(u => u.id) : [])} className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary" /></div>
                                <div className="col-span-3 text-left pl-2">Entity Identity</div>
                                <div className="col-span-2 text-center">Protocol Status</div>
                                <div className="col-span-4 text-center">Coordinates & Radius</div>
                                <div className="col-span-2 text-right pr-4">Action</div>
                            </div>

                            {users.map((user) => (
                                <div key={user.id} className={cn(
                                    "flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-center p-5 rounded-[16px] border transition-all duration-300 group relative min-h-[80px]",
                                    editingId === user.id ? "bg-primary/10 border-primary/40 shadow-xl z-10" :
                                        (selectedIds.includes(user.id) ? "bg-blue-500/5 border-blue-500/20" : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]")
                                )}>

                                    <div className="col-span-1 w-full lg:w-auto flex justify-between lg:justify-start items-center">
                                        <Checkbox checked={selectedIds.includes(user.id)} onCheckedChange={(v) => setSelectedIds(v ? [...selectedIds, user.id] : selectedIds.filter(id => id !== user.id))} className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                        <span className="lg:hidden text-xs font-bold text-slate-400">Select</span>
                                    </div>

                                    <div className="col-span-3 w-full flex flex-col lg:flex-row items-center gap-4 lg:text-left text-center">
                                        <Avatar className="h-9 w-9 border border-white/10 shadow-sm ring-2 ring-white/5">
                                            <AvatarImage src={user.profilePhoto} alt={user.username} />
                                            <AvatarFallback className="bg-slate-800 text-slate-300 font-black text-[10px]">
                                                {user.username?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-blue-100 text-sm tracking-tight group-hover:text-primary transition-colors whitespace-nowrap mb-0.5">{user.username}</p>
                                            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                                <span className="px-1.5 py-px rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase text-[8px] font-bold tracking-wide">{String(user.role || '').replace('_', ' ')}</span>
                                                {user.branch && (
                                                    <span className="px-1.5 py-px rounded bg-sky-900/30 text-sky-400 border border-sky-500/20 flex items-center gap-1 uppercase text-[8px] font-bold tracking-wide">
                                                        <Landmark className="h-2 w-2 text-sky-400" />
                                                        {user.branch.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 w-full flex lg:flex-col items-center justify-between lg:justify-center gap-2 bg-slate-900/50 lg:bg-transparent p-4 lg:p-0 rounded-xl lg:rounded-none">
                                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase">Geofence</span>
                                        <div className="flex flex-col items-center gap-1.5">
                                            <Switch checked={editingId === user.id ? !!formData.enabled : (user.geoRestrictionEnabled || false)} onCheckedChange={(v) => editingId === user.id ? setFormData({ ...formData, enabled: v }) : null} disabled={editingId !== user.id} className="scale-90" />
                                            <div className="flex items-center gap-1.5">
                                                {(editingId === user.id ? formData.enabled : user.geoRestrictionEnabled) ? (
                                                    <>
                                                        <Lock className="h-2.5 w-2.5 text-emerald-400" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Locked</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Globe className="h-2.5 w-2.5 text-slate-500" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Global</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4 w-full px-4 lg:px-6 lg:border-x border-white/5">
                                        {editingId === user.id ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="text-[8px] font-bold text-slate-500 uppercase mb-1 block">Lat</label>
                                                    <Input type="number" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} className="h-8 text-[10px] font-bold rounded-lg bg-black/40 border-white/20 text-white focus:ring-primary/50" placeholder="LAT" />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-bold text-slate-500 uppercase mb-1 block">Lon</label>
                                                    <Input type="number" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} className="h-8 text-[10px] font-bold rounded-lg bg-black/40 border-white/20 text-white focus:ring-primary/50" placeholder="LON" />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-bold text-slate-500 uppercase mb-1 block">Rad</label>
                                                    <Input type="number" value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: parseFloat(e.target.value) })} className="h-8 text-[10px] font-bold rounded-lg bg-black/40 border-white/20 text-white focus:ring-primary/50" placeholder="RAD" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-around bg-slate-900/30 p-2 rounded-xl lg:bg-transparent lg:p-0 border border-white/5 lg:border-none">
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-wider">Vector Path</p>
                                                    <div className="flex items-center gap-1.5 justify-center">
                                                        <div className="px-1.5 py-0.5 rounded bg-black/20 border border-white/5 min-w-[50px]">
                                                            <p className="text-[10px] font-bold text-white tracking-tight font-mono">{user.officeLatitude?.toFixed(4) || '—'}</p>
                                                        </div>
                                                        <span className="text-slate-600 text-[10px]">/</span>
                                                        <div className="px-1.5 py-0.5 rounded bg-black/20 border border-white/5 min-w-[50px]">
                                                            <p className="text-[10px] font-bold text-white tracking-tight font-mono">{user.officeLongitude?.toFixed(4) || '—'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center pl-4 border-l border-white/5">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-wider">Perimeter</p>
                                                    <p className="text-[10px] font-black text-blue-400 tracking-tight">{user.geoRadius || '100'}M</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-2 w-full flex justify-end gap-2 items-center">
                                        {editingId === user.id ? (
                                            <Button onClick={async () => { setSavingId(user.id); try { await onUpdate(user.id, formData); setEditingId(null); } finally { setSavingId(null); } }} disabled={savingId === user.id} className="h-8 w-full lg:w-auto px-4 rounded-lg bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95 transition-all hover:bg-emerald-500 border border-emerald-500/50">
                                                {savingId === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" onClick={() => startEditing(user)} className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/20">
                                                <UserCog className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleDetectLocation(false, user.id, true)} className="h-9 w-9 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/20" disabled={savingId === user.id || isDetecting}>
                                            {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

// --- Main Geolocation Management View ---
const GeolocationPage: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(localStorage.getItem('geo_last_branch') || '');
    const [loading, setLoading] = useState(true);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [usersData, branchesData] = await Promise.all([
                apiService.getAllUsers(),
                apiService.getBranches()
            ]);
            setUsers(Array.isArray(usersData) ? usersData.filter(u => u && u.id) : []);
            setBranches(branchesData);
        } catch (e: any) {
            setError(e.message || 'System error during data retrieval');
            toast.error('Protocol Sync Failure');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setFetchingUsers(true);
        try {
            const usersData = await apiService.getAllUsers();
            setUsers(Array.isArray(usersData) ? usersData.filter(u => u && u.id) : []);
        } catch (e) {
            console.error('Failed to refresh users');
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleBranchSelect = (id: string) => {
        setSelectedBranchId(id);
        if (id) {
            localStorage.setItem('geo_last_branch', id);
        } else {
            localStorage.removeItem('geo_last_branch');
        }
    };

    const selectedBranch = branches.find(b => b.id === selectedBranchId);

    const handleApplyBranchDefaults = async () => {
        if (!selectedBranch) return;
        const branchUsers = users.filter(u => u.branch?.id === selectedBranchId);
        if (branchUsers.length === 0) return toast.info('No personnel in this sector');

        toast.loading('Synchronizing branch vectors...', { id: 'branch-sync' });
        try {
            const data = {
                enabled: true,
                latitude: selectedBranch.latitude || 0,
                longitude: selectedBranch.longitude || 0,
                radius: selectedBranch.geoRadius || 100
            };
            await apiService.updateGeoRestrictionBulk(branchUsers.map(u => u.id), data);
            await fetchUsers();
            toast.success('Sector perimeter enforced for all personnel', { id: 'branch-sync' });
        } catch (e) {
            toast.error('Enforcement Protocol Failed', { id: 'branch-sync' });
        }
    };

    const handleToggleBranchGeofence = async (enabled: boolean) => {
        if (!selectedBranch) return;
        const branchUsers = users.filter(u => u.branch?.id === selectedBranchId);
        if (branchUsers.length === 0) return;

        toast.loading(enabled ? 'Engaging Geofence...' : 'Disabling Geofence...', { id: 'branch-toggle' });
        try {
            const data = {
                enabled,
                latitude: selectedBranch.latitude || 0,
                longitude: selectedBranch.longitude || 0,
                radius: selectedBranch.geoRadius || 100
            };
            await apiService.updateGeoRestrictionBulk(branchUsers.map(u => u.id), data);
            await fetchUsers();
            toast.success(enabled ? 'Sector Locked' : 'Sector Unlocked', { id: 'branch-toggle' });
        } catch (e) {
            toast.error('Toggle Command Failed', { id: 'branch-toggle' });
        }
    };

    if (loading) {
        return (
            <div className="space-y-12 animate-pulse p-10 max-w-7xl mx-auto">
                <div className="h-20 bg-muted/50 rounded-[30px] w-96" />
                <div className="h-[600px] bg-card rounded-[50px] border border-border" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-black text-foreground">Sync Failure</h2>
                <p className="text-muted-foreground max-w-sm text-center">{error}</p>
                <Button onClick={() => fetchUsers()} className="h-14 px-10 rounded-2xl bg-foreground text-background">Retry Synchronization</Button>
            </div>
        );
    }

    const roleFilter = searchParams.get('role');
    const searchQueryParam = searchParams.get('q')?.toLowerCase();

    const roleUsers = (r: string) => {
        if (!users || !selectedBranchId) return [];
        if (roleFilter && roleFilter.toLowerCase() !== r.toLowerCase()) return [];

        let filtered = users.filter(u =>
            u && u.role && String(u.role).toLowerCase().includes(r.toLowerCase()) &&
            u.branch?.id === selectedBranchId
        );

        if (searchQueryParam) {
            filtered = filtered.filter(u =>
                (u.username?.toLowerCase().includes(searchQueryParam)) ||
                (u.email?.toLowerCase().includes(searchQueryParam)) ||
                (u.employeeId?.toLowerCase().includes(searchQueryParam))
            );
        }

        return filtered;
    };

    return (
        <AdminErrorBoundary>
            <div className={cn("space-y-10 animate-in fade-in duration-1000 pb-20 max-w-7xl mx-auto", hideHeader ? "pt-0 px-2" : "px-4 md:px-8 pt-8")}>

                {/* Header Section */}
                {hideHeader ? (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white border border-slate-200 p-6 rounded-[24px] shadow-sm mb-8">
                        {/* Compact Controls for Embedded View */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div className="relative group w-full md:w-auto">
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white pointer-events-none" />
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => handleBranchSelect(e.target.value)}
                                    className="h-10 pl-10 pr-8 rounded-lg bg-slate-900 border border-slate-800 font-bold text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none min-w-[200px] text-white w-full"
                                >
                                    <option value="" className="text-slate-500">Select Sector</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search personnel..."
                                onChange={(e) => setSearchParams(prev => {
                                    if (e.target.value) prev.set('q', e.target.value);
                                    else prev.delete('q');
                                    return prev;
                                })}
                                className="h-10 w-full pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                ) : (
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="flex-1 w-full md:w-auto">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-14 w-14 rounded-[22px] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/10">
                                    <MapPin className="h-7 w-7 text-white" />
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter text-blue-600 drop-shadow-lg">
                                    Vector <span className="text-blue-400">Command</span>
                                </h1>
                            </div>
                            {/* Branch Selector */}
                            <div className="flex items-center gap-5">
                                <div className="relative group w-full md:w-auto">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                                    <select
                                        value={selectedBranchId}
                                        onChange={(e) => handleBranchSelect(e.target.value)}
                                        className="h-12 pl-12 pr-10 rounded-xl bg-orange-500 border border-white/10 font-black text-[11px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-white/50 transition-all cursor-pointer appearance-none min-w-[240px] text-white w-full shadow-lg placeholder-white/50"
                                    >
                                        <option value="" className="text-slate-500">Select Operational Sector</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                        ))}
                                    </select>
                                </div>
                                {fetchingUsers && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                            <div className="relative w-full md:w-80 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 transition-transform duration-300 group-focus-within:scale-110">
                                    <Search className="h-4 w-4 text-blue-200/50 group-focus-within:text-white transition-colors duration-300" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search sector personnel..."
                                    onChange={(e) => setSearchParams(prev => {
                                        if (e.target.value) prev.set('q', e.target.value);
                                        else prev.delete('q');
                                        return prev;
                                    })}
                                    className="h-12 w-full pl-11 pr-5 rounded-full bg-gradient-to-r from-blue-900 to-indigo-900 border-none ring-1 ring-white/10 hover:ring-blue-400/30 focus:ring-2 focus:ring-blue-400/50 text-xs font-medium text-blue-50 placeholder:text-blue-200/40 placeholder:uppercase placeholder:tracking-widest shadow-lg shadow-blue-900/20 hover:shadow-blue-500/10 focus:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 ease-out outline-none"
                                />
                            </div>

                            <div className="bg-slate-900/50 border border-white/10 shadow-xl px-8 py-4 rounded-[30px] flex items-center gap-6 hidden lg:flex">
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] mb-1">Last Update</p>
                                    <p className="text-xs font-black text-white tracking-tighter uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                    </header>
                )}

                {selectedBranch && (
                    <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-[50px] p-10 text-white relative overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 border border-white/10">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                            <div className="space-y-4 text-center lg:text-left">
                                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-shadow-sm">
                                    Sector <span className="text-blue-200">{selectedBranch.name}</span>
                                </h2>
                                <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                                    <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm shadow-inner">
                                        <Landmark className="h-3.5 w-3.5 text-blue-200" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedBranch.code}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm shadow-inner">
                                        <Navigation className="h-3.5 w-3.5 text-emerald-300" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedBranch.latitude?.toFixed(4)}, {selectedBranch.longitude?.toFixed(4)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm shadow-inner">
                                        <Shield className="h-3.5 w-3.5 text-amber-300" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Radius: {selectedBranch.geoRadius}M</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-end">
                                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-[32px] flex items-center gap-6 shadow-xl">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-blue-100 tracking-widest">Branch Master Geofence</p>
                                        <p className="text-xs font-black text-white">All Sector Personnel</p>
                                    </div>
                                    <Switch
                                        checked={users.filter(u => u.branch?.id === selectedBranchId).every(u => u.geoRestrictionEnabled)}
                                        onCheckedChange={handleToggleBranchGeofence}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>
                                <Button
                                    onClick={handleApplyBranchDefaults}
                                    className="h-16 px-10 rounded-2xl bg-white text-blue-700 font-black uppercase text-xs tracking-widest shadow-xl hover:bg-white/90 active:scale-95 transition-all outline-none ring-4 ring-white/10"
                                >
                                    Force Sector Coords
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-12">
                    {!selectedBranchId ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-card/20 rounded-[60px] border-2 border-dashed border-white/10 animate-in fade-in duration-700">
                            <div className="p-8 bg-white/5 rounded-full mb-8 backdrop-blur-sm">
                                <Landmark className="h-16 w-16 text-slate-600" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Sector Selection Required</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Please select a branch to manage local vector permissions</p>
                        </div>
                    ) : (
                        <>
                            {/* Managers (Admin only) */}
                            {currentUser?.role === 'admin' && roleUsers('manager').length > 0 && (
                                <GeolocationManagementSection
                                    title="Authority Hub (Managers)"
                                    users={roleUsers('manager')}
                                    onUpdate={async (uid, d) => {
                                        await apiService.updateGeoRestriction(uid, d);
                                        await fetchUsers();
                                    }}
                                    onBulkUpdate={async (uids, d) => {
                                        await apiService.updateGeoRestrictionBulk(uids, d);
                                        await fetchUsers();
                                    }}
                                />
                            )}

                            {/* Employees */}
                            {roleUsers('employee').length > 0 && (
                                <GeolocationManagementSection
                                    title="Operation Forces (Employees)"
                                    users={roleUsers('employee')}
                                    onUpdate={async (uid, d) => {
                                        await apiService.updateGeoRestriction(uid, d);
                                        await fetchUsers();
                                    }}
                                    onBulkUpdate={async (uids, d) => {
                                        await apiService.updateGeoRestrictionBulk(uids, d);
                                        await fetchUsers();
                                    }}
                                />
                            )}

                            {/* Marketing */}
                            {currentUser?.role !== 'hr' && roleUsers('marketing').length > 0 && (
                                <GeolocationManagementSection
                                    title="Marketing Vectors"
                                    users={roleUsers('marketing')}
                                    onUpdate={async (uid, d) => {
                                        await apiService.updateGeoRestriction(uid, d);
                                        await fetchUsers();
                                    }}
                                    onBulkUpdate={async (uids, d) => {
                                        await apiService.updateGeoRestrictionBulk(uids, d);
                                        await fetchUsers();
                                    }}
                                />
                            )}

                            {/* HR */}
                            {currentUser?.role !== 'hr' && roleUsers('hr').length > 0 && (
                                <GeolocationManagementSection
                                    title="HR Strategic Hubs"
                                    users={roleUsers('hr')}
                                    onUpdate={async (uid, d) => {
                                        await apiService.updateGeoRestriction(uid, d);
                                        await fetchUsers();
                                    }}
                                    onBulkUpdate={async (uids, d) => {
                                        await apiService.updateGeoRestrictionBulk(uids, d);
                                        await fetchUsers();
                                    }}
                                />
                            )}

                            {/* Empty State */}
                            {users.length > 0 &&
                                roleUsers('manager').length === 0 &&
                                roleUsers('employee').length === 0 &&
                                roleUsers('marketing').length === 0 &&
                                roleUsers('hr').length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 mx-auto max-w-4xl">
                                        <UserCog className="h-12 w-12 text-slate-700 mb-4" />
                                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No personnel matching your search signature in this sector</p>
                                    </div>
                                )}
                        </>
                    )}
                </div>
            </div>
        </AdminErrorBoundary>
    );
};

export default GeolocationPage;
