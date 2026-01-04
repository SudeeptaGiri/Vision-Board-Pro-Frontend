import { run } from '@openai/agents';
import { orchestratorAgent } from './orchestrator.agent';
import { goalClassifierAgent } from './goal-classifier.agent';
import { createQuestionGeneratorAgent } from './question-generator.agent';
import { taskBreakdownAgent } from './task-breakdown.agent';
import { timelineEstimatorAgent } from './timeline-estimator.agent';
import { habitTrackerAgent } from './habit-tracker.agent';
import { progressAnalyzerAgent } from './progress-analyzer.agent';
import {
  GoalClassification,
  QuestionsOutput,
  TaskBreakdownOutput,
  TimelineOutput,
  HabitTrackingOutput,
  ProgressAnalysisOutput,
  OrchestratorOutput,
  GoalCategory,
} from './schemas';

// Context type for all agents
export interface AgentContext {
  userId: string;
  existingGoal?: {
    id: string;
    title: string;
    category: GoalCategory;
    isHabitBased: boolean;
  };
  questionAnswers?: Record<string, any>;
  existingTasks?: Array<{
    id: string;
    title: string;
    status: string;
    completedAt?: string;
  }>;
}

// Main Vision Board Agent Service
export class VisionBoardAgentService {
  // Process a new goal through the full pipeline
  async processNewGoal(
    goalText: string,
    context: AgentContext
  ): Promise<{
    classification: GoalClassification;
    questions: QuestionsOutput;
  }> {
    // Step 1: Classify the goal
    const classification = await this.classifyGoal(goalText, context);

    // Step 2: Generate personalization questions
    const questions = await this.generateQuestions(
      goalText,
      classification.category,
      context
    );

    return { classification, questions };
  }

  // Classify a goal
  async classifyGoal(goalText: string, context: AgentContext): Promise<GoalClassification> {
    try {
      const result = await run(goalClassifierAgent, goalText, { context });

      if (!result.finalOutput) {
        throw new Error('No output from classifier');
      }

      return result.finalOutput as GoalClassification;
    } catch (error) {
      console.error('Goal classification error:', error);
      // Return a default classification
      return this.getDefaultClassification(goalText);
    }
  }

  // Generate personalization questions
  async generateQuestions(
    goalText: string,
    category: GoalCategory,
    context: AgentContext
  ): Promise<QuestionsOutput> {
    try {
      const questionAgent = createQuestionGeneratorAgent(category);

      const prompt = `
Goal: ${goalText}
Category: ${category}

Generate personalized questions to help create a detailed action plan for this goal.
      `.trim();

      const result = await run(questionAgent, prompt, { context });

      if (!result.finalOutput) {
        throw new Error('No output from question generator');
      }

      return result.finalOutput as QuestionsOutput;
    } catch (error) {
      console.error('Question generation error:', error);
      // Return default questions
      return this.getDefaultQuestions(category);
    }
  }

  // Generate task breakdown
  async generateTasks(
    goalText: string,
    classification: GoalClassification,
    answers: Record<string, any>,
    context: AgentContext
  ): Promise<TaskBreakdownOutput> {
    try {
      const prompt = `
## Goal
${goalText}

## Classification
- Category: ${classification.category}
- Subcategory: ${classification.subcategory}
- Complexity: ${classification.estimatedComplexity}
- Is Habit-Based: ${classification.isHabitBased}

## User's Answers to Personalization Questions
${JSON.stringify(answers, null, 2)}

Create a comprehensive task breakdown for this goal based on all the provided information.
      `.trim();

      const result = await run(taskBreakdownAgent, prompt, { context });

      if (!result.finalOutput) {
        throw new Error('No output from task breakdown');
      }

      return result.finalOutput as TaskBreakdownOutput;
    } catch (error) {
      console.error('Task breakdown error:', error);
      // Return default task breakdown
      return this.getDefaultTaskBreakdown(goalText, classification);
    }
  }

