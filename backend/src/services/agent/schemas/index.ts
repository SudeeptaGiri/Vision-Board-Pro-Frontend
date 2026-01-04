import { z } from 'zod';

// Goal Categories
export const GoalCategorySchema = z.enum([
  'TRAVEL',
  'LEARNING',
  'HEALTH_FITNESS',
  'CAREER',
  'FINANCIAL',
  'RELATIONSHIP',
  'HOBBY',
  'PERSONAL_DEVELOPMENT',
  'HOME_LIFESTYLE',
  'HABIT_BUILDING',
  'OTHER',
]);

export type GoalCategory = z.infer<typeof GoalCategorySchema>;

// Goal Classification Output
export const GoalClassificationSchema = z.object({
  category: GoalCategorySchema,
  subcategory: z.string(),
  isHabitBased: z.boolean(),
  requiresRecurringTasks: z.boolean(),
  estimatedComplexity: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX', 'VERY_COMPLEX']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type GoalClassification = z.infer<typeof GoalClassificationSchema>;

// Question Types
export const QuestionTypeSchema = z.enum([
  'TEXT',
  'NUMBER',
  'DATE',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'RANGE',
  'BOOLEAN',
]);

// Generated Question
export const GeneratedQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: QuestionTypeSchema.default('TEXT'),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  order: z.number().default(0),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

// Questions Output
export const QuestionsOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
  totalQuestions: z.number(),
  estimatedTimeToComplete: z.string(),
  categorySpecificNote: z.string().optional(),
});

export type QuestionsOutput = z.infer<typeof QuestionsOutputSchema>;

// Task Priority
// Task Priority - must match Prisma Priority enum
export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Task Status
export const TaskStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'SKIPPED',
]);

// Subtask
export const SubtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  estimatedDuration: z.string().default('30 minutes'),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  tips: z.array(z.string()).optional().default([]),
  resources: z
    .array(
      z.object({
        title: z.string(),
        type: z.enum(['ARTICLE', 'VIDEO', 'TOOL', 'APP', 'BOOK', 'COURSE']).default('ARTICLE'),
        url: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export type Subtask = z.infer<typeof SubtaskSchema>;

// Main Task
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: TaskPrioritySchema.default('MEDIUM'),
  phase: z.number().default(1),
  phaseName: z.string().default('Main Phase'),
  estimatedDuration: z.string().default('1 week'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  subtasks: z.array(SubtaskSchema).default([]),
  dependencies: z.array(z.string()).default([]),
  milestonePercentage: z.number().default(0),
  tips: z.array(z.string()).default([]),
  potentialChallenges: z.array(z.string()).default([]),
});

export type Task = z.infer<typeof TaskSchema>;

// Task Breakdown Output
export const TaskBreakdownOutputSchema = z.object({
  goalSummary: z.string(),
  totalTasks: z.number().default(0),
  totalSubtasks: z.number().default(0),
  estimatedTotalDuration: z.string().default('Unknown'),
  phases: z.array(
    z.object({
      phaseNumber: z.number().default(1),
      phaseName: z.string(),
      description: z.string().default(''),
      tasks: z.array(TaskSchema).default([]),
    })
  ).default([]),
  milestones: z.array(
    z.object({
      percentage: z.number(),
      title: z.string(),
      description: z.string().default(''),
    })
  ).default([]),
  successMetrics: z.array(z.string()).default([]),
  motivationalMessage: z.string().default('You can do this!'),
});

export type TaskBreakdownOutput = z.infer<typeof TaskBreakdownOutputSchema>;

// Timeline Output
export const TimelineOutputSchema = z.object({
  recommendedStartDate: z.string(),
  estimatedCompletionDate: z.string(),
  totalDurationWeeks: z.number().default(4),
  weeklyCommitmentHours: z.number().default(5),
  schedule: z.array(
    z.object({
      week: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()).default([]),
      expectedProgress: z.number().default(0),
    })
  ).default([]),
  adjustmentSuggestions: z.array(z.string()).default([]),
});

export type TimelineOutput = z.infer<typeof TimelineOutputSchema>;

// Habit Tracking Output
export const HabitTrackingOutputSchema = z.object({
  habitName: z.string(),
  dailyTasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().default(''),
      bestTimeOfDay: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']).default('ANYTIME'),
      durationMinutes: z.number().default(15),
      streakBonus: z.string().optional(),
    })
  ).default([]),
  weeklyMilestones: z.array(
    z.object({
      week: z.number(),
      milestone: z.string(),
      reward: z.string().default(''),
    })
  ).default([]),
  streakBenefits: z.array(
    z.object({
      days: z.number(),
      benefit: z.string(),
    })
  ).default([]),
  recoveryStrategy: z.string().default('If you miss a day, just pick up where you left off. Consistency matters more than perfection.'),
});

export type HabitTrackingOutput = z.infer<typeof HabitTrackingOutputSchema>;

// Progress Analysis Output
export const ProgressAnalysisOutputSchema = z.object({
  overallProgress: z.number().default(0),
  tasksCompleted: z.number().default(0),
  totalTasks: z.number().default(0),
  currentPhase: z.string().default('Getting Started'),
  onTrack: z.boolean().default(true),
  daysAhead: z.number().default(0),
  daysBehind: z.number().default(0),
  strengths: z.array(z.string()).default([]),
  areasForImprovement: z.array(z.string()).default([]),
  nextRecommendedActions: z.array(z.string()).default([]),
  motivationalInsight: z.string().default('Keep going, you are making progress!'),
  adjustedTimeline: z.string().optional(),
});

export type ProgressAnalysisOutput = z.infer<typeof ProgressAnalysisOutputSchema>;

// Orchestrator Output
export const OrchestratorOutputSchema = z.object({
  action: z.enum([
    'CLASSIFY_GOAL',
    'GENERATE_QUESTIONS',
    'GENERATE_TASKS',
    'ESTIMATE_TIMELINE',
    'SETUP_HABIT',
    'ANALYZE_PROGRESS',
    'CLARIFY_GOAL',
  ]),
  reasoning: z.string().default(''),
  additionalContext: z.record(z.any()).optional(),
});

export type OrchestratorOutput = z.infer<typeof OrchestratorOutputSchema>;