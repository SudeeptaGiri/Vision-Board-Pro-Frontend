'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { 
  GripVertical, 
  Clock, 
  Calendar,
  Flag,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface KanbanCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    dueDate?: string;
    estimatedTime?: number;
    isAiGenerated?: boolean;
    goal?: {
      id: string;
      title: string;
      type: string;
    };
  };
  isDragging?: boolean;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-warm-border text-warm-muted dark:bg-warm-muted/30 dark:text-warm-border',
  MEDIUM: 'bg-terracotta-light text-terracotta dark:bg-terracotta/20 dark:text-terracotta-light',
  HIGH: 'bg-status-warning/20 text-status-warning dark:bg-status-warning/30 dark:text-status-warning',
  URGENT: 'bg-status-alert/20 text-status-alert dark:bg-status-alert/30 dark:text-status-alert',
};

const priorityIcons: Record<string, string> = {
  LOW: '○',
  MEDIUM: '◐',
  HIGH: '●',
  URGENT: '🔥',
};

export function KanbanCard({ task, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-warm-bg dark:bg-warm-text rounded-xl p-4 shadow-sm border border-warm-border dark:border-warm-muted/50 cursor-grab active:cursor-grabbing',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg rotate-2',
        'hover:shadow-md hover:shadow-terracotta/10 transition-shadow'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {task.isAiGenerated && (
            <Sparkles className="w-4 h-4 text-terracotta" />
          )}
          <Badge variant="secondary" className={cn('text-xs', priorityColors[task.priority])}>
            {priorityIcons[task.priority]} {task.priority}
          </Badge>
        </div>
        <GripVertical className="w-4 h-4 text-warm-border dark:text-warm-muted" />
      </div>

      {/* Title */}
      <h4 className="font-medium mb-2 line-clamp-2 text-warm-text dark:text-warm-bg">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-warm-muted dark:text-warm-border mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-warm-muted dark:text-warm-border">
        <div className="flex items-center gap-3">
          {task.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedTime}m</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Goal Tag */}
      {task.goal && (
        <div className="mt-3 pt-3 border-t border-warm-border dark:border-warm-muted/50">
          <span className="text-xs text-warm-muted bg-warm-card dark:bg-warm-muted/30 px-2 py-1 rounded-full">
            {task.goal.title}
          </span>
        </div>
      )}
    </div>
  );
}