import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { HabitLog } from '@prisma/client';

export const getHabits = async (req: AuthRequest, res: Response) => {
  try {
    const habits = await prisma.habit.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get streaks for all habits
    const streaks = await prisma.streak.findMany({
      where: {
        userId: req.user!.id,
        type: 'habit',
      },
    });

    // Attach streaks to habits
    const habitsWithStreaks = habits.map((habit) => ({
      ...habit,
      streak: streaks.find((s) => s.referenceId === habit.id),
    }));

    res.json(habitsWithStreaks);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

export const getHabit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 90,
        },
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Get streak for this habit
    const streak = await prisma.streak.findFirst({
      where: {
        userId: req.user!.id,
        type: 'habit',
        referenceId: habit.id,
      },
    });

    res.json({ ...habit, streak });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
};

export const getHabitStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        logs: true,
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Get streak for this habit
    const streak = await prisma.streak.findFirst({
      where: {
        userId: req.user!.id,
        type: 'habit',
        referenceId: habit.id,
      },
    });

    const totalCompletions = habit.logs.filter((log: HabitLog) => log.completed).length;
    const currentStreak = streak?.currentStreak || 0;
    const longestStreak = streak?.longestStreak || 0;

    // Calculate completion rate for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogs = habit.logs.filter((log: HabitLog) => new Date(log.date) >= thirtyDaysAgo);
    const completedInPeriod = recentLogs.filter((log: HabitLog) => log.completed).length;
    const completionRate = Math.round((completedInPeriod / 30) * 100);

    res.json({
      totalCompletions,
      currentStreak,
      longestStreak,
      completionRate,
      recentLogs,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit stats' });
  }
};

export const createHabit = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, frequency, targetPerPeriod, color, icon, reminderTime } = req.body;

    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        frequency: frequency || 'DAILY',
        targetPerPeriod: targetPerPeriod || 1,
        color: color || '#10b981',
        icon: icon || 'check-circle',
        reminderTime,
        userId: req.user!.id,
      },
    });

    // Create streak tracker
    await prisma.streak.create({
      data: {
        type: 'habit',
        referenceId: habit.id,
        userId: req.user!.id,
      },
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingHabit = await prisma.habit.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existingHabit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: updates,
    });

    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
};

export const logHabit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, completed, notes } = req.body;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Parse date - handle both YYYY-MM-DD and ISO formats
    let logDate: Date;
    if (date.includes('T')) {
      // ISO format - convert to local date
      logDate = new Date(date);
    } else {
      // YYYY-MM-DD format - parse as local date
      const [year, month, day] = date.split('-').map(Number);
      logDate = new Date(year, month - 1, day);
    }
    logDate.setHours(0, 0, 0, 0);

    // Upsert the log
    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: id,
          date: logDate,
        },
      },
      update: {
        completed,
        notes,
      },
      create: {
        habitId: id,
        date: logDate,
        completed,
        notes,
      },
    });

    // Update streak if completed
    if (completed) {
      await updateHabitStreak(req.user!.id, id);
    }

    res.json(log);
  } catch (error) {
    console.error('Log habit error:', error);
    res.status(500).json({ error: 'Failed to log habit' });
  }
};

export const getAllStreaks = async (req: AuthRequest, res: Response) => {
  try {
    const streaks = await prisma.streak.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: { currentStreak: 'desc' },
    });

    res.json(streaks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streaks' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    await prisma.habit.delete({
      where: { id },
    });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
};

// Helper function to update habit streak
async function updateHabitStreak(userId: string, habitId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findFirst({
    where: {
      userId,
      type: 'habit',
      referenceId: habitId,
    },
  });

  if (streak) {
    const lastActive = new Date(streak.lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return;
    } else if (diffDays === 1) {
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: streak.currentStreak + 1,
          longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
          lastActiveAt: new Date(),
        },
      });
    } else {
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 1,
          lastActiveAt: new Date(),
        },
      });
    }
  }
}
