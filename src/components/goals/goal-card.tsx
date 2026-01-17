'use client';

import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  BookOpen,
  Heart,
  Repeat,
  DollarSign,
  Briefcase,
  User,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<string, any> = {
  ACHIEVEMENT: Target,
  LEARNING: BookOpen,
  HEALTH: Heart,
  HABIT: Repeat,
  FINANCIAL: DollarSign,
  CAREER: Briefcase,
  PERSONAL: User,
};

const typeColors: Record<string, string> = {
  ACHIEVEMENT: 'bg-terracotta-light text-terracotta dark:bg-terracotta/20 dark:text-terracotta-light',
  LEARNING: 'bg-status-warning/20 text-status-warning dark:bg-status-warning/30 dark:text-status-warning',
  HEALTH: 'bg-sage-light text-sage dark:bg-sage/20 dark:text-sage-light',
  HABIT: 'bg-warm-highlight text-warm-text dark:bg-warm-muted/30 dark:text-warm-bg',
  FINANCIAL: 'bg-sage-light text-sage-hover dark:bg-sage/30 dark:text-sage-light',
  CAREER: 'bg-terracotta/10 text-terracotta dark:bg-terracotta/20 dark:text-terracotta-light',
  PERSONAL: 'bg-status-alert/20 text-status-alert dark:bg-status-alert/30 dark:text-status-alert',
};

const statusColors: Record<string, string> = {
  NOT_STARTED: 'bg-warm-border text-warm-muted',
  IN_PROGRESS: 'bg-terracotta-light text-terracotta',
  ON_HOLD: 'bg-status-warning/20 text-status-warning',
  COMPLETED: 'bg-sage-light text-sage',
  ABANDONED: 'bg-status-alert/20 text-status-alert',
};

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    progress: number;
    targetDate?: string;
    _count?: {
      tasks: number;
      subGoals: number;
    };
    completedTasks?: number;
    category?: {
      name: string;
      color: string;
    };
  };
}

export function GoalCard({ goal }: GoalCardProps) {
  const Icon = typeIcons[goal.type] || Target;
  const totalTasks = goal._count?.tasks || 0;
  const completedTasks = goal.completedTasks || 0;

  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="glass-card rounded-2xl p-6 hover:shadow-xl hover:shadow-terracotta/15 transition-all duration-300 group cursor-pointer h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${typeColors[goal.type]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <Badge variant="secondary" className={statusColors[goal.status]}>
            {goal.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-lg mb-2 text-warm-text dark:text-warm-bg group-hover:text-terracotta dark:group-hover:text-terracotta-light transition-colors line-clamp-2">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-sm text-warm-muted dark:text-warm-border mb-4 line-clamp-2">
            {goal.description}
          </p>
        )}

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-warm-muted dark:text-warm-border">Progress</span>
            <span className="font-medium text-warm-text dark:text-warm-bg">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" aria-label={`${goal.title} progress: ${goal.progress}%`} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-warm-muted dark:text-warm-border">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completedTasks}/{totalTasks} tasks</span>
          </div>
          {goal.targetDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(goal.targetDate), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Category */}
        {goal.category && (
          <div className="mt-4 pt-4 border-t border-warm-border dark:border-warm-muted/50">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: goal.category.color }}
              />
              <span className="text-sm text-warm-muted dark:text-warm-border">{goal.category.name}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}