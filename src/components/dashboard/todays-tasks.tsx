'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  goal?: {
    title: string;
  };
}

export function TodaysTasks() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['todaysTasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/today');
      return response.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.post(`/tasks/${taskId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysTasks'] });
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-warm border border-warm-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-border dark:bg-warm-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-warm-border dark:bg-warm-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tasks: Task[] = data?.tasks || [];

  return (
    <div className="glass-card rounded-2xl p-6 shadow-warm border border-warm-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-warm-text dark:text-warm-bg">
          Today&apos;s Tasks
        </h3>
        <span className="text-sm text-warm-muted dark:text-warm-border">
          {tasks.filter((t) => t.status === 'COMPLETED').length}/{tasks.length} completed
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-warm-muted dark:text-warm-border">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-sage" />
          <p>No tasks for today!</p>
          <p className="text-sm">Enjoy your day or add some tasks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                task.status === 'COMPLETED'
                  ? 'bg-sage-light dark:bg-sage/20'
                  : 'bg-warm-card dark:bg-warm-muted/20 hover:bg-warm-border dark:hover:bg-warm-muted/30'
              )}
            >
              <Checkbox
                checked={task.status === 'COMPLETED'}
                onCheckedChange={() => completeMutation.mutate(task.id)}
                disabled={completeMutation.isPending}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    task.status === 'COMPLETED'
                      ? 'text-warm-muted line-through'
                      : 'text-warm-text dark:text-warm-bg'
                  )}
                >
                  {task.title}
                </p>
                {task.goal && (
                  <p className="text-xs text-warm-muted dark:text-warm-border truncate">
                    {task.goal.title}
                  </p>
                )}
              </div>
              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-warm-muted">
                  <Clock className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TodaysTasks;
