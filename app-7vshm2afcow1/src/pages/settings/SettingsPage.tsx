import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Lock } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  // Change Password State & Handler
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      await apiService.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      toast.success('Password updated successfully');
      setIsChangePasswordOpen(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto container py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage security and account preferences</p>
      </div>

      <div className="max-w-3xl">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Security</CardTitle>
            </div>
            <CardDescription className="ml-12 relative -top-2">
              Manage your password and account security
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-12 pb-8 pt-0">
            <div className="bg-muted/30 rounded-xl border border-border p-1">
              <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-background rounded-lg transition-colors group">
                    <span className="text-sm font-medium">Change Password</span>
                    <Button variant="outline" size="sm" className="bg-white hover:bg-muted font-medium">Change Password</Button>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Update your account password. Ensure your new password is secure.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                    <Button onClick={handleChangePassword} disabled={loading}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
