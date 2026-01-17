'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GoalProgressCardProps {
  goal: {
    id: string;
    title: string;
    progress: number;
    imageUrl?: string;
  };
  className?: string;
}

export function GoalProgressCard({ goal, className }: GoalProgressCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-coffee-cream dark:bg-coffee-espresso shadow-lg border border-coffee-light dark:border-coffee-dark',
        className
      )}
    >
      {goal.imageUrl && (
        <div className="h-32 overflow-hidden">
          <img
            src={goal.imageUrl}
            alt={goal.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-semibold text-coffee-espresso dark:text-coffee-cream mb-2">
          {goal.title}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-coffee-medium dark:text-coffee-light">Progress</span>
            <span className="font-medium text-coffee-espresso dark:text-coffee-cream">
              {goal.progress}%
            </span>
          </div>
          <Progress value={goal.progress} />
        </div>
      </div>
    </div>
  );
}

export default GoalProgressCard;
