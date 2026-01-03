import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      if ("geolocation" in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        }).catch(() => null);
        if (position) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      }
      await login(email, password, latitude, longitude);
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

      <div className="w-full max-w-[450px] relative z-10 transition-all duration-500 ease-out transform">

        {/* Header Section */}
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm flex items-center justify-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">🔐</span>
            Welcome Back
          </h1>
          <p className="text-slate-400 text-base font-medium max-w-xs mx-auto leading-relaxed">
            Enter credentials to access the internal network.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative">

          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Work Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Work Email</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@edutalks.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 hover:bg-white/10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</Label>
                  <Link to="/forgot-password" className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline decoration-blue-400/30 underline-offset-4 transition-all">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 pr-12 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 hover:bg-white/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none p-1 rounded-md hover:bg-white/10"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                      Access Dashboard <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white/5 px-8 py-5 border-t border-white/5 flex flex-col items-center justify-center gap-2 backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400">
              New to the platform? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline decoration-blue-400/30 underline-offset-4 transition-all">Create an account</Link>
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

export default LoginPage;
