import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Briefcase, 
  Map, 
  FileText, 
  CreditCard, 
  CheckSquare, 
  Settings, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  User as UserIcon,
  Stamp
} from 'lucide-react';
import { useAuth } from '@/core/hooks/useAuth';
import { NotificationBell } from '@/shared/components/NotificationBell';
import { supabase } from '@/core/lib/supabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SudoModal } from '@/shared/components/SudoModal';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const AppShell: React.FC = () => {
  const { user, tenant } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', to: '/leads', icon: Users },
    { name: 'Customers', to: '/customers', icon: UserCheck },
    { name: 'Bookings', to: '/bookings', icon: Briefcase },
    { name: 'Itineraries', to: '/itineraries', icon: Map },
    { name: 'Visa Tracking', to: '/visa', icon: Stamp },
    { type: 'header', name: 'Finance', icon: FileText },
    { name: 'Quotations', to: '/quotations', icon: FileText, indent: true },
    { name: 'Invoices', to: '/invoices', icon: CreditCard, indent: true },
    { name: 'Tasks', to: '/tasks', icon: CheckSquare },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const mobileNavItems = [
    { name: 'Home', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', to: '/leads', icon: Users },
    { name: 'Clients', to: '/customers', icon: UserCheck },
    { name: 'Bookings', to: '/bookings', icon: Briefcase },
    { name: 'Tasks', to: '/tasks', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <h1 className="text-xl font-bold tracking-tight italic">INTRAVOS</h1>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-500"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform md:relative md:translate-x-0 hidden md:flex flex-col",
        isSidebarOpen ? "translate-x-0 flex" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-2xl font-black italic tracking-tighter text-indigo-600">
            INTRAVOS
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === 'header') {
              return (
                <div key={idx} className="pt-4 pb-1 group">
                  <span className="px-3 text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    {item.name}
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to!}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  item.indent && "ml-4"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    {item.name}
                    {isActive && <div className="ml-auto w-1 h-1 bg-indigo-600 rounded-full" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                {user?.role}
              </span>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 hidden md:flex">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
              {tenant?.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
              ) : (
                tenant?.name.charAt(0)
              )}
            </div>
            <span className="font-bold text-slate-900">{tenant?.name}</span>
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">{user?.designation || user?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium">
                 {user?.avatar_url ? (
                   <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
                 ) : (
                   <UserIcon className="w-4 h-4" />
                 )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Page */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-white border-t border-slate-200 flex items-center justify-around p-2 pb-safe shrink-0">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-16",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </main>
      <SudoModal />
    </div>
  );
};
