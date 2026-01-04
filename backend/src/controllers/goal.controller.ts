import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { agentService } from '../services/agent/agentService';
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
    let { title, description, type, targetDate, categoryId, priority } = req.body;
    console.log('##########Creating goal with data:', req.body);
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

    // Generate questionnaire for this goal type using agents
    let questionnaire = [];
    try {
      questionnaire = await agentService.generateQuestionnaire(type, title, req.user!.id);
    } catch (agentError) {
      console.error('Agent questionnaire generation error:', agentError);
      // Fallback to default questions if agent fails
      questionnaire = getDefaultQuestions(type);
    }

    res.status(201).json({
      goal,
      questionnaire,
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

// Default questions fallback when agent fails
function getDefaultQuestions(goalType: string) {
  const defaultQuestions: Record<string, any[]> = {
    ACHIEVEMENT: [
      { id: 'q1', question: 'What specific outcome do you want to achieve?', type: 'text', required: true },
      { id: 'q2', question: 'When do you want to achieve this by?', type: 'date', required: true },
      { id: 'q3', question: 'What resources do you have available?', type: 'text', required: false },
    ],
    LEARNING: [
      { id: 'q1', question: 'What is your current skill level?', type: 'select', options: ['Complete beginner', 'Some basics', 'Intermediate', 'Advanced'], required: true },
      { id: 'q2', question: 'How much time can you dedicate daily?', type: 'select', options: ['15 minutes', '30 minutes', '1 hour', '2+ hours'], required: true },
      { id: 'q3', question: 'Do you have the necessary equipment/resources?', type: 'select', options: ['Yes', 'No', 'Partially'], required: true },
    ],
    HEALTH: [
      { id: 'q1', question: 'What is your current activity level?', type: 'select', options: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'], required: true },
      { id: 'q2', question: 'Do you have any health conditions or limitations?', type: 'text', required: false },
      { id: 'q3', question: 'How much time can you exercise per day?', type: 'select', options: ['15 minutes', '30 minutes', '45 minutes', '1 hour+'], required: true },
    ],
    HABIT: [
      { id: 'q1', question: 'Why is this habit important to you?', type: 'text', required: true },
      { id: 'q2', question: 'What time of day works best?', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Flexible'], required: true },
      { id: 'q3', question: 'Have you tried building this habit before?', type: 'select', options: ['Yes, successfully', 'Yes, but failed', 'No, first time'], required: true },
    ],
    FINANCIAL: [
      { id: 'q1', question: 'What is your target amount?', type: 'number', required: true },
      { id: 'q2', question: 'What is your timeline?', type: 'date', required: true },
      { id: 'q3', question: 'What is your current monthly savings capacity?', type: 'number', required: false },
    ],
    CAREER: [
      { id: 'q1', question: 'What is your target role/position?', type: 'text', required: true },
      { id: 'q2', question: 'What is your current experience level?', type: 'select', options: ['Entry level', 'Mid level', 'Senior', 'Executive'], required: true },
      { id: 'q3', question: 'What skills do you need to develop?', type: 'text', required: true },
    ],
    PERSONAL: [
      { id: 'q1', question: 'What area of life does this improve?', type: 'select', options: ['Relationships', 'Mental health', 'Confidence', 'Work-life balance', 'Other'], required: true },
      { id: 'q2', question: 'What does success look like for you?', type: 'text', required: true },
      { id: 'q3', question: 'What has held you back before?', type: 'text', required: false },
    ],
  };
  return defaultQuestions[goalType] || defaultQuestions.ACHIEVEMENT;
}

// Default plan fallback when agent fails
function getDefaultPlan(goalType: string, goalTitle: string, answers: Record<string, any>) {
  const isHabit = goalType === 'HABIT';
  
  return {
    milestones: [
      {
        title: 'Getting Started',
        description: 'Begin your journey towards ' + goalTitle,
        targetDate: null,
        tasks: [
          {
            title: 'Research and prepare',
            description: 'Gather resources and create an initial plan',
            estimatedTime: 60,
            priority: 'HIGH' as const,
            isRecurring: false,
            recurrenceRule: null,
            tips: 'Start by understanding what you need to succeed',
          },
          {
            title: 'Set up your environment',
            description: 'Prepare everything you need to start',
            estimatedTime: 30,
            priority: 'MEDIUM' as const,
            isRecurring: false,
            recurrenceRule: null,
            tips: 'Remove distractions and set yourself up for success',
          },
        ],
      },
      {
        title: 'Building Momentum',
        description: 'Establish consistent progress',
        targetDate: null,
        tasks: [
          {
            title: isHabit ? 'Daily practice session' : 'Work on core tasks',
            description: isHabit ? 'Complete your daily habit practice' : 'Focus on the main activities',
            estimatedTime: 30,
            priority: 'HIGH' as const,
            isRecurring: isHabit,
            recurrenceRule: isHabit ? 'FREQ=DAILY' : null,
            tips: 'Consistency is more important than intensity',
          },
          {
            title: 'Weekly review',
            description: 'Review your progress and adjust as needed',
            estimatedTime: 15,
            priority: 'MEDIUM' as const,
            isRecurring: true,
            recurrenceRule: 'FREQ=WEEKLY',
            tips: 'Celebrate wins and learn from challenges',
          },
        ],
      },
      {
        title: 'Achieving Your Goal',
        description: 'Final push to complete ' + goalTitle,
        targetDate: null,
        tasks: [
          {
            title: 'Advanced practice',
            description: 'Take your skills/progress to the next level',
            estimatedTime: 45,
            priority: 'MEDIUM' as const,
            isRecurring: isHabit,
            recurrenceRule: isHabit ? 'FREQ=DAILY' : null,
            tips: 'Push yourself but stay sustainable',
          },
        ],
      },
    ],
    habits: isHabit ? [
      {
        title: goalTitle,
        description: 'Daily habit practice',
        frequency: 'DAILY' as const,
        targetPerPeriod: 1,
        reminderTime: answers['What time of day works best?'] === 'Morning' ? '08:00' : 
                      answers['What time of day works best?'] === 'Evening' ? '19:00' : '14:00',
      },
    ] : undefined,
    tips: [
      'Start small and build up gradually',
      'Track your progress daily',
      'Celebrate small wins',
      'Be patient with yourself',
    ],
    warnings: [
      'Don\'t try to do too much at once',
      'Missing a day is okay - just get back on track',
    ],
    resources: [
      'Set up reminders on your phone',
      'Find an accountability partner',
    ],
  };
}

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

    // Generate plan using AI agents with fallback
    let plan;
    try {
      plan = await agentService.generatePlan(
        goal.type,
        goal.title,
        goal.description,
        answers,
        req.user!.id
      );
    } catch (agentError) {
      console.error('Agent plan generation failed:', agentError);
      // Use fallback plan
      plan = getDefaultPlan(goal.type, goal.title, answers);
    }

    // Validate plan has milestones
    if (!plan || !plan.milestones || plan.milestones.length === 0) {
      console.error('Plan has no milestones, using fallback');
      plan = getDefaultPlan(goal.type, goal.title, answers);
    }

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
        
        // Map priority to valid Prisma enum (handle any AI edge cases)
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        let priority = task.priority?.toUpperCase() || 'MEDIUM';
        if (priority === 'CRITICAL') priority = 'URGENT';
        if (!validPriorities.includes(priority)) priority = 'MEDIUM';
        
        await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
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