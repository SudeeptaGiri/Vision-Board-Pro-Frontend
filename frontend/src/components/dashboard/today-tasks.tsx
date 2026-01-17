'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Check, Clock, Flag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface TodaysTasksProps {
  tasks: any[];
}

const priorityColors: Record<string, string> = {
  LOW: 'text-coffee-light dark:text-coffee-light/70',
  MEDIUM: 'text-coffee-medium',
  HIGH: 'text-amber-500',
  URGENT: 'text-red-500',
};

export function TodaysTasks({ tasks }: TodaysTasksProps) {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.post(`/tasks/${taskId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  if (tasks.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Check className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
        <h3 className="text-lg font-semibold text-coffee-espresso dark:text-coffee-cream mb-2">All caught up!</h3>
        <p className="text-coffee-medium dark:text-coffee-light/70">No tasks scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl divide-y divide-coffee-light/30 dark:divide-coffee-dark/50">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'flex items-center gap-4 p-4 hover:bg-coffee-light/20 dark:hover:bg-coffee-dark/30 transition-colors',
            task.status === 'COMPLETED' && 'opacity-50'
          )}
        >
          <Checkbox
            checked={task.status === 'COMPLETED'}
            onCheckedChange={() => completeMutation.mutate(task.id)}
            className="h-5 w-5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.isAiGenerated && (
                <Sparkles className="w-4 h-4 text-coffee-medium" />
              )}
              <p
                className={cn(
                  'font-medium truncate text-coffee-espresso dark:text-coffee-cream',
                  task.status === 'COMPLETED' && 'line-through'
                )}
              >
                {task.title}
              </p>
            </div>
            {task.goal && (
              <p className="text-sm text-coffee-medium dark:text-coffee-light/70 truncate">
                {task.goal.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {task.estimatedTime && (
              <div className="flex items-center gap-1 text-coffee-medium dark:text-coffee-light/70">
                <Clock className="w-4 h-4" />
                <span>{task.estimatedTime}m</span>
              </div>
            )}
            <Flag className={cn('w-4 h-4', priorityColors[task.priority])} />
          </div>
        </div>
      ))}
    </div>
  );
}