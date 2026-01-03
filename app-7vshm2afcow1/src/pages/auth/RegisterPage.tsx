import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Lock, User, ArrowRight, Loader2, Landmark, Briefcase } from 'lucide-react';
import { apiService } from '@/services/api';
import { Branch } from '@/types';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('EMPLOYEE');
  const [branchId, setBranchId] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await apiService.getBranches();
        setBranches(data);
      } catch (error) {
        console.error('Failed to load branches');
      }
    };
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, username, password, role, branchId);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 relative overflow-hidden bg-[#0F172A] font-sans selection:bg-blue-500/30">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0F172A] to-blue-900/20" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="w-full max-w-[500px] relative z-10 transition-all duration-500 ease-out transform">

        {/* Header Section */}
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm flex items-center justify-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">🚀</span>
            Join the Team
          </h1>
          <p className="text-slate-400 text-base font-medium max-w-sm mx-auto leading-relaxed">
            Create your professional profile
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative">

          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Section 1: Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Identity</span>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Full Name</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300">
                      <User className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 pl-11 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 hover:bg-white/10"
                      required
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Work Email</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300">
                      <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@edutalks.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-11 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 hover:bg-white/10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Organization */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Organization</span>
                </div>

                {/* Role Designation (Read Only) */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Role Designation</Label>
                  <div className="relative group cursor-not-allowed opacity-80">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <Briefcase className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="h-11 pl-11 flex items-center bg-white/5 border border-white/5 rounded-xl text-slate-400 text-sm font-medium">
                      Employee (Assigned by Admin)
                    </div>
                  </div>
                </div>

                {/* Assigned Branch */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="branch" className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Assigned Branch</Label>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors duration-300">
                      <Landmark className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400" />
                    </div>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger className="h-11 pl-11 bg-white/5 border-white/10 text-slate-100 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 hover:bg-white/10">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-xl rounded-xl max-h-[300px]">
                        {branches.map(b => (
                          <SelectItem key={b.id} value={b.id} className="focus:bg-slate-800 focus:text-blue-400 cursor-pointer">{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-slate-500 ml-1 font-medium">
                    Branch determines your attendance & reporting rules.
                  </p>
                </div>
              </div>

              {/* Section 3: Security */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Security</span>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Create Password</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300">
                      <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-11 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 hover:bg-white/10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Join Organization <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer Section */}
          <div className="bg-white/5 px-8 py-5 border-t border-white/5 flex flex-col items-center justify-center gap-2 backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400">
              Existing Account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline decoration-blue-400/30 underline-offset-4 transition-all">Access Portal</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5 opacity-70" />
            Secure sign-in enabled
          </p>
          <p className="text-sm text-slate-600 font-medium">
            © 2026 EduTalks HR Systems. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
