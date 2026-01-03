import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Check, X, Trash2 } from 'lucide-react';
import type { Leave } from '@/types';
import { toast } from 'sonner';
import { BackButton } from '@/components/common/BackButton';

const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  // const [balance, setBalance] = useState<LeaveBalance | null>(null); // Removed dummy balance
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'casual' as Leave['type'],
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const myLeavesData = await apiService.getLeaves();
      const isAdminOrManager = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'hr' || user?.role?.toLowerCase() === 'manager';

      if (isAdminOrManager) {
        const allSystemLeaves = await apiService.getAllLeavesRequests();
        const combined = [...allSystemLeaves, ...myLeavesData];
        const uniqueLeaves = Array.from(new Map(combined.map((item: Leave) => [item.id, item])).values());
        uniqueLeaves.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setLeaves(uniqueLeaves);
      } else {
        const uniqueLeaves = Array.from(new Map(myLeavesData.map((item: Leave) => [item.id, item])).values());
        uniqueLeaves.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setLeaves(uniqueLeaves);
      }
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createLeave({
        userId: user?.id || '',
        ...formData,
        status: 'pending'
      });
      toast.success('Leave request submitted successfully');
      setDialogOpen(false);
      setFormData({ type: 'casual', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit leave request');
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await apiService.updateLeaveStatus(leaveId, 'approved');
      toast.success('Leave approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await apiService.updateLeaveStatus(leaveId, 'rejected');
      toast.success('Leave rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const handleDelete = async (leaveId: string) => {
    if (!confirm('Are you sure you want to delete this leave record?')) return;
    try {
      await apiService.deleteLeave(leaveId);
      toast.success('Leave record deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete leave record');
    }
  };

  if (loading) {
    return <div className="space-y-6"><h1 className="text-3xl font-bold">Leave Management</h1><p>Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Request and manage your leaves</p>
        </div>
      </div>
      {user?.role !== 'admin' && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Leave Type</Label>
                <Select value={formData.type} onValueChange={(value: Leave['type']) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Leave Balance Section Removed as per request (Dummy Data) */}

      {/* Leave History */}
      <Card className="glass-card shadow-elegant">
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaves.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No leave requests found</p>
            ) : (
              leaves.filter(l => {
                const statusFilter = searchParams.get('status');
                if (statusFilter === 'approved') return l.status?.toLowerCase() === 'approved';
                return true;
              }).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    {leave.userName ? (
                      <Avatar>
                        <AvatarImage src={leave.userProfilePhoto} />
                        <AvatarFallback>{leave.userName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      {leave.userName && (
                        <p className="font-medium">
                          {leave.userName}
                          {leave.userEmployeeId && <span className="text-muted-foreground text-xs ml-2">({leave.userEmployeeId})</span>}
                        </p>
                      )}
                      <p className={`text-sm ${leave.userName ? 'text-muted-foreground' : 'font-medium'} capitalize`}>{leave.type} Leave</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{leave.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${leave.status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {leave.status}
                    </span>
                    {((user?.role === 'admin') || (user?.role === 'hr' && leave.userRole?.toUpperCase() !== 'HR') || (user?.role === 'manager')) && (
                      <div className="flex gap-2">
                        {leave.status.toLowerCase() === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleApprove(leave.id)} className="gap-1 border-green-200 hover:bg-green-50 text-green-700">
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(leave.id)} className="gap-1 border-red-200 hover:bg-red-50 text-red-700">
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(leave.status.toLowerCase() === 'approved' || leave.status.toLowerCase() === 'rejected') && (
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(leave.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div >
  );
};

export default LeavePage;
