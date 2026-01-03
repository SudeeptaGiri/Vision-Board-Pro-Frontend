import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { Habit, HabitLog, Task } from '@prisma/client';

type HabitWithLogs = Habit & { logs: HabitLog[] };

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId, status, date } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        goal: {
          userId: req.user!.id,
        },
        ...(goalId && { goalId: goalId as string }),
        ...(status && { status: status as any }),
        ...(date && {
          OR: [
            { dueDate: { equals: new Date(date as string) } },
            { scheduledDate: { equals: new Date(date as string) } },
          ],
        }),
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getTodaysTasks = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get regular tasks due today
    const regularTasks = await prisma.task.findMany({
      where: {
        goal: {
          userId: req.user!.id,
        },
        OR: [
          {
            dueDate: {
              gte: today,
              lt: tomorrow,
            },
          },
          {
            scheduledDate: {
              gte: today,
              lt: tomorrow,
            },
          },
          {
            status: { in: ['TODO', 'IN_PROGRESS'] },
            isRecurring: true,
          },
        ],
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        completions: {
          where: {
            completedAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      },
      orderBy: { priority: 'desc' },
    });

    // Get habits for today
    const habits = await prisma.habit.findMany({
      where: {
        userId: req.user!.id,
        isActive: true,
      },
      include: {
        logs: {
          where: {
            date: today,
          },
        },
      },
    });

    res.json({
      tasks: regularTasks,
      habits: habits.map((h: HabitWithLogs) => ({
        ...h,
        completedToday: h.logs.length > 0 && h.logs[0].completed,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, goalId, description, priority, dueDate, isRecurring, recurrenceRule } = req.body;

    // Verify goal ownership
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user!.id },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Get max order
    const maxOrder = await prisma.task.aggregate({
      where: { goalId },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        isRecurring: isRecurring || false,
        recurrenceRule,
        order: (maxOrder._max.order || 0) + 1,
        goalId,
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        goal: { userId: req.user!.id },
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.dueDate && { dueDate: new Date(updates.dueDate) }),
        ...(updates.status === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    // Update goal progress
    await updateGoalProgress(existingTask.goalId);

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const reorderTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, order } = req.body;

    // Verify ownership
    const task = await prisma.task.findFirst({
      where: {
        id,
        goal: { userId: req.user!.id },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        order,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    // Update goal progress
    await updateGoalProgress(task.goalId);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder task' });
  }
};

export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id,
        goal: { userId: req.user!.id },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.isRecurring) {
      // For recurring tasks, create a completion record
      await prisma.taskCompletion.create({
        data: {
          taskId: id,
          notes,
        },
      });
    } else {
      // For regular tasks, mark as completed
      await prisma.task.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Update goal progress
    await updateGoalProgress(task.goalId);

    // Update streak
    await updateStreak(req.user!.id, 'daily-tasks');

    res.json({ message: 'Task completed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        goal: { userId: req.user!.id },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id },
    });

    // Update goal progress
    await updateGoalProgress(task.goalId);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const bulkUpdateTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { taskIds, updates } = req.body;

    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        goal: { userId: req.user!.id },
      },
      data: updates,
    });

    res.json({ message: 'Tasks updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tasks' });
  }
};

// Helper function to update goal progress
async function updateGoalProgress(goalId: string) {
  const tasks = await prisma.task.findMany({
    where: { goalId },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: Task) => t.status === 'COMPLETED').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      progress,
      ...(progress === 100 && { status: 'COMPLETED', completedAt: new Date() }),
    },
  });
}

// Helper function to update streak
async function updateStreak(userId: string, type: string, referenceId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({
    where: {
      userId_type_referenceId: {
        userId,
        type,
        referenceId: referenceId || '',
      },
    },
  });

  if (streak) {
    const lastActive = new Date(streak.lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already logged today
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: streak.currentStreak + 1,
          longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
          lastActiveAt: new Date(),
        },
      });
    } else {
      // Streak broken
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 1,
          lastActiveAt: new Date(),
        },
      });
    }
  } else {
    // Create new streak
    await prisma.streak.create({
      data: {
        userId,
        type,
        referenceId: referenceId || '',
        currentStreak: 1,
        longestStreak: 1,
      },
    });
  }
}