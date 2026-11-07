import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Moon, Sun, User, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, title }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-8 bg-cafe-surface/85 dark:bg-cafe-darkSurface/85 backdrop-blur-md border-b border-cafe-border dark:border-cafe-darkBorder">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream rounded-xl hover:bg-cafe-cream dark:hover:bg-cafe-darkCard lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-lg font-bold tracking-tight text-cafe-text dark:text-cafe-cream">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Add Recipe */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/recipes/new')}
          className="hidden sm:inline-flex"
        >
          สร้างสูตรใหม่
        </Button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-cafe-muted hover:text-cafe-text dark:text-stone-400 dark:hover:text-cafe-cream rounded-xl hover:bg-cafe-cream dark:hover:bg-cafe-darkCard border border-cafe-border/60 dark:border-cafe-darkBorder transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cafe-muted" />}
        </button>

        {/* User Pill / Login Link */}
        <div className="flex items-center gap-2 pl-2 border-l border-cafe-border/70 dark:border-cafe-darkBorder">
          {user && user.email !== 'barista@studio.local' ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cafe-copper-light dark:bg-cafe-darkCard flex items-center justify-center text-cafe-copper border border-cafe-copper/20 font-semibold text-xs">
                {user.full_name ? user.full_name[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-semibold text-cafe-text dark:text-cafe-cream leading-tight">
                  {user.full_name || user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-[10px] text-rose-600 hover:underline leading-tight block"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<User className="w-3.5 h-3.5" />}
              onClick={() => navigate('/login')}
              className="text-xs"
            >
              เข้าสู่ระบบ
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
