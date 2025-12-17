import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  UsersRound,
  FileText,
  StickyNote,
  Palmtree,
  DollarSign,
  Navigation,
  Settings,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Track IP every 2 hours for Marketing Executive
  React.useEffect(() => {
    if (user?.role?.toLowerCase() === 'marketing_executive' && user?.id) {
      const track = () => {
        import('@/services/api').then(({ apiService }) => {
          apiService.trackSession(user.id).catch(console.error);
        });
      };

      // Call immediately on load
      track();

      // Set interval for 2 hours (2 * 60 * 60 * 1000 ms)
      const interval = setInterval(track, 2 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Admin Approve', href: '/admin/employees', icon: Users, roles: ['admin', 'hr'] },
    { name: 'Attendance Management', href: '/attendance', icon: Clock, roles: ['admin', 'hr'] },
    { name: 'My Attendance', href: '/attendance', icon: Clock, roles: ['employee', 'marketing', 'marketing_executive'] },
    { name: 'Leave', href: '/leave', icon: Calendar, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Teams', href: '/teams', icon: UsersRound, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Documents', href: '/documents', icon: FileText, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Notes', href: '/notes', icon: StickyNote, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Holidays', href: '/holidays', icon: Palmtree, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['admin', 'hr', 'employee', 'marketing_executive'] },
    { name: 'Navigation Logs', href: '/navigation', icon: Navigation, roles: ['admin', 'marketing', 'marketing_executive'] },
    { name: 'Shift Management', href: '/shifts', icon: Clock, roles: ['admin', 'hr'] },
    { name: 'Notification Management', href: '/notification-settings', icon: Bell, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'hr', 'employee', 'marketing', 'marketing_executive'] }
  ];

  const filteredNavigation = navigation.filter(item =>
    user && item.roles.includes(user.role.toLowerCase())
  );

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-16 flex items-center justify-between px-4">
        <div className="flex items-center text-2xl font-bold tracking-tight">
          <span className="text-red-600">Edu</span>
          <span className="text-black">Talks</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hover:bg-accent"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300',
          'xl:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <div className="flex items-center text-2xl font-bold tracking-tight">
              <span className="text-red-600">Edu</span>
              <span className="text-black">Talks</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-border">
            <Link
              to="/profile"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-all cursor-pointer group"
              onClick={() => setSidebarOpen(false)}
            >
              <Avatar className="group-hover:ring-2 ring-primary/20 transition-all">
                <AvatarImage src={user?.profilePhoto} />
                <AvatarFallback>
                  {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Logout Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={cn('xl:ml-64 min-h-screen', 'pt-16 xl:pt-0')}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
