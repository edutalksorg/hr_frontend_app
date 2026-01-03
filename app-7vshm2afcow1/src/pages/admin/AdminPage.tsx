import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Users,
  Shield,
  Ban,
  UserCog,
  Megaphone,
  Trash2,
  Search,
  Zap,
  Filter,
  Monitor,
  Navigation,
  Landmark,
  Clock,
  ChevronDown
} from 'lucide-react';
import type { User, Attendance, Branch } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import BranchManagementPage from './BranchManagementPage';
import GeolocationPage from './GeolocationPage';
import ShiftManagementPage from '../shifts/ShiftManagementPage';

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
    console.error("AdminPage Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center bg-white rounded-3xl shadow-2xl border border-red-100 mt-10 mx-auto max-w-2xl">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Interface Disruption</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">{this.state.error?.message || 'A critical rendering error occurred.'}</p>
          <Button
            onClick={() => window.location.reload()}
            className="h-14 px-10 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            Restart Engine
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SafeTimeDisplay: React.FC<{ dateStr: string | undefined }> = ({ dateStr }) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return <span className="text-red-500 font-bold text-[10px]">ERR</span>;
    return <span>Sync: {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
  } catch (e) {
    return null;
  }
};

// --- Interfaces ---
interface UserListProps {
  title: string;
  users: User[];
  icon: React.ElementType;
  attendanceMap: Record<string, Attendance>;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onApprove: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onAssignBranch: (user: User) => void;
  showDelete?: boolean;
  onImageClick: (url: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// --- High-End User Matrix Component (Accordion) ---
const UserListSection: React.FC<UserListProps> = ({
  title, users, icon: Icon, attendanceMap, onBlock, onUnblock, onApprove, onDelete, onAssignBranch, showDelete, onImageClick, isOpen, onToggle
}) => {
  const [localSearch, setLocalSearch] = useState('');

  if (!users || users.length === 0) return null;

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(localSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className={cn(
      "bg-white rounded-[20px] overflow-hidden border border-slate-200 shadow-sm transition-all duration-300",
      isOpen ? "mb-4 ring-2 ring-sky-100 shadow-md" : "mb-2 hover:bg-slate-50"
    )}>
      {/* Header Section - Clickable Trigger */}
      <div
        onClick={onToggle}
        className="p-4 flex items-center justify-between cursor-pointer select-none bg-white transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
            isOpen ? "bg-sky-500 text-white scale-110" : "bg-slate-100 text-slate-500 group-hover:bg-white"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className={cn("text-base font-black uppercase tracking-tight transition-colors", isOpen ? "text-slate-900" : "text-slate-600")}>
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={cn("inline-block w-1.5 h-1.5 rounded-full", isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {users.length} Records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isOpen && (
            <div className="flex -space-x-2 mr-2">
              {users.slice(0, 3).map((u, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={u.profilePhoto} />
                    <AvatarFallback className="text-[8px]">{u.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              ))}
              {users.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  +{users.length - 3}
                </div>
              )}
            </div>
          )}
          <div className={cn("p-2 rounded-full transition-transform duration-300 bg-slate-50", isOpen && "rotate-180 bg-sky-50 text-sky-600")}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="bg-slate-50/50 border-t border-slate-100">
            {/* Sticky Filters inside Panel */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="relative group/search w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input
                  type="text"
                  placeholder={`Search ${title}...`}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 h-9 w-full bg-slate-100 border-transparent rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-sky-200 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="hidden lg:flex gap-16 pr-12 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <span className="w-24">Role</span>
                <span className="w-24">Branch</span>
                <span className="w-24 text-right">Actions</span>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-0">
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const userAttendance = attendanceMap?.[user.id];
                  const hasAttendance = userAttendance && userAttendance.loginTime;

                  return (
                    <div key={user.id} className="group relative px-6 py-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                        {/* Identity */}
                        <div className="flex items-center gap-4 min-w-[200px] flex-1">
                          <div
                            className="relative cursor-pointer shrink-0 hover:scale-105 transition-transform"
                            onClick={() => user.profilePhoto && onImageClick(user.profilePhoto)}
                          >
                            <Avatar className="h-10 w-10 rounded-lg border border-slate-100 shadow-sm">
                              <AvatarImage src={user.profilePhoto} />
                              <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white",
                              user.isBlocked ? "bg-red-500" : (user.isApproved ? "bg-emerald-500" : "bg-amber-400")
                            )} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{user.username}</h4>
                              {hasAttendance && (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Online now" />
                              )}
                            </div>
                            <p className="text-[10px] items-center text-slate-500 font-medium truncate">{user.email}</p>
                          </div>
                        </div>

                        {/* Metadata Columns */}
                        <div className="flex items-center gap-4 lg:gap-12 flex-wrap lg:flex-nowrap">
                          {/* Role Badge */}
                          <div className="w-24 shrink-0">
                            <div className={cn(
                              "inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                              user.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                user.role === 'hr' ? "bg-pink-50 text-pink-700 border-pink-100" :
                                  "bg-slate-50 text-slate-600 border-slate-100"
                            )}>
                              {user.role}
                            </div>
                          </div>

                          {/* Branch/Status */}
                          <div className="w-24 shrink-0">
                            {user.branch ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                <Landmark className="h-3 w-3 text-slate-400" />
                                <span className="truncate max-w-[80px]">{user.branch.code}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-bold uppercase">No Sector</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="w-24 shrink-0 flex justify-end items-center gap-1 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => onAssignBranch(user)} className="h-7 w-7 rounded-md hover:bg-sky-50 hover:text-sky-600"><Landmark className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => user.isBlocked ? onUnblock(user.id) : onBlock(user.id)} className={cn("h-7 w-7 rounded-md transition-colors", user.isBlocked ? "text-red-500 hover:bg-red-50" : "text-slate-400 hover:text-red-500 hover:bg-red-50")}><Ban className="h-3.5 w-3.5" /></Button>
                            <Link to={`/attendance/employee/${user.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100 text-slate-400"><Clock className="h-3.5 w-3.5" /></Button>
                            </Link>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No users found matching filter</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Admin Command View ---
const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('Administrators');

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? '' : section);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersData, attendanceData, branchesData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getAllAttendance(),
        apiService.getBranches()
      ]);

      setUsers(Array.isArray(usersData) ? usersData.filter(u => u && u.id) : []);
      setBranches(branchesData);

      if (Array.isArray(attendanceData)) {
        const tStr = new Date().toDateString();
        const todayMap: Record<string, Attendance> = {};
        attendanceData.forEach(a => {
          if (a && a.userId && a.loginTime && new Date(a.loginTime).toDateString() === tStr) {
            todayMap[a.userId] = a;
          }
        });
        setAttendanceMap(todayMap);
      }
    } catch (e: any) {
      setError(e.message || 'System error during data retrieval');
      toast.error('Protocol Sync Failure');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiService.getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to refresh users');
    }
  };


  const handleTransferBranch = async () => {
    if (!targetUser || !selectedBranchId) return;
    setIsTransferring(true);
    try {
      await apiService.transferUserToBranch(targetUser.id, selectedBranchId);
      toast.success('Sector Assignment Updated');
      setIsBranchDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Assignment Protocol Failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleBlockUser = async (uId: string) => {
    try {
      await apiService.blockUser(uId);
      setUsers(p => p.map(u => u.id === uId ? { ...u, isBlocked: true } : u));
      toast.success('Access Protocol: Locked');
    } catch (e) { toast.error('Command Error'); }
  };

  const handleUnblockUser = async (uId: string) => {
    try {
      await apiService.unblockUser(uId);
      setUsers(p => p.map(u => u.id === uId ? { ...u, isBlocked: false } : u));
      toast.success('Access Protocol: Restored');
    } catch (e) { toast.error('Command Error'); }
  };

  const handleApproveUser = async (uId: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      toast.info('Verifying identity...');
      const updated = await apiService.approveUser(uId);
      if (updated) {
        setUsers(p => p.map(u => u.id === uId ? { ...u, isApproved: true } : u));
        toast.success('Identity Verified');
      }
    } catch (error) { toast.error('Verification Error'); }
  };

  const openBranchAssignDialog = (u: User) => {
    setTargetUser(u);
    setSelectedBranchId(u.branch?.id || '');
    setIsBranchDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse p-10 max-w-7xl mx-auto">
        <div className="h-20 bg-slate-100 rounded-[30px] w-96" />
        <div className="h-[600px] bg-white rounded-[50px] border border-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <Shield className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Sync Failure</h2>
        <p className="text-slate-500 max-w-sm text-center">{error}</p>
        <Button onClick={() => fetchInitialData()} className="h-14 px-10 rounded-2xl bg-slate-900 text-white">Retry Synchronization</Button>
      </div>
    );
  }

  const roleFilter = searchParams.get('role');
  const roleUsers = (r: string) => {
    if (!users) return [];
    if (roleFilter && roleFilter.toLowerCase() !== r.toLowerCase()) return [];
    return users.filter(u => u && u.role && String(u.role).toLowerCase().includes(r.toLowerCase()));
  };

  return (
    <AdminErrorBoundary>
      <div className="h-[calc(100vh-2rem)] flex flex-col overflow-hidden max-w-7xl mx-auto">
        <header className="flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-10 py-6 border-b border-white/50 mb-6 px-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-[18px] bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-4 ring-sky-50">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                System <span className="text-sky-500">Command</span>
              </h1>
            </div>
            <p className="text-slate-500 font-bold text-xs flex items-center gap-3">
              <Monitor className="h-3.5 w-3.5 text-sky-500" />
              Central Operations Dashboard / {users.length} units
            </p>
          </div>
          <div className="premium-card px-8 py-4 rounded-[24px] flex items-center gap-6 bg-white border border-slate-100 shadow-sm">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Status</p>
              <p className="text-xs font-black text-slate-900 tracking-tighter uppercase">Operational</p>
            </div>
            <div className="w-1.5 h-10 bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Active</span>
            </div>
          </div>
        </header>

        <Tabs defaultValue="personnel" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-none bg-white p-2 rounded-[24px] h-18 w-fit border border-slate-100 shadow-sm mx-4 mb-6">
            <TabsTrigger value="personnel" className="h-14 px-8 rounded-[18px] data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all hover:bg-slate-50 font-bold tracking-tight text-slate-600 text-sm">
              <Users className="h-4 w-4 mr-2" /> Personnel
            </TabsTrigger>
            <TabsTrigger value="geolocation" className="h-14 px-8 rounded-[18px] data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all hover:bg-slate-50 font-bold tracking-tight text-slate-600 text-sm">
              <Navigation className="h-4 w-4 mr-2" /> Geolocation
            </TabsTrigger>
            <TabsTrigger value="branches" className="h-14 px-8 rounded-[18px] data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all hover:bg-slate-50 font-bold tracking-tight text-slate-600 text-sm">
              <Landmark className="h-4 w-4 mr-2" /> Sector Command
            </TabsTrigger>
            <TabsTrigger value="shifts" className="h-14 px-8 rounded-[18px] data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all hover:bg-slate-50 font-bold tracking-tight text-slate-600 text-sm">
              <Clock className="h-4 w-4 mr-2" /> Shift Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personnel" className="space-y-4 h-full overflow-y-auto pr-2 pb-20">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={() => setExpandedSection('')} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Collapse All</Button>
            </div>
            <UserListSection title="Administrators" users={roleUsers('admin')} icon={Shield} attendanceMap={attendanceMap} onBlock={handleBlockUser} onUnblock={handleUnblockUser} onApprove={handleApproveUser} onAssignBranch={openBranchAssignDialog} onDelete={(id) => apiService.deleteUser(id).then(fetchInitialData)} onImageClick={setSelectedImage} showDelete={currentUser?.role === 'admin'} isOpen={expandedSection === 'Administrators'} onToggle={() => toggleSection('Administrators')} />
            <UserListSection title="HR Managers" users={roleUsers('hr')} icon={Users} attendanceMap={attendanceMap} onBlock={handleBlockUser} onUnblock={handleUnblockUser} onApprove={handleApproveUser} onAssignBranch={openBranchAssignDialog} onDelete={(id) => apiService.deleteUser(id).then(fetchInitialData)} onImageClick={setSelectedImage} showDelete={currentUser?.role === 'admin'} isOpen={expandedSection === 'HR Managers'} onToggle={() => toggleSection('HR Managers')} />
            <UserListSection title="Managers" users={roleUsers('manager')} icon={UserCog} attendanceMap={attendanceMap} onBlock={handleBlockUser} onUnblock={handleUnblockUser} onApprove={handleApproveUser} onAssignBranch={openBranchAssignDialog} onDelete={(id) => apiService.deleteUser(id).then(fetchInitialData)} onImageClick={setSelectedImage} showDelete={currentUser?.role === 'admin'} isOpen={expandedSection === 'Managers'} onToggle={() => toggleSection('Managers')} />
            <UserListSection title="Marketing" users={roleUsers('marketing')} icon={Megaphone} attendanceMap={attendanceMap} onBlock={handleBlockUser} onUnblock={handleUnblockUser} onApprove={handleApproveUser} onAssignBranch={openBranchAssignDialog} onDelete={(id) => apiService.deleteUser(id).then(fetchInitialData)} onImageClick={setSelectedImage} showDelete={currentUser?.role === 'admin'} isOpen={expandedSection === 'Marketing'} onToggle={() => toggleSection('Marketing')} />
            <UserListSection title="Regular Employees" users={roleUsers('employee')} icon={Users} attendanceMap={attendanceMap} onBlock={handleBlockUser} onUnblock={handleUnblockUser} onApprove={handleApproveUser} onAssignBranch={openBranchAssignDialog} onDelete={(id) => apiService.deleteUser(id).then(fetchInitialData)} onImageClick={setSelectedImage} showDelete={currentUser?.role === 'admin'} isOpen={expandedSection === 'Regular Employees'} onToggle={() => toggleSection('Regular Employees')} />
          </TabsContent>

          <TabsContent value="geolocation" className="animate-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto pb-20">
            <GeolocationPage hideHeader />
          </TabsContent>

          <TabsContent value="branches" className="animate-in slide-in-from-bottom-4 duration-500">
            <BranchManagementPage hideHeader />
          </TabsContent>

          <TabsContent value="shifts" className="animate-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto pb-20">
            <ShiftManagementPage hideHeader />
          </TabsContent>
        </Tabs>

        {/* Branch Assignment Dialog */}
        <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[40px] p-10 border border-slate-100 bg-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter text-slate-900">
                <Landmark className="h-6 w-6 text-sky-500" /> Sector Assignment
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 pt-2">Assigning <strong>{targetUser?.username}</strong> to a regional sector.</p>
            </DialogHeader>

            <div className="py-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Branch</Label>
                <div className="relative">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-200 px-5 pr-10 font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all appearance-none text-slate-900"
                  >
                    <option value="">No Sector Assigned</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] bg-blue-50 p-4 rounded-2xl border border-blue-100">
                Notice: Branch geolocation defaults will apply if individual overrides are not present.
              </p>
            </div>

            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setIsBranchDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900">Abort</Button>
              <Button onClick={handleTransferBranch} disabled={isTransferring} className="h-14 px-8 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20">
                {isTransferring ? 'Syncing...' : 'Authorize Transfer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-[40px] border border-slate-200 shadow-2xl">
            {selectedImage && (
              <img src={selectedImage} alt="Identity preview" className="w-full h-auto object-contain max-h-[80vh]" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminPage;