  // Estimate timeline
  async estimateTimeline(
    taskBreakdown: TaskBreakdownOutput,
    hoursPerWeek: number,
    preferredStartDate?: string,
    context?: AgentContext
  ): Promise<TimelineOutput> {
    try {
      const prompt = `
## Task Breakdown Summary
- Total Tasks: ${taskBreakdown.totalTasks}
- Total Subtasks: ${taskBreakdown.totalSubtasks}
- Estimated Duration: ${taskBreakdown.estimatedTotalDuration}
- Phases: ${taskBreakdown.phases.map((p) => p.phaseName).join(', ')}

## User Availability
- Hours per week: ${hoursPerWeek}
- Preferred start date: ${preferredStartDate || 'As soon as possible'}

## Detailed Phases
${JSON.stringify(taskBreakdown.phases, null, 2)}

Create a realistic timeline and weekly schedule for completing this goal.
      `.trim();

      const result = await run(timelineEstimatorAgent, prompt, { context });

      if (!result.finalOutput) {
        throw new Error('No output from timeline estimator');
      }

      return result.finalOutput as TimelineOutput;
    } catch (error) {
      console.error('Timeline estimation error:', error);
      return this.getDefaultTimeline(hoursPerWeek);
    }
  }

  // Setup habit tracking
  async setupHabitTracking(
    goalText: string,
    classification: GoalClassification,
    answers: Record<string, any>,
    context: AgentContext
  ): Promise<HabitTrackingOutput> {
    try {
      const prompt = `
## Habit Goal
${goalText}

## Classification
- Category: ${classification.category}
- Subcategory: ${classification.subcategory}

## User's Preferences and Situation
${JSON.stringify(answers, null, 2)}

Create a habit tracking plan with daily tasks, milestones, and streak benefits.
      `.trim();

      const result = await run(habitTrackerAgent, prompt, { context });

      if (!result.finalOutput) {
        throw new Error('No output from habit tracker');
      }

      return result.finalOutput as HabitTrackingOutput;
    } catch (error) {
      console.error('Habit tracking setup error:', error);
      return this.getDefaultHabitPlan(goalText);
    }
  }

  // Analyze progress
  async analyzeProgress(
    goalText: string,
    tasks: Array<{ id: string; title: string; status: string; completedAt?: string }>,
    startDate: string,
    targetDate: string,
    context: AgentContext
  ): Promise<ProgressAnalysisOutput> {
    try {
      const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
      const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
      const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');

      const prompt = `
## Goal
${goalText}

## Timeline
- Started: ${startDate}
- Target completion: ${targetDate}

## Task Status
- Total tasks: ${tasks.length}
- Completed: ${completedTasks.length}
- In Progress: ${inProgressTasks.length}
- Blocked: ${blockedTasks.length}
- Not Started: ${tasks.length - completedTasks.length - inProgressTasks.length - blockedTasks.length}

## Task Details
${JSON.stringify(tasks, null, 2)}

Analyze the progress and provide insights and recommendations.
      `.trim();

      const result = await run(progressAnalyzerAgent, prompt, { context });

      if (!result.finalOutput) {
        throw new Error('No output from progress analyzer');
      }

      return result.finalOutput as ProgressAnalysisOutput;
    } catch (error) {
      console.error('Progress analysis error:', error);
      return this.getDefaultProgressAnalysis(tasks);
    }
  }

  // Orchestrate - determine what action to take
  async orchestrate(
    userMessage: string,
    context: AgentContext
  ): Promise<OrchestratorOutput> {
    try {
      const contextSummary = `
## Current Context
- User ID: ${context.userId}
- Has existing goal: ${!!context.existingGoal}
${context.existingGoal ? `- Goal: ${context.existingGoal.title} (${context.existingGoal.category})` : ''}
- Has answered questions: ${!!context.questionAnswers}
- Has existing tasks: ${!!context.existingTasks}
${context.existingTasks ? `- Task count: ${context.existingTasks.length}` : ''}
      `.trim();

      const prompt = `
${contextSummary}

## User Message
${userMessage}

Determine the appropriate action to take.
      `.trim();

      const result = await run(orchestratorAgent, prompt, { context });

      if (!result.finalOutput) {
        throw new Error('No output from orchestrator');
      }

      return result.finalOutput as OrchestratorOutput;
    } catch (error) {
      console.error('Orchestration error:', error);
      return {
        action: 'CLARIFY_GOAL',
        reasoning: 'Unable to determine action, please clarify your request.',
      };
    }
  }

  // ============= Default/Fallback Methods =============

