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
  X
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'employee', 'marketing'] },
    { name: 'Employees', href: '/admin/employees', icon: Users, roles: ['admin', 'hr'] },
    { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['admin', 'hr', 'employee', 'marketing'] },
    { name: 'Leave', href: '/leave', icon: Calendar, roles: ['admin', 'hr', 'employee', 'marketing'] },
    { name: 'Teams', href: '/teams', icon: UsersRound, roles: ['admin', 'hr', 'employee', 'marketing'] },
    { name: 'Documents', href: '/documents', icon: FileText, roles: ['admin', 'hr', 'employee', 'marketing'] },
    { name: 'Notes', href: '/notes', icon: StickyNote, roles: ['admin', 'hr', 'employee', 'marketing'] },
    { name: 'Holidays', href: '/holidays', icon: Palmtree, roles: ['admin', 'hr', 'employee', 'marketing'] },
    { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['admin', 'hr', 'employee'] },
    { name: 'Navigation Logs', href: '/navigation', icon: Navigation, roles: ['admin', 'marketing'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'hr', 'employee', 'marketing'] }
  ];

  const filteredNavigation = navigation.filter(item =>
    user && item.roles.includes(user.role.toLowerCase())
  );

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="xl:hidden fixed top-0 left-0 right-0 z-50 gradient-header h-16 flex items-center justify-between px-4">
        <h1 className="text-xl font-bold text-white">HR System</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:bg-white/20"
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
          <div className="h-16 flex items-center px-6 border-b border-border gradient-header">
            <h1 className="text-xl font-bold text-white">HR System</h1>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user?.profilePhoto} />
                <AvatarFallback>
                  {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
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
