'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Check, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HabitTrackerProps {
  habits: any[];
}

export function HabitTracker({ habits }: HabitTrackerProps) {
  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      await api.post(`/habits/${habitId}/log`, {
        date: new Date().toISOString(),
        completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  if (habits.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Flame className="w-12 h-12 mx-auto text-status-warning mb-4" />
        <h3 className="text-lg font-semibold text-warm-text dark:text-warm-bg mb-2">No habits yet</h3>
        <p className="text-warm-muted dark:text-warm-border">Create habits to track daily</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className={cn(
            'glass-card rounded-xl p-4 flex items-center gap-4 transition-all',
            habit.completedToday && 'bg-sage-light/80 dark:bg-sage/20'
          )}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            {habit.completedToday ? (
              <Check className="w-5 h-5 text-sage" />
            ) : (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: habit.color }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-warm-text dark:text-warm-bg">{habit.title}</p>
            <div className="flex items-center gap-1 text-sm text-warm-muted dark:text-warm-border">
              <Flame className="w-3 h-3 text-status-warning" />
              <span>{habit.currentStreak || 0} day streak</span>
            </div>
          </div>
          <Button
            size="sm"
            variant={habit.completedToday ? 'secondary' : 'default'}
            onClick={() => logMutation.mutate({
              habitId: habit.id,
              completed: !habit.completedToday,
            })}
            className={cn(
              !habit.completedToday && 'gradient-bg hover:opacity-90'
            )}
          >
            {habit.completedToday ? 'Done' : 'Complete'}
          </Button>
        </div>
      ))}
    </div>
  );
}