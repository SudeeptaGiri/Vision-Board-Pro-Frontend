'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProgressAnalysisCard } from '@/components/goals/progress-analysis-card';
import {
  ArrowLeft,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Plus,
  Flag,
  ListTodo,
  Milestone,
  Loader2,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  order: number;
}

interface GoalMilestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  isCompleted: boolean;
  order: number;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ABANDONED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  progress: number;
  targetDate: string | null;
  createdAt: string;
  tasks: Task[];
  milestones: GoalMilestone[];
  subGoals: Goal[];
  category: { id: string; name: string; color: string } | null;
}

export default function GoalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const goalId = params.id as string;

  // Add Task modal state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    dueDate: '',
  });

  // Edit Goal modal state
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    status: 'IN_PROGRESS' as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ABANDONED',
    targetDate: '',
  });

  // Edit Task modal state
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    dueDate: '',
  });

  const { data: goal, isLoading, error } = useQuery<Goal>({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      const response = await api.get(`/goals/${goalId}`);
      return response.data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string; description: string; priority: string; dueDate: string; goalId: string }) => {
      const response = await api.post('/tasks', {
        ...taskData,
        dueDate: taskData.dueDate || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsAddTaskOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; priority: string; status: string; targetDate: string }) => {
      const response = await api.put(`/goals/${goalId}`, {
        ...data,
        targetDate: data.targetDate || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsEditGoalOpen(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      await api.put(`/tasks/${taskId}`, { status: completed ? 'COMPLETED' : 'TODO' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; title: string; description: string; priority: string; dueDate: string }) => {
      const response = await api.put(`/tasks/${data.taskId}`, {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        dueDate: data.dueDate || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsEditTaskOpen(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      router.push('/goals');
    },
  });

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'ABANDONED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateProgress = () => {
    if (!goal || goal.tasks.length === 0) return 0;
    const completedTasks = goal.tasks.filter((t) => t.status === 'COMPLETED').length;
    return Math.round((completedTasks / goal.tasks.length) * 100);
  };

  const openEditModal = () => {
    if (goal) {
      setEditGoal({
        title: goal.title,
        description: goal.description || '',
        priority: goal.priority,
        status: goal.status,
        targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
      });
      setIsEditGoalOpen(true);
    }
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setEditTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setIsEditTaskOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-warm-muted dark:text-warm-border">Goal not found</p>
        <Button onClick={() => router.push('/goals')} className="gradient-bg">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Goals
        </Button>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/goals')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Goals
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={openEditModal}>
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 hover:text-red-700"
              onClick={() => {
                if (confirm('Are you sure you want to delete this goal?')) {
                  deleteGoalMutation.mutate();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Goal Card */}
        <div className="bg-warm-card dark:bg-warm-muted/20 rounded-2xl shadow-warm border border-warm-border dark:border-warm-muted p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-terracotta/10 dark:bg-terracotta/20 rounded-xl">
                <Target className="w-6 h-6 text-terracotta" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-warm-text dark:text-warm-bg">
                  {goal.title}
                </h1>
                {goal.category && (
                  <span
                    className="text-sm px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: goal.category.color + '20', color: goal.category.color }}
                  >
                    {goal.category.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(goal.status)}>
                {goal.status.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(goal.priority)}>
                {goal.priority}
              </Badge>
            </div>
          </div>

          {goal.description && (
            <p className="text-warm-muted dark:text-warm-border mb-6">{goal.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-warm-muted dark:text-warm-border">
              <Calendar className="w-4 h-4" />
              <span>Target: {formatDate(goal.targetDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-warm-muted dark:text-warm-border">
              <Clock className="w-4 h-4" />
              <span>Created: {formatDate(goal.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-warm-muted dark:text-warm-border">
              <ListTodo className="w-4 h-4" />
              <span>{goal.tasks.length} Tasks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-warm-muted dark:text-warm-border">
              <Milestone className="w-4 h-4" />
              <span>{goal.milestones.length} Milestones</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-warm-muted dark:text-warm-border">Progress</span>
              <span className="font-medium text-warm-text dark:text-warm-bg">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>

        {/* AI Progress Analysis Card */}
        <ProgressAnalysisCard goalId={goalId} goalTitle={goal.title} />

        {/* Tasks Section */}
        <div className="bg-warm-card dark:bg-warm-muted/20 rounded-2xl shadow-warm border border-warm-border dark:border-warm-muted p-6 mb-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-warm-text dark:text-warm-bg flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              Tasks
            </h2>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsAddTaskOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>

          {goal.tasks.length === 0 ? (
            <p className="text-center text-warm-muted dark:text-warm-border py-8">
              No tasks yet. Add your first task to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {goal.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-warm-bg dark:bg-warm-text/10 rounded-lg"
                >
                  <Checkbox
                    checked={task.status === 'COMPLETED'}
                    onCheckedChange={(checked) =>
                      updateTaskMutation.mutate({ taskId: task.id, completed: !!checked })
                    }
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        task.status === 'COMPLETED'
                          ? 'line-through text-warm-muted'
                          : 'text-warm-text dark:text-warm-bg'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-warm-muted dark:text-warm-border">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority)} variant="outline">
                      <Flag className="w-3 h-3 mr-1" />
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs text-warm-muted dark:text-warm-border">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-warm-muted hover:text-terracotta"
                      onClick={() => openEditTaskModal(task)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-warm-muted hover:text-red-600"
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deleteTaskMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones Section */}
        {goal.milestones.length > 0 && (
          <div className="bg-warm-card dark:bg-warm-muted/20 rounded-2xl shadow-warm border border-warm-border dark:border-warm-muted p-6 mb-6">
            <h2 className="text-lg font-semibold text-warm-text dark:text-warm-bg flex items-center gap-2 mb-4">
              <Milestone className="w-5 h-5" />
              Milestones
            </h2>
            <div className="space-y-3">
              {goal.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 p-3 bg-warm-bg dark:bg-warm-text/10 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      milestone.isCompleted
                        ? 'bg-sage/20 text-sage'
                        : 'bg-warm-border dark:bg-warm-muted text-warm-muted dark:text-warm-border'
                    }`}
                  >
                    {milestone.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        milestone.isCompleted
                          ? 'line-through text-warm-muted'
                          : 'text-warm-text dark:text-warm-bg'
                      }`}
                    >
                      {milestone.title}
                    </p>
                    {milestone.description && (
                      <p className="text-sm text-warm-muted dark:text-warm-border">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                  {milestone.targetDate && (
                    <span className="text-xs text-warm-muted dark:text-warm-border">
                      {formatDate(milestone.targetDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-goals Section */}
        {goal.subGoals.length > 0 && (
          <div className="bg-warm-card dark:bg-warm-muted/20 rounded-2xl shadow-warm border border-warm-border dark:border-warm-muted p-6">
            <h2 className="text-lg font-semibold text-warm-text dark:text-warm-bg flex items-center gap-2 mb-4">
              <Target className="w-5 h-5" />
              Sub-goals
            </h2>
            <div className="space-y-3">
              {goal.subGoals.map((subGoal) => (
                <div
                  key={subGoal.id}
                  className="p-4 bg-warm-bg dark:bg-warm-text/10 rounded-lg cursor-pointer hover:bg-warm-hover dark:hover:bg-warm-muted/30 transition-colors"
                  onClick={() => router.push(`/goals/${subGoal.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-warm-text dark:text-warm-bg">{subGoal.title}</h3>
                    <Badge className={getStatusColor(subGoal.status)}>
                      {subGoal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {subGoal.description && (
                    <p className="text-sm text-warm-muted dark:text-warm-border line-clamp-2">
                      {subGoal.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description (optional)</Label>
              <Textarea
                id="task-description"
                placeholder="Add task description..."
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                    setNewTask(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date (optional)</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createTaskMutation.mutate({ ...newTask, goalId })}
                disabled={!newTask.title.trim() || createTaskMutation.isPending}
                className="gradient-bg"
              >
                {createTaskMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Modal */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-title">Title</Label>
              <Input
                id="edit-goal-title"
                value={editGoal.title}
                onChange={(e) => setEditGoal(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-description">Description</Label>
              <Textarea
                id="edit-goal-description"
                value={editGoal.description}
                onChange={(e) => setEditGoal(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editGoal.status}
                  onValueChange={(value: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ABANDONED') => 
                    setEditGoal(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="ABANDONED">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editGoal.priority}
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                    setEditGoal(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-target-date">Target Date</Label>
              <Input
                id="edit-goal-target-date"
                type="date"
                value={editGoal.targetDate}
                onChange={(e) => setEditGoal(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditGoalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateGoalMutation.mutate(editGoal)}
                disabled={!editGoal.title.trim() || updateGoalMutation.isPending}
                className="gradient-bg"
              >
                {updateGoalMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={isEditTaskOpen} onOpenChange={(open) => {
        setIsEditTaskOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-title">Task Title</Label>
              <Input
                id="edit-task-title"
                value={editTask.title}
                onChange={(e) => setEditTask(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                value={editTask.description}
                onChange={(e) => setEditTask(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editTask.priority}
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                    setEditTask(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-due-date">Due Date</Label>
                <Input
                  id="edit-task-due-date"
                  type="date"
                  value={editTask.dueDate}
                  onChange={(e) => setEditTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditTaskOpen(false);
                setEditingTask(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingTask) {
                    editTaskMutation.mutate({ taskId: editingTask.id, ...editTask });
                  }
                }}
                disabled={!editTask.title.trim() || editTaskMutation.isPending}
                className="gradient-bg"
              >
                {editTaskMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
