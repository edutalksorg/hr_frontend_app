import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Shield, Ban, Clock } from 'lucide-react';
import type { User, Attendance } from '@/types';
import { toast } from 'sonner';

const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true); // loading state for users

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getAllUsers();
      setUsers(data);

      // Fetch attendance for today
      try {
        const allAttendance = await apiService.getAllAttendance();
        const todayStr = new Date().toDateString();

        const todayAttendance = allAttendance.filter(a => {
          if (!a.loginTime) return false;
          return new Date(a.loginTime).toDateString() === todayStr;
        });

        const map: Record<string, Attendance> = {};
        todayAttendance.forEach(a => {
          // If user has multiple logins, take the latest one or the one with logout?
          // For now, let's just take the latest one (assuming list is ordered or we iterate)
          // Actually, let's prefer the one that matches the user.
          // Since we iterate attendance, we map userId -> attendance.
          // If multiple, the last one wins.
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
      // Optimistically remove from list for HR users
      if (currentUser?.role === 'hr') {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      }

      await apiService.blockUser(userId);
      toast.success('User blocked successfully');

      // Refresh for admin users
      if (currentUser?.role === 'admin') {
        fetchUsers();
      }
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
      // Optimistically remove from list for HR users
      if (currentUser?.role === 'hr') {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      }

      await apiService.approveUser(userId, role);
      toast.success('User approved successfully');

      // Refresh the full list for admin users
      if (currentUser?.role === 'admin') {
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to approve user');
      // Revert optimistic update on error
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{currentUser?.role === 'hr' ? 'Employee Management' : 'Admin Panel'}</h1>
        <p className="text-muted-foreground">Manage users and system settings</p>
      </div>

      <Card className="glass-card shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.filter(u => {
              // HR sees all employees (pending and active) but not admins/other HRs
              if (currentUser?.role === 'hr') {
                return u.role === 'employee' || u.role === 'marketing';
              }
              // Admin sees all users
              return true;
            }).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.profilePhoto} />
                    <AvatarFallback>{user.username?.charAt(0) ?? ''}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                        {user.role}
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
                      onClick={() => handleApproveUser(user.id)}
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
                      onClick={() => handleUnblockUser(user.id)}
                      className="gap-1"
                    >
                      <Shield className="h-3 w-3" />
                      Unblock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBlockUser(user.id)}
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
    </div>
  );
};

export default AdminPage;
