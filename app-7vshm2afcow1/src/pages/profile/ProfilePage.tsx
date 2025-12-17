import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
    employeeId: user?.employeeId || '',
    companyEmail: user?.companyEmail || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      companyEmail: user?.companyEmail || ''
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
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
              <Avatar className="h-32 w-32 mb-4 group-hover:opacity-80 transition-opacity">
                <AvatarImage src={user?.profilePhoto} className="object-cover" />
                <AvatarFallback className="text-4xl">{user?.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">Change Photo</span>
              </div>
            </div>
            <input
              type="file"
              id="photo-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={!editing}
            />
            <div className="text-center">
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
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
                <Input value={user?.role} disabled className="capitalize" />
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <Input value={new Date(user?.createdAt || '').toLocaleDateString()} disabled />
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
    </div>
  );
};

export default ProfilePage;
