import { GoalType } from '@prisma/client';
import {
  visionBoardAgents,
  AgentContext,
  GoalCategory,
  GoalClassification,
  QuestionsOutput,
  TaskBreakdownOutput,
  TimelineOutput,
  HabitTrackingOutput,
  ProgressAnalysisOutput,
  OrchestratorOutput,
} from './index';

// Map Prisma GoalType to Agent GoalCategory
export function mapGoalTypeToCategory(goalType: GoalType): GoalCategory {
  const mapping: Record<GoalType, GoalCategory> = {
    ACHIEVEMENT: 'PERSONAL_DEVELOPMENT',
    LEARNING: 'LEARNING',
    HEALTH: 'HEALTH_FITNESS',
    HABIT: 'HABIT_BUILDING',
    FINANCIAL: 'FINANCIAL',
    CAREER: 'CAREER',
    PERSONAL: 'PERSONAL_DEVELOPMENT',
  };
  return mapping[goalType] || 'OTHER';
}

// Map Agent GoalCategory to Prisma GoalType
export function mapCategoryToGoalType(category: GoalCategory): GoalType {
  const mapping: Record<GoalCategory, GoalType> = {
    TRAVEL: 'ACHIEVEMENT',
    LEARNING: 'LEARNING',
    HEALTH_FITNESS: 'HEALTH',
    CAREER: 'CAREER',
    FINANCIAL: 'FINANCIAL',
    RELATIONSHIP: 'PERSONAL',
    HOBBY: 'ACHIEVEMENT',
    PERSONAL_DEVELOPMENT: 'PERSONAL',
    HOME_LIFESTYLE: 'ACHIEVEMENT',
    HABIT_BUILDING: 'HABIT',
    OTHER: 'ACHIEVEMENT',
  };
  return mapping[category];
}

// Question type mapping
export function mapQuestionType(
  agentType: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'RANGE' | 'BOOLEAN'
): 'text' | 'select' | 'number' | 'date' | 'multiselect' {
  const mapping: Record<string, 'text' | 'select' | 'number' | 'date' | 'multiselect'> = {
    TEXT: 'text',
    NUMBER: 'number',
    DATE: 'date',
    SINGLE_SELECT: 'select',
    MULTI_SELECT: 'multiselect',
    RANGE: 'number',
    BOOLEAN: 'select',
  };
  return mapping[agentType] || 'text';
}

export interface Question {
  id: string;
  question: string;
  type: 'text' | 'select' | 'number' | 'date' | 'multiselect';
  options?: string[];
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface GeneratedPlan {
  milestones: {
    title: string;
    description: string;
    targetDate: string | null;
    tasks: {
      title: string;
      description: string;
      estimatedTime: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      isRecurring: boolean;
      recurrenceRule: string | null;
      tips: string;
    }[];
  }[];
  habits?: {
    title: string;
    description: string;
    frequency: 'DAILY' | 'WEEKLY';
    targetPerPeriod: number;
    reminderTime: string;
  }[];
  tips: string[];
  warnings: string[];
  resources: string[];
}

class AgentService {
  /**
   * Process a new goal - classify and generate questions
   */
  async processNewGoal(
    goalTitle: string,
    userId: string
  ): Promise<{
    classification: GoalClassification;
    questions: Question[];
    goalType: GoalType;
  }> {
    try {
      const context: AgentContext = { userId };

      const { classification, questions: agentQuestions } = await visionBoardAgents.processNewGoal(
        goalTitle,
        context
      );

      // Map agent questions to the expected format
      const questions: Question[] = agentQuestions.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: mapQuestionType(q.type),
        options: q.options,
        required: q.required,
        placeholder: q.placeholder,
        helpText: q.helpText,
      }));

