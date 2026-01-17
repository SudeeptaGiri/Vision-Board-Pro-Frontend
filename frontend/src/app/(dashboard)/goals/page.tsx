'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import {
  Plus,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateGoalModal } from '@/components/goals/create-goal-modal';

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'SHORT_TERM' | 'LONG_TERM' | 'MILESTONE';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  progress: number;
  targetDate: string | null;
  createdAt: string;
  completedTasks?: number;
  _count?: {
    tasks: number;
    subGoals: number;
  };
}

export default function GoalsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    status: 'IN_PROGRESS' as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD',
    targetDate: '',
  });
  const queryClient = useQueryClient();
  const router = useRouter();

  // Update editGoal when selectedGoal changes
  useEffect(() => {
    if (selectedGoal) {
      setEditGoal({
        title: selectedGoal.title,
        description: selectedGoal.description || '',
        priority: selectedGoal.priority,
        status: selectedGoal.status,
        targetDate: selectedGoal.targetDate ? selectedGoal.targetDate.split('T')[0] : '',
      });
      setIsEditModalOpen(true);
    }
  }, [selectedGoal]);

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/goals');
      return response.data;
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      await api.delete(`/goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; priority: string; status: string; targetDate: string }) => {
      const response = await api.put(`/goals/${data.id}`, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        targetDate: data.targetDate || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsEditModalOpen(false);
      setSelectedGoal(null);
    },
  });

  const filteredGoals = goals.filter((goal) => {
    if (filter === 'active') return goal.status !== 'COMPLETED';
    if (filter === 'completed') return goal.status === 'COMPLETED';
    return true;
  });

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-sage-light text-sage dark:bg-sage/20 dark:text-sage-light';
      case 'IN_PROGRESS':
        return 'bg-terracotta-light text-terracotta dark:bg-terracotta/20 dark:text-terracotta-light';
      case 'ON_HOLD':
        return 'bg-status-warning/20 text-status-warning dark:bg-status-warning/30 dark:text-status-warning';
      default:
        return 'bg-warm-border text-warm-muted dark:bg-warm-muted/30 dark:text-warm-border';
    }
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-status-alert/20 text-status-alert dark:bg-status-alert/30 dark:text-status-alert';
      case 'MEDIUM':
        return 'bg-terracotta-light text-terracotta dark:bg-terracotta/20 dark:text-terracotta-light';
      default:
        return 'bg-warm-border text-warm-muted dark:bg-warm-muted/30 dark:text-warm-border';
    }
  };

  const getTypeIcon = (type: Goal['type']) => {
    switch (type) {
      case 'LONG_TERM':
        return <Target className="w-4 h-4" />;
      case 'MILESTONE':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleCreateWithAI = () => {
    // Opens the create goal modal which has AI planning built-in
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-text dark:text-warm-bg">Goals</h1>
          <p className="text-sm sm:text-base text-warm-muted dark:text-warm-border mt-1">
            Track and manage your goals with AI-powered planning
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleCreateWithAI}
            className="gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden xs:inline">Create with</span> AI
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 gradient-bg flex-1 sm:flex-none"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-xl p-4 border border-warm-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-terracotta-light dark:bg-terracotta/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-terracotta dark:text-terracotta-light" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">{goals.length}</p>
              <p className="text-sm text-warm-muted dark:text-warm-border">Total Goals</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-warm-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-warning/20 dark:bg-status-warning/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">
                {goals.filter((g) => g.status === 'IN_PROGRESS').length}
              </p>
              <p className="text-sm text-warm-muted dark:text-warm-border">In Progress</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-warm-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sage-light dark:bg-sage/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-sage dark:text-sage-light" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">
                {goals.filter((g) => g.status === 'COMPLETED').length}
              </p>
              <p className="text-sm text-warm-muted dark:text-warm-border">Completed</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-warm-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-terracotta-light dark:bg-terracotta/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-terracotta dark:text-terracotta-light" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">
                {Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / (goals.length || 1))}%
              </p>
              <p className="text-sm text-warm-muted dark:text-warm-border">Avg Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-warm-border/50 dark:bg-warm-muted/30 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 mx-auto text-warm-border dark:text-warm-muted mb-4" />
          <h3 className="text-xl font-semibold text-warm-text dark:text-warm-bg mb-2">
            No goals yet
          </h3>
          <p className="text-warm-muted dark:text-warm-border mb-6">
            Create your first goal and let AI help you plan the steps
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gradient-bg">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              className="glass-card rounded-xl border border-warm-border p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white">
                    {getTypeIcon(goal.type)}
                  </div>
                  <Badge className={getStatusColor(goal.status)}>
                    {goal.status.replace('_', ' ')}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedGoal(goal)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold text-warm-text dark:text-warm-bg mb-2 line-clamp-2">
                {goal.title}
              </h3>
              <p className="text-sm text-warm-muted dark:text-warm-border mb-4 line-clamp-2">
                {goal.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-warm-muted dark:text-warm-border">Progress</span>
                  <span className="font-medium text-warm-text dark:text-warm-bg">
                    {goal.progress}%
                  </span>
                </div>
                <Progress value={goal.progress} className="h-2" />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm text-warm-muted dark:text-warm-border">
                    <Calendar className="w-4 h-4" />
                    {goal.targetDate 
                      ? new Date(goal.targetDate).toLocaleDateString()
                      : 'No target date'}
                  </div>
                  <Badge className={getPriorityColor(goal.priority)}>
                    {goal.priority}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-warm-border dark:border-warm-muted">
                  <span className="text-sm text-warm-muted dark:text-warm-border">
                    {goal.completedTasks || 0}/{goal._count?.tasks || 0} tasks
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => router.push(`/goals/${goal.id}`)}
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateGoalModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Goal Modal */}
      <Dialog 
        open={isEditModalOpen} 
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedGoal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editGoal.title}
                onChange={(e) => setEditGoal(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
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
                  onValueChange={(value: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD') => 
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
              <Label htmlFor="edit-target-date">Target Date</Label>
              <Input
                id="edit-target-date"
                type="date"
                value={editGoal.targetDate}
                onChange={(e) => setEditGoal(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedGoal(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedGoal) {
                    updateGoalMutation.mutate({ id: selectedGoal.id, ...editGoal });
                  }
                }}
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
    </div>
  );
}
