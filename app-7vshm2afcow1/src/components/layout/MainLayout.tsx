import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  UsersRound,
  FileText,
  Navigation,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  TrendingUp,
  LifeBuoy,
  MapPin,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'marketing_executive' && user?.id) {
      const track = () => {
        import('@/services/api').then(({ apiService }) => {
          apiService.trackSession(user.id).catch(console.error);
        });
      };
      track();
      const interval = setInterval(track, 2 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Admin Approve', href: '/admin/employees', icon: Users, roles: ['admin', 'hr', 'manager'] },
    { name: 'Attendance Management', href: '/attendance', icon: Clock, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Geolocation Management', href: '/admin/geolocation', icon: MapPin, roles: ['admin', 'hr', 'manager'] },
    { name: 'Leave', href: '/leave', icon: Calendar, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Teams', href: '/teams', icon: UsersRound, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Documents', href: '/documents', icon: FileText, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Goals & Reviews', href: '/performance', icon: TrendingUp, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Notes', href: '/notes', icon: FileText, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Holidays', href: '/holidays', icon: Calendar, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Payroll', href: '/payroll', icon: Navigation, roles: ['admin', 'marketing'] },
    { name: 'Navigation Logs', href: '/navigation', icon: Navigation, roles: ['admin', 'marketing'] },
    { name: 'Shift Management', href: '/shifts', icon: Clock, roles: ['admin', 'hr', 'manager'] },
    { name: 'Branch Management', href: '/admin/branches', icon: Landmark, roles: ['admin'] },
    { name: 'Notification Management', href: '/notification-settings', icon: Bell, roles: ['admin', 'hr', 'manager'] },
    { name: 'Helpdesk', href: '/helpdesk', icon: LifeBuoy, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'My Work Updates', href: '/work-updates/my', icon: FileText, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Work Updates', href: '/work-updates/dashboard', icon: Calendar, roles: ['admin', 'hr', 'manager'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'hr', 'manager', 'employee', 'marketing', 'marketing_executive'] }
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!user?.role) return false;
    const userRoleStr = String(user.role).toLowerCase();
    return item.roles.some(role => role.toLowerCase() === userRoleStr);
  });

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  const roleTheme = (role?: string) => {
    const r = role?.toLowerCase();
    if (r === 'admin') return 'role-badge-admin';
    if (r === 'hr') return 'role-badge-hr';
    if (r === 'manager') return 'role-badge-manager';
    return 'role-badge-employee';
  };

  return (
    <div className="min-h-screen bg-background flex font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[300px] xl:w-[320px] bg-sidebar flex flex-col border-r border-sidebar-border shadow-2xl transition-all duration-500 ease-in-out transform',
          'xl:translate-x-0 xl:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex-none pt-8 pb-6 px-8">
          <Link to="/dashboard" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-black/5 group-hover:scale-105 transition-all duration-500">
              <LayoutDashboard className="text-white h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none font-sans drop-shadow-sm">
                Edu<span className="text-primary">Talks</span>
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1 opacity-80">
                Enterprise v2.2
              </span>
            </div>
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="flex-none px-6 mb-6">
          <Link to="/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 hover:border-slate-200 transition-all duration-300 group relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex-none">
              <Avatar className="h-12 w-12 ring-2 ring-white shadow-md group-hover:scale-105 transition-transform duration-300">
                <AvatarImage src={user?.profilePhoto} className="object-cover" />
                <AvatarFallback className="bg-primary text-white font-bold text-sm">
                  {user?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                {user?.username}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                  roleTheme(user?.role) === 'role-badge-admin' ? "bg-primary/10 text-primary" :
                    roleTheme(user?.role) === 'role-badge-hr' ? "bg-purple-100 text-purple-600" :
                      "bg-slate-100 text-slate-500"
                )}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation & Logout Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-1.5 custom-scrollbar">
          <div className="px-4 py-2">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Menu</p>
          </div>

          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-4 px-4 h-14 w-full rounded-xl transition-all duration-300 group relative overflow-hidden',
                  active
                    ? 'bg-primary text-white shadow-md shadow-primary/20 translate-x-1'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                )}
              >
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                  active ? "bg-white/20 text-white" : "bg-transparent text-slate-400 group-hover:text-primary group-hover:bg-primary/10")}>
                  <Icon className={cn('h-[22px] w-[22px] transition-transform duration-300', active ? '' : 'group-hover:scale-110')} strokeWidth={active ? 2 : 1.5} />
                </div>

                <span className={cn("text-[15px] font-medium tracking-wide flex-1 transition-all", active ? "font-bold" : "")}>
                  {item.name}
                </span>

                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm mr-2 animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* Integrated Logout Button */}
          <div className="pt-4 mt-2">
            <div className="h-px w-full bg-slate-100 mb-4" />
            <Button
              variant="ghost"
              onClick={logout}
              className="flex items-center gap-4 px-4 h-14 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group relative overflow-hidden justify-start"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent text-slate-400 group-hover:text-red-500 group-hover:bg-red-100 transition-all">
                <LogOut className="h-[22px] w-[22px]" strokeWidth={1.5} />
              </div>
              <span className="text-[15px] font-medium tracking-wide">Secure Log Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Surface Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all bg-background">
        {/* Compact Mobile Header */}
        <header className="xl:hidden h-20 px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-border z-40 sticky top-0">
          <Link to="/dashboard" className="font-black text-xl tracking-tight text-slate-900">Edu<span className="text-primary">Talks</span></Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl text-slate-700 hover:bg-slate-100 active:scale-90 transition-all h-12 w-12"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {/* Global Page Wrapper */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Subtle Ambient Background - High Key */}
          <div className="fixed inset-0 pointer-events-none z-[-1]">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-100/40 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px]" />
          </div>

          <div className="container max-w-[1600px] mx-auto p-6 sm:p-10 lg:p-12">
            {children}
          </div>
        </main>
      </div>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 xl:hidden transition-all duration-500 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;