      return {
        classification,
        questions,
        goalType: mapCategoryToGoalType(classification.category),
      };
    } catch (error) {
      console.error('Error processing new goal:', error);
      // Return default classification and questions
      const defaultClassification: GoalClassification = {
        category: 'PERSONAL_DEVELOPMENT',
        subcategory: 'General',
        confidence: 0.5,
        isHabitBased: false,
        requiresRecurringTasks: false,
        estimatedComplexity: 'MODERATE',
        reasoning: 'Default classification - agents were unable to classify this goal',
      };
      return {
        classification: defaultClassification,
        questions: this.getDefaultQuestions(goalTitle),
        goalType: GoalType.PERSONAL,
      };
    }
  }

  /**
   * Generate questionnaire using agents
   */
  async generateQuestionnaire(goalType: GoalType, goalTitle: string, userId: string): Promise<Question[]> {
    try {
      const context: AgentContext = { userId };
      const category = mapGoalTypeToCategory(goalType);

      const agentQuestions = await visionBoardAgents.generateQuestions(goalTitle, category, context);

      return agentQuestions.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: mapQuestionType(q.type),
        options: q.options,
        required: q.required,
        placeholder: q.placeholder,
        helpText: q.helpText,
      }));
    } catch (error) {
      console.error('Error generating questionnaire:', error);
      return this.getDefaultQuestions(goalTitle);
    }
  }

  /**
   * Get default questions when agent fails
   */
  private getDefaultQuestions(goalTitle: string): Question[] {
    return [
      {
        id: 'target_date',
        question: 'When would you like to achieve this goal?',
        type: 'date',
        required: true,
        helpText: 'Select a realistic target date',
      },
      {
        id: 'motivation',
        question: 'What motivates you to pursue this goal?',
        type: 'text',
        required: true,
        placeholder: 'Describe your motivation...',
      },
      {
        id: 'time_commitment',
        question: 'How many hours per week can you dedicate to this goal?',
        type: 'select',
        options: ['1-2 hours', '3-5 hours', '6-10 hours', '10+ hours'],
        required: true,
      },
      {
        id: 'experience_level',
        question: 'What is your current experience level with this type of goal?',
        type: 'select',
        options: ['Beginner', 'Intermediate', 'Advanced'],
        required: true,
      },
      {
        id: 'obstacles',
        question: 'What obstacles do you anticipate?',
        type: 'text',
        required: false,
        placeholder: 'Any challenges you foresee...',
      },
    ];
  }

  /**
   * Classify a goal
   */
  async classifyGoal(goalTitle: string, userId: string): Promise<GoalClassification> {
    try {
      const context: AgentContext = { userId };
      return await visionBoardAgents.classifyGoal(goalTitle, context);
    } catch (error) {
      console.error('Error classifying goal:', error);
      return {
        category: 'PERSONAL_DEVELOPMENT',
        subcategory: 'General',
        confidence: 0.5,
        isHabitBased: false,
        requiresRecurringTasks: false,
        estimatedComplexity: 'MODERATE',
        reasoning: 'Default classification - agent error occurred',
      };
    }
  }

  /**
   * Generate full plan using agents
   */
  async generatePlan(
    goalType: GoalType,
    goalTitle: string,
    goalDescription: string | null,
    answers: Record<string, any>,
    userId: string
  ): Promise<GeneratedPlan> {
    try {
      const context: AgentContext = {
        userId,
        questionAnswers: answers,
      };

      // First classify the goal
      const classification = await visionBoardAgents.classifyGoal(goalTitle, context);

      // Generate tasks based on classification
      const taskBreakdown = await visionBoardAgents.generateTasks(goalTitle, classification, answers, context);

      // If habit-based, also get habit tracking plan
      let habitPlan: HabitTrackingOutput | null = null;
      if (classification.isHabitBased) {
        habitPlan = await visionBoardAgents.setupHabitTracking(goalTitle, classification, answers, context);
      }

      // Convert to the expected format
      return this.convertToGeneratedPlan(taskBreakdown, habitPlan);
    } catch (error) {
      console.error('Error in generatePlan:', error);
      // Return a sensible default plan
      return this.getDefaultGeneratedPlan(goalTitle);
    }
  }

  /**
   * Get a default generated plan when agents fail
   */
  private getDefaultGeneratedPlan(goalTitle: string): GeneratedPlan {
    return {
      milestones: [
        {
          title: 'Getting Started',
          description: `Initial phase for "${goalTitle}"`,
          targetDate: null,
          tasks: [
            {
              title: `Research and plan: ${goalTitle}`,
              description: 'Gather information and create an initial plan',
              estimatedTime: 60,
              priority: 'HIGH',
              isRecurring: false,
              recurrenceRule: null,
              tips: 'Start by understanding what you want to achieve',
            },
            {
              title: 'Define success criteria',
              description: 'Determine how you will measure success',
              estimatedTime: 30,
              priority: 'HIGH',
              isRecurring: false,
              recurrenceRule: null,
              tips: 'Be specific about what success looks like',
            },
          ],
        },
        {
          title: 'Building Momentum',
          description: 'Start taking action and building habits',
          targetDate: null,
          tasks: [
            {
              title: 'Take first action step',
              description: 'Complete your first meaningful action toward this goal',
              estimatedTime: 45,
              priority: 'MEDIUM',
              isRecurring: false,
              recurrenceRule: null,
              tips: 'Start small but start now',
            },
            {
              title: 'Review and adjust',
              description: 'Evaluate your progress and adjust your approach',
              estimatedTime: 30,
              priority: 'MEDIUM',
              isRecurring: true,
              recurrenceRule: 'WEEKLY',
              tips: 'Regular reviews help maintain focus',
            },
          ],
        },
      ],
      tips: [
        'Break down large tasks into smaller, manageable steps',
        'Celebrate small wins along the way',
        'Track your progress regularly',
      ],
      warnings: [
        'Avoid trying to do too much at once',
        'Be patient - meaningful progress takes time',
      ],
      resources: [],
    };
  }

  /**
   * Analyze progress using agents
   */
  async analyzeProgress(
    goalTitle: string,
    tasks: Array<{ id: string; title: string; status: string; completedAt?: string }>,
    startDate: string,
    targetDate: string,
    userId: string
  ): Promise<ProgressAnalysisOutput> {
    try {
      const context: AgentContext = {
        userId,
        existingTasks: tasks,
      };

      return await visionBoardAgents.analyzeProgress(goalTitle, tasks, startDate, targetDate, context);
    } catch (error) {
      console.error('Error analyzing progress:', error);
      const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
      const totalCount = tasks.length || 1;
      return {
        overallProgress: Math.round((completedCount / totalCount) * 100),
        tasksCompleted: completedCount,
        totalTasks: totalCount,
        currentPhase: 'In Progress',
        onTrack: true,
        daysAhead: 0,
        daysBehind: 0,
        strengths: ['Making progress on your goal'],
        areasForImprovement: ['Continue with your current pace'],
        nextRecommendedActions: ['Review your progress regularly', 'Keep working on your tasks'],
        motivationalInsight: 'Every step forward counts. Keep going!',
      };
    }
  }

  /**
   * Estimate timeline for a goal
   */
  async estimateTimeline(
    goalTitle: string,
    answers: Record<string, any>,
    hoursPerWeek: number,
    userId: string
  ): Promise<TimelineOutput> {
    try {
      const context: AgentContext = { userId };

      // First get task breakdown
      const classification = await visionBoardAgents.classifyGoal(goalTitle, context);
      const taskBreakdown = await visionBoardAgents.generateTasks(goalTitle, classification, answers, context);

      // Then estimate timeline
      return await visionBoardAgents.estimateTimeline(taskBreakdown, hoursPerWeek, undefined, context);
    } catch (error) {
      console.error('Error estimating timeline:', error);
      // Return a sensible default timeline
      const weeksNeeded = Math.max(4, Math.ceil(40 / hoursPerWeek));
      const startDate = new Date();
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + weeksNeeded * 7);
      return {
        recommendedStartDate: startDate.toISOString().split('T')[0],
        estimatedCompletionDate: completionDate.toISOString().split('T')[0],
        totalDurationWeeks: weeksNeeded,
        weeklyCommitmentHours: hoursPerWeek,
        schedule: [
          {
            week: 1,
            focus: 'Planning & Research',
            tasks: ['Initial planning', 'Research'],
            expectedProgress: 15,
          },
          {
            week: Math.ceil(weeksNeeded / 2),
            focus: 'Execution',
            tasks: ['Main work', 'Progress review'],
            expectedProgress: 50,
          },
          {
            week: weeksNeeded,
            focus: 'Review & Completion',
            tasks: ['Final review', 'Completion'],
            expectedProgress: 100,
          },
        ],
        adjustmentSuggestions: ['Timeline may vary based on complexity', 'Adjust based on your progress'],
      };
    }
  }

  /**
   * Orchestrate user message to determine action
   */
  async orchestrate(userMessage: string, userId: string, existingGoal?: any): Promise<OrchestratorOutput> {
    try {
      const context: AgentContext = {
        userId,
        existingGoal: existingGoal
          ? {
              id: existingGoal.id,
              title: existingGoal.title,
              category: mapGoalTypeToCategory(existingGoal.type),
              isHabitBased: existingGoal.type === 'HABIT',
            }
          : undefined,
      };

      return await visionBoardAgents.orchestrate(userMessage, context);
    } catch (error) {
      console.error('Error in orchestrate:', error);
      return {
        action: 'CLASSIFY_GOAL',
        reasoning: 'Default action - proceeding with goal classification',
        additionalContext: { userMessage },
      };
    }
  }

  /**
   * Get motivational insight based on progress
   */
  async getMotivationalInsight(
    goalTitle: string,
    tasks: Array<{ id: string; title: string; status: string; completedAt?: string }>,
    startDate: string,
    targetDate: string,
    userId: string
  ): Promise<string> {
    const analysis = await this.analyzeProgress(goalTitle, tasks, startDate, targetDate, userId);
    return analysis.motivationalInsight;
  }

  /**
   * Convert TaskBreakdownOutput to GeneratedPlan format
   */
  private convertToGeneratedPlan(
    taskBreakdown: TaskBreakdownOutput,
    habitPlan: HabitTrackingOutput | null
  ): GeneratedPlan {
    // Group tasks by phase into milestones
    const milestones = taskBreakdown.phases.map((phase) => ({
      title: phase.phaseName,
      description: phase.description,
      targetDate: null as string | null,
      tasks: phase.tasks.flatMap((task) => {
        // Include main task and subtasks
        const mainTask = {
          title: task.title,
          description: task.description,
          estimatedTime: this.parseDurationToMinutes(task.estimatedDuration),
          priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH',
          isRecurring: task.subtasks.some((s) => s.isRecurring),
          recurrenceRule: task.subtasks.find((s) => s.recurringPattern)?.recurringPattern || null,
          tips: task.tips.join('; '),
        };

        return [mainTask];
      }),
    }));

    // Convert habits if present
    const habits = habitPlan
      ? habitPlan.dailyTasks.map((task) => ({
          title: task.title,
          description: task.description,
          frequency: 'DAILY' as const,
          targetPerPeriod: 1,
          reminderTime: this.bestTimeToTime(task.bestTimeOfDay),
        }))
      : undefined;

    // Extract tips and resources
    const tips = taskBreakdown.phases.flatMap((p) => p.tasks.flatMap((t) => t.tips)).slice(0, 5);

    const warnings = taskBreakdown.phases
      .flatMap((p) => p.tasks.flatMap((t) => t.potentialChallenges))
      .slice(0, 3);

    const resources = taskBreakdown.phases
      .flatMap((p) =>
        p.tasks.flatMap((t) =>
          t.subtasks.flatMap((s) => (s.resources || []).map((r) => `${r.title}${r.url ? `: ${r.url}` : ''}`))
        )
      )
      .slice(0, 5);

    return {
      milestones,
      habits,
      tips,
      warnings,
      resources,
    };
  }

  /**
   * Parse duration string to minutes
   */
  private parseDurationToMinutes(duration: string): number {
    const lower = duration.toLowerCase();

    // Check for hours
    const hourMatch = lower.match(/(\d+)\s*h/);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10) * 60;
    }

    // Check for minutes
    const minMatch = lower.match(/(\d+)\s*m/);
    if (minMatch) {
      return parseInt(minMatch[1], 10);
    }

    // Check for days
    const dayMatch = lower.match(/(\d+)\s*d/);
    if (dayMatch) {
      return parseInt(dayMatch[1], 10) * 60 * 8; // Assume 8 working hours per day
    }

    // Check for weeks
    const weekMatch = lower.match(/(\d+)\s*w/);
    if (weekMatch) {
      return parseInt(weekMatch[1], 10) * 60 * 8 * 5; // Assume 5 working days per week
    }

    // Default to 30 minutes if unparseable
    return 30;
  }

  /**
   * Convert best time of day to a time string
   */
  private bestTimeToTime(time: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME'): string {
    const timeMap = {
      MORNING: '08:00',
      AFTERNOON: '14:00',
      EVENING: '19:00',
      ANYTIME: '09:00',
    };
    return timeMap[time];
  }
}

// Export singleton instance
export const agentService = new AgentService();
