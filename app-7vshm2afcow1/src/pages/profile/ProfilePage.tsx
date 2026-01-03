import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
    employeeId: user?.employeeId || '',
    companyEmail: user?.companyEmail || '',
    joiningDate: user?.joiningDate || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Update Joining Date first if changed and authorized
      if (['admin', 'hr', 'manager'].includes(user?.role || '') && formData.joiningDate !== user?.joiningDate) {
        if (formData.joiningDate) {
          await import('@/services/api').then(m => m.apiService.updateJoiningDate(user!.id, formData.joiningDate));
          toast.success('Joining Date updated');
        }
      }

      // 2. Update standard profile (this will refresh the user context)
      await updateUser(formData);

      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      email: user?.email || '',
      employeeId: user?.employeeId || '',
      companyEmail: user?.companyEmail || '',
      joiningDate: user?.joiningDate || ''
    });
    setEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await updateUser({ ...user, profilePhoto: base64String });
          toast.success('Profile photo updated');
        } catch (error) {
          console.error(error);
          toast.error('Failed to update photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <Card className="glass-card shadow-elegant">
        <CardHeader className="gradient-header text-white">
          <div className="flex items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {!editing ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleCancel} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="secondary" size="sm" onClick={handleSubmit} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-10">
            <Dialog>
              <div className="relative group">
                <DialogTrigger asChild>
                  <div className="w-64 h-64 rounded-[60px] overflow-hidden border-[10px] border-slate-100 shadow-2xl bg-slate-800 transition-all duration-500 group-hover:scale-[1.02] cursor-pointer ring-8 ring-blue-500/5">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="text-7xl font-black text-slate-300">{user?.username.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                </DialogTrigger>

                {/* Edit Button - Separated from Preview Logic */}
                {editing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('photo-upload')?.click();
                    }}
                    className="absolute -bottom-2 -right-2 bg-blue-600 w-16 h-16 rounded-[24px] border-[6px] border-white flex items-center justify-center shadow-2xl z-20 hover:scale-110 hover:bg-blue-700 transition-all cursor-pointer group/edit shadow-blue-500/20"
                  >
                    <Edit className="h-6 w-6 text-white" />
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover/edit:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest pointer-events-none shadow-xl">
                      Update Media
                    </div>
                  </button>
                )}

                <div className="absolute inset-0 pointer-events-none bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-[60px] flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-white text-blue-600 font-black px-4 py-2 rounded-2xl text-xs uppercase tracking-widest shadow-xl">
                    Full Preview
                  </div>
                </div>
              </div>

              <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                <div className="relative w-full aspect-square max-h-[85vh]">
                  <img
                    src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                    className="w-full h-full object-cover rounded-[80px] border-[16px] border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.6)]"
                    alt="Identity Full View"
                  />
                  <div className="absolute -bottom-12 left-0 right-0 text-center">
                    <h4 className="text-white font-black text-2xl uppercase tracking-[0.3em] drop-shadow-2xl">{user?.username}</h4>
                    <p className="text-blue-400 font-bold text-xs uppercase tracking-widest opacity-80 pt-1">Verified Personnel</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <input
              type="file"
              id="photo-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={!editing}
            />

            <div className="text-center mt-8">
              <h2 className="text-5xl font-black tracking-tighter text-slate-900">{user?.username}</h2>
              <p className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] mt-3 bg-blue-50/50 px-6 py-2 rounded-full inline-block border border-blue-100/50">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Full Name</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  disabled={!editing}
                  placeholder="EMP-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                  id="companyEmail"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role?.replace('_', ' ')} disabled className="capitalize" />
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input value={new Date(user?.createdAt || '').toLocaleDateString()} disabled />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Joining Date</Label>
                {editing && ['admin', 'hr', 'manager'].includes(user?.role || '') ? (
                  <Input
                    type="date"
                    value={formData.joiningDate ? new Date(formData.joiningDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  />
                ) : (
                  <Input
                    value={formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Updated'}
                    disabled
                  />
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-elegant">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                {user?.isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Access Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                {user?.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  );
};

export default ProfilePage;
