'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Flame, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface HabitCardProps {
  habit: {
    id: string;
    title: string;
    description?: string;
    color: string;
    frequency: string;
    currentStreak?: number;
    completedToday?: boolean;
    logs?: { date: string; completed: boolean }[];
  };
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const isCompletedOnDay = (date: Date) => {
    return habit.logs?.some(
      (log) => isSameDay(new Date(log.date), date) && log.completed
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: habit.color }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-warm-text dark:text-warm-bg">{habit.title}</h3>
            {habit.description && (
              <p className="text-sm text-warm-muted dark:text-warm-border">{habit.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Habit options">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Week View */}
      <div className="flex justify-between mb-4">
        {weekDays.map((day, index) => {
          const isCompleted = isCompletedOnDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="text-xs text-warm-muted dark:text-warm-border">
                {format(day, 'EEE')}
              </span>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  isCompleted && 'text-white',
                  isToday && !isCompleted && 'ring-2 ring-terracotta',
                  !isCompleted && 'bg-warm-border/50 dark:bg-warm-muted/30'
                )}
                style={{
                  backgroundColor: isCompleted ? habit.color : undefined,
                }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  format(day, 'd')
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-warm-border/50 dark:border-warm-muted/30">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-status-warning" />
          <span className="text-sm font-medium text-warm-text dark:text-warm-bg">
            {habit.currentStreak || 0} day streak
          </span>
        </div>
        <Button
          onClick={onToggle}
          variant={habit.completedToday ? 'default' : 'outline'}
          size="sm"
          className={cn(
            habit.completedToday && 'bg-sage hover:bg-sage-hover cursor-default'
          )}
          disabled={habit.completedToday}
        >
          {habit.completedToday ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Completed
            </>
          ) : (
            'Mark Complete'
          )}
        </Button>
      </div>
    </div>
  );
}