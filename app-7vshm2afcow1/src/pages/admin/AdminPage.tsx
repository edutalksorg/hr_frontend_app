import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Users, Shield, Ban, Clock, UserCog, Megaphone } from 'lucide-react';
import type { User, Attendance } from '@/types';
import { toast } from 'sonner';

interface UserListProps {
  title: string;
  users: User[];
  icon: React.ElementType;
  attendanceMap: Record<string, Attendance>;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onApprove: (id: string, role?: string) => void;
  showApprove?: boolean;
  onImageClick: (url: string) => void;
}

const UserListSection: React.FC<UserListProps> = ({
  title,
  users,
  icon: Icon,
  attendanceMap,
  onBlock,
  onUnblock,
  onApprove,
  onImageClick
}) => {
  if (users.length === 0) return null;

  return (
    <Card className="glass-card shadow-elegant mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <Avatar
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => user.profilePhoto && onImageClick(user.profilePhoto)}
                >
                  <AvatarImage src={user.profilePhoto} />
                  <AvatarFallback>{user.username?.charAt(0) ?? ''}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {user.role === 'marketing_executive' ? 'Marketing' : (user.role === 'manager' ? 'Manager' : user.role)}
                    </span>
                    {user.isApproved ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Approved
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Pending
                      </span>
                    )}
                    {user.isBlocked && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
                {/* Attendance Info */}
                {attendanceMap[user.id] && (
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground border-l pl-4 ml-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>In: {new Date(attendanceMap[user.id].loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {attendanceMap[user.id].logoutTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Out: {new Date(attendanceMap[user.id].logoutTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!user.isApproved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApprove(user.id, user.role?.toUpperCase())}
                    className="gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    Approve
                  </Button>
                )}
                {user.isBlocked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUnblock(user.id)}
                    className="gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    Unblock
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBlock(user.id)}
                    className="gap-1 text-destructive"
                  >
                    <Ban className="h-3 w-3" />
                    Block
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getAllUsers();
      setUsers(data);

      try {
        const allAttendance = await apiService.getAllAttendance();
        const todayStr = new Date().toDateString();

        const todayAttendance = allAttendance.filter(a => {
          if (!a.loginTime) return false;
          return new Date(a.loginTime).toDateString() === todayStr;
        });

        const map: Record<string, Attendance> = {};
        todayAttendance.forEach(a => {
          map[a.userId] = a;
        });
        setAttendanceMap(map);
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      // Optimistic update
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === userId ? { ...u, isBlocked: true, status: 'BLOCKED' } : u
      ));

      await apiService.blockUser(userId);
      toast.success('User blocked successfully');
      fetchUsers(); // Refresh to be sure
    } catch (error) {
      toast.error('Failed to block user');
      fetchUsers(); // Revert on error
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

  const handleApproveUser = async (userId: string, role: string = 'EMPLOYEE') => {
    try {
      // Optimistic update
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === userId ? { ...u, isApproved: true, status: 'ACTIVE' } : u
      ));

      await apiService.approveUser(userId, role);
      toast.success('User approved successfully');
      fetchUsers(); // Refresh to be sure
    } catch (error) {
      toast.error('Failed to approve user');
      fetchUsers();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  // Filter users - Show ALL users for management
  const adminUsers = users.filter(u => u.role === 'admin');
  const hrUsers = users.filter(u => u.role === 'hr');
  const managerUsers = users.filter(u => u.role === 'manager');
  const marketingUsers = users.filter(u => u.role === 'marketing' || u.role === 'marketing_executive');
  const employeeUsers = users.filter(u => u.role === 'employee');

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{(currentUser?.role === 'hr' || currentUser?.role === 'manager') ? 'Employee Management' : 'Admin Panel'}</h1>
        <p className="text-muted-foreground">Manage users and system settings</p>
      </div>

      {isAdmin && (
        <>
          <UserListSection
            title="Administrators"
            users={adminUsers}
            icon={Shield}
            attendanceMap={attendanceMap}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onApprove={handleApproveUser}
            onImageClick={setSelectedImage}
          />
          <UserListSection
            title="HR Manager"
            users={hrUsers}
            icon={UserCog}
            attendanceMap={attendanceMap}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onApprove={handleApproveUser}
            onImageClick={setSelectedImage}
          />

          <UserListSection
            title="Managers"
            users={managerUsers}
            icon={UserCog}
            attendanceMap={attendanceMap}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onApprove={handleApproveUser}
            onImageClick={setSelectedImage}
          />
        </>
      )}

      <UserListSection
        title="Marketing Executives"
        users={marketingUsers}
        icon={Megaphone}
        attendanceMap={attendanceMap}
        onBlock={handleBlockUser}
        onUnblock={handleUnblockUser}
        onApprove={handleApproveUser}
        onImageClick={setSelectedImage}
      />

      <UserListSection
        title="Employees"
        users={employeeUsers}
        icon={Users}
        attendanceMap={attendanceMap}
        onBlock={handleBlockUser}
        onUnblock={handleUnblockUser}
        onApprove={handleApproveUser}
        onImageClick={setSelectedImage}
      />
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

export default AdminPage;
