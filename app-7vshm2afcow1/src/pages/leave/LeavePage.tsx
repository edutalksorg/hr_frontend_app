import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Check, X } from 'lucide-react';
import type { Leave, LeaveBalance } from '@/types';
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

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const promises = [
        apiService.getLeaves(),
        // apiService.getLeaveBalance()
      ];

      if (user?.role === 'admin' || user?.role === 'hr') {
        promises.push(apiService.getPendingLeaves());
        promises.push(apiService.getApprovedLeaves());
      }

      const results = await Promise.all(promises);
      const myLeaves = results[0] as Leave[];
      // const balanceData = results[1] as LeaveBalance;

      let pendingLeaves: Leave[] = [];
      let approvedLeaves: Leave[] = [];

      if (user?.role === 'admin' || user?.role === 'hr') {
        pendingLeaves = (results[1] || []) as Leave[];
        approvedLeaves = (results[2] || []) as Leave[];
      }

      // Combine my leaves, pending leaves and approved leaves (deduplicated by ID)
      const allLeaves = [...pendingLeaves, ...approvedLeaves, ...myLeaves];
      const uniqueLeaves = Array.from(new Map(allLeaves.map(item => [item.id, item])).values());

      // Sort by date descending
      uniqueLeaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      setLeaves(uniqueLeaves);
      // setBalance(balanceData);
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
              leaves.map((leave) => (
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
                    {((user?.role === 'admin') || (user?.role === 'hr' && leave.userRole?.toUpperCase() !== 'HR')) && leave.status.toLowerCase() === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleApprove(leave.id)} className="gap-1">
                          <Check className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(leave.id)} className="gap-1">
                          <X className="h-3 w-3" />
                          Reject
                        </Button>
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
