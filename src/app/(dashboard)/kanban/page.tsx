'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Filter } from 'lucide-react';

// Lazy load kanban components (heavy due to drag-n-drop)
const KanbanColumn = dynamic(() => import('@/components/kanban/kanban-column').then(mod => ({ default: mod.KanbanColumn })), {
  loading: () => <div className="flex-1 min-w-[280px] animate-pulse bg-warm-card dark:bg-warm-muted/30 rounded-xl h-96" />,
  ssr: false,
});

const KanbanCard = dynamic(() => import('@/components/kanban/kanban-card').then(mod => ({ default: mod.KanbanCard })), {
  loading: () => <div className="animate-pulse bg-warm-card rounded-lg h-24" />,
  ssr: false,
});

const columns = [
  { id: 'TODO', title: 'To Do', color: 'gray' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'blue' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'yellow' },
  { id: 'COMPLETED', title: 'Completed', color: 'green' },
];

export default function KanbanPage() {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch goals for filter
  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/goals');
      return response.data;
    },
  });

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', selectedGoal],
    queryFn: async () => {
      const params = selectedGoal !== 'all' ? `?goalId=${selectedGoal}` : '';
      const response = await api.get(`/tasks${params}`);
      return response.data;
    },
  });

  // Update task mutation with optimistic updates
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status, order }: { id: string; status: string; order: number }) => {
      const response = await api.put(`/tasks/${id}/reorder`, { status, order });
      return response.data;
    },
    onMutate: async ({ id, status, order }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', selectedGoal] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks', selectedGoal]);

      // Optimistically update the cache
      queryClient.setQueryData(['tasks', selectedGoal], (old: any[]) => {
        if (!old) return old;
        
        return old.map((task: any) => {
          if (task.id === id) {
            return { ...task, status, order };
          }
          return task;
        }).sort((a: any, b: any) => a.order - b.order);
      });

      // Return context with the snapshotted value
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // If mutation fails, rollback to the previous value
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', selectedGoal], context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find((t: any) => t.id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks?.find((t: any) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === over.id);
    if (targetColumn) {
      // Dropped on column header - move to end of that column
      const columnTasks = tasks?.filter((t: any) => t.status === targetColumn.id) || [];
      updateTaskMutation.mutate({
        id: activeTask.id,
        status: targetColumn.id,
        order: columnTasks.length,
      });
      return;
    }

    // Dropped on another task
    const overTask = tasks?.find((t: any) => t.id === over.id);
    if (overTask && activeTask.id !== overTask.id) {
      updateTaskMutation.mutate({
        id: activeTask.id,
        status: overTask.status,
        order: overTask.order,
      });
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks?.filter((task: any) => task.status === status) || [];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-text dark:text-warm-bg">Kanban Board</h1>
          <p className="text-sm sm:text-base text-warm-muted dark:text-warm-border mt-1">Drag and drop tasks to update their status</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Select value={selectedGoal} onValueChange={setSelectedGoal}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="Filter by goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {goals?.map((goal: any) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible snap-x snap-mandatory">
          {columns.map((column) => (
            <div key={column.id} className="min-w-[280px] sm:min-w-0 snap-start">
              <KanbanColumn
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={getTasksByStatus(column.id)}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}