  private getDefaultClassification(goalText: string): GoalClassification {
    const lowerGoal = goalText.toLowerCase();
    let category: GoalCategory = 'PERSONAL_DEVELOPMENT';
    let isHabitBased = false;

    if (lowerGoal.includes('learn') || lowerGoal.includes('study') || lowerGoal.includes('course')) {
      category = 'LEARNING';
    } else if (lowerGoal.includes('travel') || lowerGoal.includes('trip') || lowerGoal.includes('visit')) {
      category = 'TRAVEL';
    } else if (lowerGoal.includes('health') || lowerGoal.includes('fitness') || lowerGoal.includes('exercise') || lowerGoal.includes('weight')) {
      category = 'HEALTH_FITNESS';
    } else if (lowerGoal.includes('save') || lowerGoal.includes('invest') || lowerGoal.includes('money') || lowerGoal.includes('budget')) {
      category = 'FINANCIAL';
    } else if (lowerGoal.includes('career') || lowerGoal.includes('job') || lowerGoal.includes('promotion')) {
      category = 'CAREER';
    } else if (lowerGoal.includes('daily') || lowerGoal.includes('habit') || lowerGoal.includes('routine') || lowerGoal.includes('everyday')) {
      category = 'HABIT_BUILDING';
      isHabitBased = true;
    }

    return {
      category,
      subcategory: 'general',
      isHabitBased,
      requiresRecurringTasks: isHabitBased,
      estimatedComplexity: 'MODERATE',
      confidence: 0.7,
      reasoning: 'Default classification based on keywords',
    };
  }

