'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanCard } from './kanban-card';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: any[];
}

const colorClasses: Record<string, string> = {
  gray: 'bg-warm-card dark:bg-warm-muted/20',
  blue: 'bg-terracotta-light/50 dark:bg-terracotta/10',
  yellow: 'bg-status-warning/20 dark:bg-status-warning/10',
  green: 'bg-sage-light/50 dark:bg-sage/10',
};

const dotColors: Record<string, string> = {
  gray: 'bg-warm-muted',
  blue: 'bg-terracotta',
  yellow: 'bg-status-warning',
  green: 'bg-sage',
};

export function KanbanColumn({ id, title, color, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl p-4 min-h-[500px] transition-colors',
        colorClasses[color],
        isOver && 'ring-2 ring-terracotta ring-offset-2'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', dotColors[color])} />
          <h3 className="font-semibold text-warm-text dark:text-warm-bg">{title}</h3>
          <span className="text-sm text-warm-muted bg-warm-bg dark:bg-warm-muted/30 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tasks */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-32 border-2 border-dashed border-warm-border dark:border-warm-muted rounded-xl">
          <p className="text-sm text-warm-muted dark:text-warm-border">Drop tasks here</p>
        </div>
      )}
    </div>
  );
}