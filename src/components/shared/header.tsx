'use client';

import { Search, Plus, Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { CreateGoalModal } from '@/components/goals/create-goal-modal';
import { useSidebar } from '@/lib/sidebar-context';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const { openSidebar } = useSidebar();

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-warm-border/50 dark:border-warm-muted/30 bg-warm-bg/95 dark:bg-warm-text/95 backdrop-blur-sm flex items-center justify-between px-3 sm:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={openSidebar}
          className="lg:hidden mr-2 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-xs sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-muted" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-warm-card dark:bg-warm-muted/20 border-warm-border dark:border-warm-muted text-sm sm:text-base h-9 sm:h-10 placeholder:text-warm-muted/60"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3 ml-2">
          {/* New Goal Button - Hidden on mobile, shown on sm+ */}
          <Button
            onClick={() => setShowCreateGoal(true)}
            className="hidden sm:flex"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Goal</span>
          </Button>

          {/* Mobile New Goal Button */}
          <Button
            onClick={() => setShowCreateGoal(true)}
            className="sm:hidden"
            size="icon"
            aria-label="Create new goal"
          >
            <Plus className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 sm:w-10 sm:h-10"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>
      </header>

      <CreateGoalModal
        open={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
      />
    </>
  );
}






