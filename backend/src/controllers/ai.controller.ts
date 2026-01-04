import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { agentService } from '../services/agent/agentService';
import { GoalType } from '@prisma/client';

export const getQuestionnaire = async (req: AuthRequest, res: Response) => {
  try {
    const { goalType, goalTitle } = req.body;
    const userId = req.user!.id;

    const questionnaire = await agentService.generateQuestionnaire(
      goalType as GoalType,
      goalTitle,
      userId
    );
    console.log('##########Generated questionnaire:', questionnaire);
    res.json({ questionnaire });
  } catch (error) {
    console.error('Get questionnaire error:', error);
    res.status(500).json({ error: 'Failed to generate questionnaire' });
  }
};

export const generatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId, answers } = req.body;
    const userId = req.user!.id;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user!.id },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const plan = await agentService.generatePlan(
      goal.type,
      goal.title,
      goal.description,
      answers,
      userId
    );
    console.log('##########Generated plan:', plan);
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
    const userId = req.user!.id;

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

    // Use orchestrator to determine action and get suggestions
    const orchestratorResult = await agentService.orchestrate(
      `I need additional task suggestions for my goal: ${goal.title}. Context: ${context || 'none'}`,
      userId,
      goal
    );

    // If the goal has AI context (questionnaire answers), use them to generate more tasks
    const answers = (goal.aiContext as Record<string, any>) || {};
    const plan = await agentService.generatePlan(
      goal.type,
      goal.title,
      goal.description,
      { ...answers, additionalContext: context },
      userId
    );

    // Extract suggested tasks from the plan
    const suggestions = plan.milestones
      .flatMap((m) => m.tasks)
      .slice(0, 5)
      .map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
      }));

    res.json({ suggestions, action: orchestratorResult.action });
  } catch (error) {
    console.error('Suggest tasks error:', error);
    res.status(500).json({ error: 'Failed to suggest tasks' });
  }
};

export const getMotivation = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId } = req.params;
    const userId = req.user!.id;

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

    // Use agent to analyze progress and get motivational insight
    const tasks = goal.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      completedAt: t.completedAt?.toISOString(),
    }));

    const startDate = goal.createdAt.toISOString();
    const targetDate = goal.targetDate?.toISOString() || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const message = await agentService.getMotivationalInsight(
      goal.title,
      tasks,
      startDate,
      targetDate,
      userId
    );

    res.json({ message, progress });
  } catch (error) {
    console.error('Get motivation error:', error);
    res.status(500).json({ error: 'Failed to get motivation' });
  }
};

// New agent-powered endpoints

export const classifyGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { goalTitle } = req.body;
    const userId = req.user!.id;

    const classification = await agentService.classifyGoal(goalTitle, userId);

    res.json({ classification });
  } catch (error) {
    console.error('Classify goal error:', error);
    res.status(500).json({ error: 'Failed to classify goal' });
  }
};

export const processGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { goalTitle } = req.body;
    const userId = req.user!.id;

    const result = await agentService.processNewGoal(goalTitle, userId);

    res.json({
      classification: result.classification,
      questionnaire: result.questions,
      suggestedGoalType: result.goalType,
    });
  } catch (error) {
    console.error('Process goal error:', error);
    res.status(500).json({ error: 'Failed to process goal' });
  }
};

export const analyzeProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId } = req.params;
    const userId = req.user!.id;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user!.id },
      include: {
        tasks: true,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const tasks = goal.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      completedAt: t.completedAt?.toISOString(),
    }));

    const startDate = goal.createdAt.toISOString();
    const targetDate = goal.targetDate?.toISOString() || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const analysis = await agentService.analyzeProgress(
      goal.title,
      tasks,
      startDate,
      targetDate,
      userId
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Analyze progress error:', error);
    res.status(500).json({ error: 'Failed to analyze progress' });
  }
};

export const estimateTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { goalId, hoursPerWeek } = req.body;
    const userId = req.user!.id;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user!.id },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const answers = (goal.aiContext as Record<string, any>) || {};

    const timeline = await agentService.estimateTimeline(
      goal.title,
      answers,
      hoursPerWeek || 10,
      userId
    );

    res.json({ timeline });
  } catch (error) {
    console.error('Estimate timeline error:', error);
    res.status(500).json({ error: 'Failed to estimate timeline' });
  }
};

export const orchestrate = async (req: AuthRequest, res: Response) => {
  try {
    const { message, goalId } = req.body;
    const userId = req.user!.id;

    let goal = null;
    if (goalId) {
      goal = await prisma.goal.findFirst({
        where: { id: goalId, userId: req.user!.id },
      });
    }

    const result = await agentService.orchestrate(message, userId, goal);

    res.json({
      action: result.action,
      reasoning: result.reasoning,
      additionalContext: result.additionalContext,
    });
  } catch (error) {
    console.error('Orchestrate error:', error);
    res.status(500).json({ error: 'Failed to orchestrate' });
  }
};
