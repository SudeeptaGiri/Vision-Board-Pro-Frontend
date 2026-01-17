'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Flame,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { GoalCard } from '@/components/goals/goal-card';
import { TodaysTasks } from '@/components/dashboard/today-tasks';
import { HabitTracker } from '@/components/dashboard/habit-tracker';
import { MotivationalQuote } from '@/components/dashboard/motivational-quote';

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [goalsRes, tasksRes, habitsRes] = await Promise.all([
        api.get('/goals?status=IN_PROGRESS'),
        api.get('/tasks/today'),
        api.get('/habits'),
      ]);
      return {
        goals: goalsRes.data,
        todaysTasks: tasksRes.data,
        habits: habitsRes.data,
      };
    },
  });

  const activeGoals = stats?.goals || [];
  const todaysTasks = stats?.todaysTasks?.tasks || [];
  const habits = stats?.todaysTasks?.habits || [];

  // Calculate stats
  const completedToday = todaysTasks.filter((t: any) => t.status === 'COMPLETED').length;
  const totalToday = todaysTasks.length;
  const habitsCompletedToday = habits.filter((h: any) => h.completedToday).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-text dark:text-warm-bg">Welcome back! 👋</h1>
          <p className="text-sm sm:text-base text-warm-muted dark:text-warm-border mt-1">
            Here&apos;s what&apos;s happening with your goals today.
          </p>
        </div>
        <MotivationalQuote />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title="Active Goals"
          value={activeGoals.length}
          icon={Target}
          color="terracotta"
          trend="+2 this week"
        />
        <StatCard
          title="Tasks Today"
          value={`${completedToday}/${totalToday}`}
          icon={CheckCircle2}
          color="sage"
          progress={(completedToday / totalToday) * 100 || 0}
        />
        <StatCard
          title="Habits Today"
          value={`${habitsCompletedToday}/${habits.length}`}
          icon={Flame}
          color="warning"
          progress={(habitsCompletedToday / habits.length) * 100 || 0}
        />
        <StatCard
          title="Current Streak"
          value="7 days"
          icon={TrendingUp}
          color="highlight"
          trend="Personal best!"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-warm-text dark:text-warm-bg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-terracotta" />
              Today's Tasks
            </h2>
            <Link href="/kanban">
              <Button variant="ghost" size="sm" className="text-sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <TodaysTasks tasks={todaysTasks} />
        </div>

        {/* Habits */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-warm-text dark:text-warm-bg">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-status-warning" />
              Daily Habits
            </h2>
            <Link href="/habits">
              <Button variant="ghost" size="sm" className="text-sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <HabitTracker habits={habits} />
        </div>
      </div>

      {/* Active Goals */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-warm-text dark:text-warm-bg">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-terracotta" />
            Active Goals
          </h2>
          <Link href="/goals">
            <Button variant="ghost" size="sm" className="text-sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {activeGoals.slice(0, 3).map((goal: any) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  progress,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: 'terracotta' | 'sage' | 'warning' | 'highlight';
  trend?: string;
  progress?: number;
}) {
  const colors = {
    terracotta: 'bg-terracotta-light dark:bg-terracotta/20 text-terracotta dark:text-terracotta-light',
    sage: 'bg-sage-light dark:bg-sage/20 text-sage dark:text-sage-light',
    warning: 'bg-status-warning/20 dark:bg-status-warning/20 text-status-warning',
    highlight: 'bg-warm-highlight dark:bg-warm-muted/20 text-warm-text dark:text-warm-bg',
  };

  return (
    <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-warm-muted dark:text-warm-border truncate">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 text-warm-text dark:text-warm-bg">{value}</p>
          {trend && (
            <p className="text-xs sm:text-sm text-emerald-600 mt-1 hidden sm:block">{trend}</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colors[color]} flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </div>
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="mt-3 sm:mt-4" />
      )}
    </div>
  );
}