  private getDefaultQuestions(category: GoalCategory): QuestionsOutput {
    const questionSets: Record<GoalCategory, any[]> = {
      LEARNING: [
        { id: 'q1', question: 'What is your current skill level?', type: 'SINGLE_SELECT', required: true, options: ['Complete beginner', 'Some basics', 'Intermediate', 'Advanced'], order: 1 },
        { id: 'q2', question: 'How much time can you dedicate daily?', type: 'SINGLE_SELECT', required: true, options: ['15 minutes', '30 minutes', '1 hour', '2+ hours'], order: 2 },
        { id: 'q3', question: 'What is your primary motivation?', type: 'TEXT', required: true, order: 3 },
      ],
      HEALTH_FITNESS: [
        { id: 'q1', question: 'What is your current activity level?', type: 'SINGLE_SELECT', required: true, options: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'], order: 1 },
        { id: 'q2', question: 'Do you have any health conditions?', type: 'TEXT', required: false, order: 2 },
        { id: 'q3', question: 'How much time can you exercise per day?', type: 'SINGLE_SELECT', required: true, options: ['15 minutes', '30 minutes', '45 minutes', '1 hour+'], order: 3 },
      ],
      HABIT_BUILDING: [
        { id: 'q1', question: 'Why is this habit important to you?', type: 'TEXT', required: true, order: 1 },
        { id: 'q2', question: 'What time of day works best?', type: 'SINGLE_SELECT', required: true, options: ['Morning', 'Afternoon', 'Evening', 'Flexible'], order: 2 },
        { id: 'q3', question: 'Have you tried building this habit before?', type: 'SINGLE_SELECT', required: true, options: ['Yes, successfully', 'Yes, but failed', 'No, first time'], order: 3 },
      ],
      FINANCIAL: [
        { id: 'q1', question: 'What is your target amount?', type: 'NUMBER', required: true, order: 1 },
        { id: 'q2', question: 'What is your timeline?', type: 'DATE', required: true, order: 2 },
        { id: 'q3', question: 'What is your monthly savings capacity?', type: 'NUMBER', required: false, order: 3 },
      ],
      CAREER: [
        { id: 'q1', question: 'What is your target role?', type: 'TEXT', required: true, order: 1 },
        { id: 'q2', question: 'What is your experience level?', type: 'SINGLE_SELECT', required: true, options: ['Entry level', 'Mid level', 'Senior', 'Executive'], order: 2 },
        { id: 'q3', question: 'What skills do you need?', type: 'TEXT', required: true, order: 3 },
      ],
      TRAVEL: [
        { id: 'q1', question: 'Where do you want to go?', type: 'TEXT', required: true, order: 1 },
        { id: 'q2', question: 'When do you plan to travel?', type: 'DATE', required: true, order: 2 },
        { id: 'q3', question: 'What is your budget?', type: 'SINGLE_SELECT', required: true, options: ['Budget', 'Moderate', 'Luxury'], order: 3 },
      ],
      RELATIONSHIP: [
        { id: 'q1', question: 'What relationship area?', type: 'SINGLE_SELECT', required: true, options: ['Family', 'Friendship', 'Romantic', 'Professional'], order: 1 },
        { id: 'q2', question: 'What outcome do you want?', type: 'TEXT', required: true, order: 2 },
      ],
      HOBBY: [
        { id: 'q1', question: 'How much time can you dedicate weekly?', type: 'SINGLE_SELECT', required: true, options: ['1-2 hours', '3-5 hours', '5-10 hours', '10+ hours'], order: 1 },
        { id: 'q2', question: 'Do you have the required equipment?', type: 'SINGLE_SELECT', required: true, options: ['Yes', 'No', 'Partially'], order: 2 },
      ],
      PERSONAL_DEVELOPMENT: [
        { id: 'q1', question: 'What area of life does this improve?', type: 'SINGLE_SELECT', required: true, options: ['Relationships', 'Mental health', 'Confidence', 'Work-life balance', 'Other'], order: 1 },
        { id: 'q2', question: 'What does success look like?', type: 'TEXT', required: true, order: 2 },
        { id: 'q3', question: 'What has held you back before?', type: 'TEXT', required: false, order: 3 },
      ],
      HOME_LIFESTYLE: [
        { id: 'q1', question: 'What area of your home/lifestyle?', type: 'TEXT', required: true, order: 1 },
        { id: 'q2', question: 'What is your budget?', type: 'NUMBER', required: false, order: 2 },
      ],
      OTHER: [
        { id: 'q1', question: 'Can you describe your goal in more detail?', type: 'TEXT', required: true, order: 1 },
        { id: 'q2', question: 'When do you want to achieve this?', type: 'DATE', required: false, order: 2 },
        { id: 'q3', question: 'What resources do you have?', type: 'TEXT', required: false, order: 3 },
      ],
    };

    const questions = questionSets[category] || questionSets.OTHER;

    return {
      questions,
      totalQuestions: questions.length,
      estimatedTimeToComplete: '2-3 minutes',
      categorySpecificNote: `Questions tailored for ${category.toLowerCase().replace('_', ' ')} goals`,
    };
  }

  private getDefaultTaskBreakdown(goalText: string, classification: GoalClassification): TaskBreakdownOutput {
    return {
      goalSummary: goalText,
      totalTasks: 3,
      totalSubtasks: 6,
      estimatedTotalDuration: '4 weeks',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Preparation',
          description: 'Get ready and gather resources',
          tasks: [
            {
              id: 'task_1_1',
              title: 'Research and plan',
              description: 'Research best practices and create a plan',
              priority: 'HIGH',
              phase: 1,
              phaseName: 'Preparation',
              estimatedDuration: '2 hours',
              subtasks: [
                { id: 'sub_1_1_1', title: 'Research online resources', description: 'Find tutorials and guides', estimatedDuration: '1 hour', isRecurring: false, tips: [], resources: [] },
                { id: 'sub_1_1_2', title: 'Create a schedule', description: 'Plan your weekly activities', estimatedDuration: '30 minutes', isRecurring: false, tips: [], resources: [] },
              ],
              dependencies: [],
              milestonePercentage: 20,
              tips: ['Start small and build up gradually'],
              potentialChallenges: ['Finding time in your schedule'],
            },
          ],
        },
        {
          phaseNumber: 2,
          phaseName: 'Execution',
          description: 'Start working on your goal',
          tasks: [
            {
              id: 'task_2_1',
              title: 'Begin practice/work',
              description: 'Start executing your plan',
              priority: 'HIGH',
              phase: 2,
              phaseName: 'Execution',
              estimatedDuration: '2 weeks',
              subtasks: [
                { id: 'sub_2_1_1', title: 'Daily practice session', description: 'Consistent daily effort', estimatedDuration: '30 minutes', isRecurring: true, recurringPattern: 'daily', tips: [], resources: [] },
                { id: 'sub_2_1_2', title: 'Weekly review', description: 'Review progress weekly', estimatedDuration: '15 minutes', isRecurring: true, recurringPattern: 'weekly', tips: [], resources: [] },
              ],
              dependencies: ['task_1_1'],
              milestonePercentage: 60,
              tips: ['Stay consistent even when motivation is low'],
              potentialChallenges: ['Maintaining consistency'],
            },
          ],
        },
        {
          phaseNumber: 3,
          phaseName: 'Mastery',
          description: 'Solidify your progress',
          tasks: [
            {
              id: 'task_3_1',
              title: 'Advanced practice',
              description: 'Take your skills to the next level',
              priority: 'MEDIUM',
              phase: 3,
              phaseName: 'Mastery',
              estimatedDuration: '2 weeks',
              subtasks: [
                { id: 'sub_3_1_1', title: 'Challenge yourself', description: 'Try harder exercises', estimatedDuration: '45 minutes', isRecurring: true, recurringPattern: 'daily', tips: [], resources: [] },
                { id: 'sub_3_1_2', title: 'Track achievements', description: 'Document your progress', estimatedDuration: '10 minutes', isRecurring: true, recurringPattern: 'daily', tips: [], resources: [] },
              ],
              dependencies: ['task_2_1'],
              milestonePercentage: 100,
              tips: ['Celebrate small wins'],
              potentialChallenges: ['Plateauing'],
            },
          ],
        },
      ],
      milestones: [
        { percentage: 20, title: 'Getting Started', description: 'Completed preparation phase' },
        { percentage: 50, title: 'Halfway There', description: 'Consistent progress being made' },
        { percentage: 100, title: 'Goal Achieved', description: 'Congratulations!' },
      ],
      successMetrics: ['Consistency of practice', 'Skill improvement', 'Goal completion'],
      motivationalMessage: 'Every journey begins with a single step. You\'ve got this!',
    };
  }

  private getDefaultTimeline(hoursPerWeek: number): TimelineOutput {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 28); // 4 weeks

    return {
      recommendedStartDate: startDate.toISOString(),
      estimatedCompletionDate: endDate.toISOString(),
      totalDurationWeeks: 4,
      weeklyCommitmentHours: hoursPerWeek,
      schedule: [
        { week: 1, focus: 'Preparation and planning', tasks: ['Research', 'Setup'], expectedProgress: 20 },
        { week: 2, focus: 'Building foundation', tasks: ['Daily practice', 'Learning basics'], expectedProgress: 40 },
        { week: 3, focus: 'Consistent practice', tasks: ['Regular sessions', 'Review progress'], expectedProgress: 70 },
        { week: 4, focus: 'Mastery and completion', tasks: ['Advanced practice', 'Final push'], expectedProgress: 100 },
      ],
      adjustmentSuggestions: ['Adjust based on your progress', 'Take rest days when needed'],
    };
  }

  private getDefaultHabitPlan(goalText: string): HabitTrackingOutput {
    return {
      habitName: goalText,
      dailyTasks: [
        {
          id: 'habit_task_1',
          title: 'Complete your daily session',
          description: 'Dedicate focused time to your habit',
          bestTimeOfDay: 'MORNING',
          durationMinutes: 30,
          streakBonus: 'Building consistency',
        },
      ],
      weeklyMilestones: [
        { week: 1, milestone: 'Complete 5 days', reward: 'You\'re building momentum!' },
        { week: 2, milestone: 'Complete 10 days total', reward: 'The habit is forming!' },
        { week: 3, milestone: 'Complete 15 days total', reward: 'You\'re halfway to a solid habit!' },
        { week: 4, milestone: 'Complete 21 days total', reward: 'The habit is now part of your routine!' },
      ],
      streakBenefits: [
        { days: 7, benefit: 'Building initial momentum' },
        { days: 14, benefit: 'Habit is becoming automatic' },
        { days: 21, benefit: 'Habit is forming strong neural pathways' },
        { days: 30, benefit: 'Habit is now a solid part of your routine' },
      ],
      recoveryStrategy: 'If you miss a day, don\'t give up! Just start again the next day. One missed day doesn\'t break your progress.',
    };
  }

  private getDefaultProgressAnalysis(
    tasks: Array<{ id: string; title: string; status: string; completedAt?: string }>
  ): ProgressAnalysisOutput {
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const total = tasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      overallProgress: progress,
      tasksCompleted: completed,
      totalTasks: total,
      currentPhase: progress < 30 ? 'Getting Started' : progress < 70 ? 'In Progress' : 'Final Push',
      onTrack: progress >= 50,
      daysAhead: 0,
      daysBehind: 0,
      strengths: ['You\'re making progress!'],
      areasForImprovement: ['Keep up the momentum'],
      nextRecommendedActions: ['Complete your next task', 'Review your progress weekly'],
      motivationalInsight: `You've completed ${completed} out of ${total} tasks. Keep going!`,
    };
  }
}

// Export singleton instance
export const visionBoardAgents = new VisionBoardAgentService();

// Export all agents and types
export {
  orchestratorAgent,
  goalClassifierAgent,
  createQuestionGeneratorAgent,
  taskBreakdownAgent,
  timelineEstimatorAgent,
  habitTrackerAgent,
  progressAnalyzerAgent,
};

export * from './schemas';
export * from './guardrails';
export * from './tools';
