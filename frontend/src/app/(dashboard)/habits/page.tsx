'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Flame,
  Check,
  Calendar,
  TrendingUp,
  Target,
  Loader2,
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { HabitCard } from '@/components/habits/habit-card';
import { HabitCalendar } from '@/components/habits/habit-calendar';

interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  color: string;
  reminderTime?: string;
  currentStreak?: number;
  completedToday?: boolean;
  logs?: { date: string; completed: boolean }[];
}

export default function HabitsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    frequency: 'DAILY',
    color: '#8b5cf6',
  });

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editHabit, setEditHabit] = useState({
    title: '',
    description: '',
    frequency: 'DAILY',
    color: '#8b5cf6',
    reminderTime: '',
  });

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const queryClient = useQueryClient();

  // Fetch habits
  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await api.get('/habits');
      return response.data;
    },
  });

  // Fetch streaks
  const { data: streaks } = useQuery({
    queryKey: ['streaks'],
    queryFn: async () => {
      const response = await api.get('/habits/streaks/all');
      return response.data;
    },
  });

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/habits', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setIsCreating(false);
      setNewHabit({
        title: '',
        frequency: 'DAILY',
        color: '#8b5cf6',
      });
    },
  });

  // Log habit mutation
  const logHabitMutation = useMutation({
    mutationFn: async ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) => {
      const response = await api.post(`/habits/${habitId}/log`, { date, completed });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
    },
  });

  // Update habit mutation
  const updateHabitMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; frequency: string; color: string; reminderTime: string }) => {
      const response = await api.put(`/habits/${data.id}`, {
        title: data.title,
        description: data.description || null,
        frequency: data.frequency,
        color: data.color,
        reminderTime: data.reminderTime || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setIsEditing(false);
      setEditingHabit(null);
    },
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await api.delete(`/habits/${habitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
    },
  });

  const handleCreateHabit = () => {
    createHabitMutation.mutate(newHabit);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditHabit({
      title: habit.title,
      description: habit.description || '',
      frequency: habit.frequency,
      color: habit.color,
      reminderTime: habit.reminderTime || '',
    });
    setIsEditing(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteHabit = () => {
    if (habitToDelete) {
      deleteHabitMutation.mutate(habitToDelete.id);
      setIsDeleteModalOpen(false);
      setHabitToDelete(null);
    }
  };

  const handleToggleHabit = (habitId: string, completed: boolean) => {
    // Use local date string to avoid timezone issues
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    logHabitMutation.mutate({
      habitId,
      date: localDate,
      completed: !completed,
    });
  };

  // Calculate stats
  const totalHabits = habits?.length || 0;
  const completedToday = habits?.filter((h: any) => h.completedToday).length || 0;
  const longestStreak = streaks?.reduce((max: number, s: any) => Math.max(max, s.longestStreak), 0) || 0;
  const currentStreak = streaks?.reduce((max: number, s: any) => Math.max(max, s.currentStreak), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-text dark:text-warm-bg">Habits</h1>
          <p className="text-sm sm:text-base text-warm-muted dark:text-warm-border mt-1">Build consistent habits and track your streaks</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="gradient-bg hover:opacity-90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Habit Name</Label>
                <Input
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                  placeholder="e.g., Meditate for 10 minutes"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newHabit.frequency}
                    onValueChange={(value) => setNewHabit({ ...newHabit, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewHabit({ ...newHabit, color })}
                        className={cn(
                          'w-8 h-8 rounded-full transition-transform',
                          newHabit.color === color && 'ring-2 ring-offset-2 ring-warm-muted scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCreateHabit}
                disabled={!newHabit.title || createHabitMutation.isPending}
                className="w-full gradient-bg hover:opacity-90"
              >
                {createHabitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create Habit'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-terracotta-light dark:bg-terracotta/20">
              <Target className="w-6 h-6 text-terracotta dark:text-terracotta-light" />
            </div>
            <div>
              <p className="text-sm text-warm-muted dark:text-warm-border">Total Habits</p>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">{totalHabits}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sage-light dark:bg-sage/20">
              <Check className="w-6 h-6 text-sage" />
            </div>
            <div>
              <p className="text-sm text-warm-muted dark:text-warm-border">Done Today</p>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">{completedToday}/{totalHabits}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-status-warning/20 dark:bg-status-warning/30">
              <Flame className="w-6 h-6 text-status-warning" />
            </div>
            <div>
              <p className="text-sm text-warm-muted dark:text-warm-border">Current Streak</p>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">{currentStreak} days</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warm-highlight dark:bg-warm-muted/20">
              <TrendingUp className="w-6 h-6 text-terracotta dark:text-terracotta-light" />
            </div>
            <div>
              <p className="text-sm text-warm-muted dark:text-warm-border">Best Streak</p>
              <p className="text-2xl font-bold text-warm-text dark:text-warm-bg">{longestStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-warm-text dark:text-warm-bg">Today's Progress</h2>
          <span className="text-sm text-warm-muted dark:text-warm-border">
            {format(new Date(), 'EEEE, MMMM d')}
          </span>
        </div>
        <Progress
          value={(completedToday / totalHabits) * 100 || 0}
          className="h-3 mb-2"
        />
        <p className="text-sm text-warm-muted dark:text-warm-border">
          {completedToday} of {totalHabits} habits completed
        </p>
      </div>

      {/* Habits Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits?.map((habit: any) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={() => handleToggleHabit(habit.id, habit.completedToday)}
            onEdit={() => handleEditHabit(habit)}
            onDelete={() => handleDeleteHabit(habit)}
          />
        ))}
      </div>

      {/* Empty State */}
      {habits?.length === 0 && (
        <div className="text-center py-12">
          <Flame className="w-16 h-16 mx-auto text-warm-border dark:text-warm-muted mb-4" />
          <h3 className="text-xl font-semibold text-warm-text dark:text-warm-bg mb-2">No habits yet</h3>
          <p className="text-warm-muted dark:text-warm-border mb-6">
            Start building consistent habits to achieve your goals
          </p>
          <Button onClick={() => setIsCreating(true)} className="gradient-bg hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Habit
          </Button>
        </div>
      )}

      {/* Edit Habit Modal */}
      <Dialog open={isEditing} onOpenChange={(open) => {
        setIsEditing(open);
        if (!open) setEditingHabit(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Habit Name</Label>
              <Input
                value={editHabit.title}
                onChange={(e) => setEditHabit({ ...editHabit, title: e.target.value })}
                placeholder="e.g., Meditate for 10 minutes"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={editHabit.description}
                onChange={(e) => setEditHabit({ ...editHabit, description: e.target.value })}
                placeholder="Add details about this habit"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={editHabit.frequency}
                  onValueChange={(value) => setEditHabit({ ...editHabit, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditHabit({ ...editHabit, color })}
                      className={cn(
                        'w-8 h-8 rounded-full transition-transform',
                        editHabit.color === color && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reminder Time (optional)</Label>
              <Input
                type="time"
                value={editHabit.reminderTime}
                onChange={(e) => setEditHabit({ ...editHabit, reminderTime: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditingHabit(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingHabit) {
                    updateHabitMutation.mutate({ id: editingHabit.id, ...editHabit });
                  }
                }}
                disabled={!editHabit.title || updateHabitMutation.isPending}
                className="gradient-bg hover:opacity-90"
              >
                {updateHabitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Habit</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">&quot;{habitToDelete?.title}&quot;</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This will permanently delete this habit along with all your progress and streaks. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setHabitToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteHabit}
              disabled={deleteHabitMutation.isPending}
            >
              {deleteHabitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete Habit'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}