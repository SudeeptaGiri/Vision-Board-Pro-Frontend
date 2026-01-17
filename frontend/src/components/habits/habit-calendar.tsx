'use client';

import { cn } from '@/lib/utils';

interface HabitCalendarProps {
  habitId: string;
  logs: Array<{
    date: Date | string;
    completed: boolean;
  }>;
  className?: string;
}

export function HabitCalendar({ habitId, logs, className }: HabitCalendarProps) {
  // Generate last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const log = logs.find((l) => {
      const logDate = new Date(l.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === date.getTime();
    });
    
    days.push({
      date,
      completed: log?.completed || false,
    });
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {days.map((day, index) => (
        <div
          key={index}
          className={cn(
            'w-4 h-4 rounded-sm transition-colors',
            day.completed
              ? 'bg-gradient-to-br from-coffee-dark to-coffee-medium'
              : 'bg-coffee-light dark:bg-coffee-dark/50'
          )}
          title={day.date.toLocaleDateString()}
        />
      ))}
    </div>
  );
}

export default HabitCalendar;
