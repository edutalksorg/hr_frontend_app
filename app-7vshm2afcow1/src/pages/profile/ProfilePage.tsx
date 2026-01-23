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
    <div className="space-y-6 max-w-5xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and account settings</p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="gradient-header text-white p-6 md:p-8">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl md:text-2xl font-semibold">Personal Information</CardTitle>
            {!editing ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
                className="gap-2 text-gray-900 bg-white hover:bg-gray-100 rounded-xl shadow-sm transition-all hover:shadow-md px-4"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-2 rounded-xl px-4 hover:bg-gray-100 text-black hover:text-black"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  className="gap-2 bg-blue-600 text-white hover:bg-blue-700 border-none rounded-xl px-4 shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10">
          <div className="flex flex-col items-center mb-12">
            <Dialog>
              <div className="relative group">
                <DialogTrigger asChild>
                  <div className="relative w-48 h-48 md:w-56 md:h-56 p-2 bg-white rounded-3xl shadow-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 ring-1 ring-slate-100/50">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-100 relative">
                      {user?.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <span className="text-6xl font-black text-slate-300 select-none">{user?.username.charAt(0)}</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white/90 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg text-gray-900 uppercase tracking-wide">
                          Preview
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>

                {/* Edit Photo Button */}
                {editing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('photo-upload')?.click();
                    }}
                    className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 z-20 hover:scale-110 hover:bg-blue-50 transition-all cursor-pointer group/edit active:scale-95 text-blue-600"
                    title="Change Photo"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                )}
              </div>

              <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                <div className="relative w-full aspect-square max-h-[85vh] p-4">
                  <img
                    src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                    className="w-full h-full object-contain rounded-3xl drop-shadow-2xl"
                    alt="Identity Full View"
                  />
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

            <div className="text-center mt-8 space-y-2">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">{user?.username}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold tracking-wide uppercase border border-blue-100">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 ml-1">Full Name</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-50/50"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 ml-1">Email Address</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-50/50"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700 ml-1">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  disabled={!editing}
                  placeholder="EMP-001"
                  className="rounded-xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-50/50"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="companyEmail" className="text-sm font-medium text-gray-700 ml-1">Company Email</Label>
                <Input
                  id="companyEmail"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  disabled={!editing}
                  className="rounded-xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-50/50"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700 ml-1">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                rows={4}
                placeholder="Tell us about yourself..."
                className="rounded-xl resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-50/50"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-gray-700 ml-1">Role</Label>
                <Input
                  value={user?.role?.replace('_', ' ')}
                  disabled
                  className="capitalize rounded-xl h-12 bg-gray-100 text-gray-600 border-none"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-gray-700 ml-1">Member Since</Label>
                <Input
                  value={new Date(user?.createdAt || '').toLocaleDateString()}
                  disabled
                  className="rounded-xl h-12 bg-gray-100 text-gray-600 border-none"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-gray-700 ml-1">Joining Date</Label>
                {editing && ['admin', 'hr', 'manager'].includes(user?.role || '') ? (
                  <Input
                    type="date"
                    value={formData.joiningDate ? new Date(formData.joiningDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="rounded-xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                ) : (
                  <Input
                    value={formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Updated'}
                    disabled
                    className="rounded-xl h-12 bg-gray-100 text-gray-600 border-none"
                  />
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900">Account Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-sm font-medium text-gray-600">Account Status</span>
              <span className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase ${user?.isApproved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                {user?.isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-sm font-medium text-gray-600">Access Status</span>
              <span className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase ${user?.isBlocked ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
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
