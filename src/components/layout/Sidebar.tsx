import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Wheat,
  FolderTree,
  TableProperties,
  GraduationCap,
  Target,
  Gamepad2,
  Settings,
  Coffee,
  CloudCheck,
  HardDrive,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isSupabaseConnected } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Recipe Book', path: '/recipes', icon: BookOpen },
    { name: 'Ingredients', path: '/ingredients', icon: Wheat },
    { name: 'Categories', path: '/categories', icon: FolderTree },
    { name: 'Batch Editor', path: '/batch', icon: TableProperties },
    { name: 'Training Guide', path: '/training', icon: GraduationCap },
    { name: 'Practice', path: '/practice', icon: Target },
    { name: 'Simulator', path: '/simulator', icon: Gamepad2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-cafe-surface dark:bg-cafe-darkSurface border-r border-cafe-border dark:border-cafe-darkBorder transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-cafe-border/70 dark:border-cafe-darkBorder">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-cafe-espresso dark:bg-cafe-darkCard flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden p-1.5 border border-cafe-border/50 dark:border-cafe-darkBorder">
              <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-cafe-text dark:text-cafe-cream">
                BARISTA STUDIO
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-cafe-muted">
                Craft Workbench
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1.5 text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-cafe-cream dark:bg-cafe-darkCard text-cafe-copper font-semibold shadow-xs border border-cafe-border/50 dark:border-cafe-darkBorder'
                      : 'text-cafe-muted hover:text-cafe-text dark:text-stone-400 dark:hover:text-cafe-cream hover:bg-cafe-sand/30 dark:hover:bg-cafe-darkCard/50'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Storage status & system footer */}
        <div className="p-4 border-t border-cafe-border/70 dark:border-cafe-darkBorder">
          <div className="p-3 rounded-xl bg-cafe-cream/60 dark:bg-cafe-darkCard border border-cafe-border/60 dark:border-cafe-darkBorder">
            <div className="flex items-center gap-2 mb-1">
              {isSupabaseConnected ? (
                <>
                  <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    ระบบ Cloud ซิงก์
                  </span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-cafe-copper" />
                  <span className="text-xs font-semibold text-cafe-text dark:text-cafe-cream">
                    Local Storage
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-cafe-muted leading-tight">
              {isSupabaseConnected
                ? 'จัดเก็บและสำรองข้อมูลบน Cloud อัตโนมัติ'
                : 'บันทึกข้อมูลปลอดภัยบนเบราว์เซอร์ส่วนตัว'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
