import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/ai/aiService';
import { GoalType } from '@prisma/client';

export const getQuestionnaire = async (req: AuthRequest, res: Response) => {
  try {
    const { goalType, goalTitle } = req.body;

    const questionnaire = await aiService.generateQuestionnaire(
      goalType as GoalType,
      goalTitle
    );

    res.json({ questionnaire });
  } catch (error) {
    console.error('Get questionnaire error:', error);
    res.status(500).json({ error: 'Failed to generate questionnaire' });
  }
};

export const generatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId, answers } = req.body;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user!.id },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const plan = await aiService.generatePlan(
      goal.type,
      goal.title,
      goal.description,
      answers
    );

    // Save AI context
    await prisma.goal.update({
      where: { id: goalId },
      data: {
        aiContext: answers,
        aiSuggestions: JSON.parse(JSON.stringify(plan)),
        status: 'IN_PROGRESS',
      },
    });

    // Create milestones and tasks
    for (let i = 0; i < plan.milestones.length; i++) {
      const milestone = plan.milestones[i];
      
      await prisma.milestone.create({
        data: {
          title: milestone.title,
          description: milestone.description,
          targetDate: milestone.targetDate ? new Date(milestone.targetDate) : null,
          order: i,
          goalId,
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
            goalId,
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
            frequency: habit.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY',
            targetPerPeriod: habit.targetPerPeriod,
            reminderTime: habit.reminderTime,
            userId: req.user!.id,
          },
        });
      }
    }

    // Fetch updated goal
    const updatedGoal = await prisma.goal.findUnique({
      where: { id: goalId },
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

export const suggestTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId, context } = req.body;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user!.id },
      include: {
        tasks: true,
        milestones: true,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const existingTasks = goal.tasks.map((t) => t.title).join(', ');
    const suggestions = await aiService.suggestAdditionalTasks(
      goal.type,
      goal.title,
      goal.description || '',
      existingTasks,
      context
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggest tasks error:', error);
    res.status(500).json({ error: 'Failed to suggest tasks' });
  }
};

export const getMotivation = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId } = req.params;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user!.id },
      include: {
        tasks: true,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const completedTasks = goal.tasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = goal.tasks.length > 0 
      ? Math.round((completedTasks / goal.tasks.length) * 100) 
      : 0;

    const message = await aiService.getMotivationalMessage(
      goal.title,
      progress,
      goal.type
    );

    res.json({ message, progress });
  } catch (error) {
    console.error('Get motivation error:', error);
    res.status(500).json({ error: 'Failed to get motivation' });
  }
};
