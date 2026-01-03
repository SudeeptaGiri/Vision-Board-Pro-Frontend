import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/ai/aiService';
import { Goal, Task, Milestone } from '@prisma/client';

type GoalWithRelations = Goal & {
  tasks: { id: string }[];
  category: { id: string; name: string; color: string } | null;
  _count: { tasks: number; subGoals: number };
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, categoryId } = req.query;

    const goals = await prisma.goal.findMany({
      where: {
        userId: req.user!.id,
        ...(status && { status: status as any }),
        ...(type && { type: type as any }),
        ...(categoryId && { categoryId: categoryId as string }),
        parentGoalId: null, // Only top-level goals
      },
      include: {
        category: true,
        _count: {
          select: {
            tasks: true,
            subGoals: true,
          },
        },
        tasks: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map((goal: GoalWithRelations) => ({
      ...goal,
      completedTasks: goal.tasks.length,
      tasks: undefined,
    }));

    res.json(goalsWithProgress);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const getGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        category: true,
        tasks: {
          orderBy: { order: 'asc' },
        },
        milestones: {
          orderBy: { order: 'asc' },
        },
        subGoals: {
          include: {
            tasks: true,
          },
        },
        visionItems: true,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
};

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, targetDate, categoryId, priority } = req.body;

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        type,
        targetDate: targetDate ? new Date(targetDate) : null,
        categoryId,
        priority: priority || 'MEDIUM',
        userId: req.user!.id,
      },
      include: {
        category: true,
      },
    });

    // Generate questionnaire for this goal type
    const questionnaire = await aiService.generateQuestionnaire(type, title);

    res.status(201).json({
      goal,
      questionnaire,
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.targetDate && { targetDate: new Date(updates.targetDate) }),
        ...(updates.status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: {
        category: true,
        tasks: true,
        milestones: true,
      },
    });

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({
      where: { id },
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

export const generatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    // Get goal
    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Generate plan using AI
    const plan = await aiService.generatePlan(
      goal.type,
      goal.title,
      goal.description,
      answers
    );

    // Save AI context
    await prisma.goal.update({
      where: { id },
      data: {
        aiContext: answers,
        aiSuggestions: JSON.parse(JSON.stringify(plan)),
        status: 'IN_PROGRESS',
      },
    });

    // Create milestones and tasks
    for (let i = 0; i < plan.milestones.length; i++) {
      const milestone = plan.milestones[i];
      
      const createdMilestone = await prisma.milestone.create({
        data: {
          title: milestone.title,
          description: milestone.description,
          targetDate: milestone.targetDate ? new Date(milestone.targetDate) : null,
          order: i,
          goalId: id,
        },
      });

      // Create tasks for this milestone
      for (let j = 0; j < milestone.tasks.length; j++) {
        const task = milestone.tasks[j];
        await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedTime: task.estimatedTime,
            isRecurring: task.isRecurring,
            recurrenceRule: task.recurrenceRule,
            isAiGenerated: true,
            aiNotes: task.tips,
            order: j,
            goalId: id,
          },
        });
      }
    }

    // Create habits if any
    if (plan.habits && plan.habits.length > 0) {
      for (const habit of plan.habits) {
        await prisma.habit.create({
          data: {
            title: habit.title,
            description: habit.description,
            frequency: habit.frequency,
            targetPerPeriod: habit.targetPerPeriod,
            reminderTime: habit.reminderTime,
            userId: req.user!.id,
          },
        });
      }
    }

    // Fetch updated goal with all relations
    const updatedGoal = await prisma.goal.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { order: 'asc' } },
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    res.json({
      goal: updatedGoal,
      tips: plan.tips,
      warnings: plan.warnings,
      resources: plan.resources,
    });
  } catch (error) {
    console.error('Generate plan error:', error);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
};

export const getGoalProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        tasks: true,
        milestones: true,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const totalTasks = goal.tasks.length;
    const completedTasks = goal.tasks.filter((t: Task) => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const completedMilestones = goal.milestones.filter((m: Milestone) => m.isCompleted).length;

    res.json({
      progress,
      totalTasks,
      completedTasks,
      totalMilestones: goal.milestones.length,
      completedMilestones,
      tasksByStatus: {
        TODO: goal.tasks.filter((t: Task) => t.status === 'TODO').length,
        IN_PROGRESS: goal.tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length,
        IN_REVIEW: goal.tasks.filter((t: Task) => t.status === 'IN_REVIEW').length,
        COMPLETED: completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};