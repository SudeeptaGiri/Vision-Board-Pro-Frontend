'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Repeat,
  Image,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Kanban Board', href: '/kanban', icon: CheckSquare },
  { name: 'Habits', href: '/habits', icon: Repeat },
  { name: 'Vision Board', href: '/vision-board', icon: Image },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeSidebar]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen
          bg-warm-bg/95 dark:bg-warm-text/95 backdrop-blur-xl
          border-r border-warm-border/50 dark:border-warm-muted/30
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-72 sm:w-80
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-warm-border/50 dark:border-warm-muted/30">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center flex-shrink-0 shadow-terracotta">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-xl text-warm-text dark:text-warm-bg ${isCollapsed ? 'lg:hidden' : ''}`}>
                VisionBoard
              </span>
            </Link>
            
            {/* Close button for mobile */}
            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg hover:bg-warm-card dark:hover:bg-warm-muted/30 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-warm-muted" />
            </button>

            {/* Collapse button for desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-warm-card dark:hover:bg-warm-muted/30 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-warm-muted" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-warm-muted" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-terracotta text-white shadow-lg shadow-terracotta/25'
                        : 'text-warm-muted dark:text-warm-bg/70 hover:bg-warm-card dark:hover:bg-warm-muted/20 hover:text-warm-text dark:hover:text-warm-bg'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                  <span className={`font-medium ${isCollapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-warm-border/50 dark:border-warm-muted/30">
            {user && (
              <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0 shadow-terracotta">
                  <span className="text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
                  <p className="text-sm font-medium text-warm-text dark:text-warm-bg truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-warm-muted dark:text-warm-bg/70 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className={`
                mt-3 flex items-center gap-2 w-full px-3 py-3 sm:py-2 rounded-lg
                text-warm-muted dark:text-warm-bg/70 hover:bg-status-alert/10 hover:text-status-alert
                dark:hover:bg-status-alert/20 dark:hover:text-status-alert
                transition-colors
                ${isCollapsed ? 'lg:justify-center' : ''}
              `}
            >
              <LogOut className="w-5 h-5" />
              <span className={`text-sm font-medium ${isCollapsed ? 'lg:hidden' : ''}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
