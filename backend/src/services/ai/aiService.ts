import OpenAI from 'openai';
import { config } from '../../config/env';
import { GOAL_TYPE_PROMPTS, QUESTIONNAIRE_PROMPTS, TASK_GENERATION_PROMPT } from './prompts';
import { GoalType } from '@prisma/client';

const openai = new OpenAI({
  apiKey: config.ai.openaiKey,
});

export interface Question {
  id: string;
  question: string;
  type: 'text' | 'select' | 'number' | 'date' | 'multiselect';
  options?: string[];
  required: boolean;
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

class AIService {
  /**
   * Generate questionnaire based on goal type and title
   */
  async generateQuestionnaire(
    goalType: GoalType,
    goalTitle: string
  ): Promise<Question[]> {
    try {
      const systemPrompt = GOAL_TYPE_PROMPTS[goalType];
      const userPrompt = `Goal: "${goalTitle}"
      
${QUESTIONNAIRE_PROMPTS[goalType]}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from AI');

      const parsed = JSON.parse(content);
      return parsed.questions || parsed;
    } catch (error) {
      console.error('Error generating questionnaire:', error);
      // Return default questions as fallback
      return this.getDefaultQuestions(goalType);
    }
  }

  /**
   * Generate tasks and milestones based on goal and questionnaire answers
   */
  async generatePlan(
    goalType: GoalType,
    goalTitle: string,
    goalDescription: string | null,
    questionnaireAnswers: Record<string, any>
  ): Promise<GeneratedPlan> {
    try {
      const systemPrompt = GOAL_TYPE_PROMPTS[goalType];
      
      const userPrompt = `Goal: "${goalTitle}"
${goalDescription ? `Description: ${goalDescription}` : ''}

User's Questionnaire Responses:
${Object.entries(questionnaireAnswers)
  .map(([question, answer]) => `- ${question}: ${answer}`)
  .join('\n')}

${TASK_GENERATION_PROMPT}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating plan:', error);
      throw error;
    }
  }

  /**
   * Regenerate specific tasks or suggest improvements
   */
  async suggestTaskImprovements(
    task: { title: string; description: string },
    goalContext: string
  ): Promise<{ suggestions: string[]; alternativeTasks: string[] }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity expert helping users optimize their tasks.',
          },
          {
            role: 'user',
            content: `Task: "${task.title}"
Description: ${task.description}
Goal Context: ${goalContext}

Provide suggestions to improve this task and alternative approaches. Return JSON:
{
  "suggestions": ["suggestion1", "suggestion2"],
  "alternativeTasks": ["alternative task 1", "alternative task 2"]
}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      return { suggestions: [], alternativeTasks: [] };
    }
  }

  /**
   * Suggest additional tasks for a goal
   */
  async suggestAdditionalTasks(
    goalType: GoalType,
    goalTitle: string,
    goalDescription: string,
    existingTasks: string,
    context?: string
  ): Promise<{ title: string; description: string; priority: string }[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: GOAL_TYPE_PROMPTS[goalType],
          },
          {
            role: 'user',
            content: `Goal: "${goalTitle}"
Description: ${goalDescription}
Existing Tasks: ${existingTasks}
${context ? `Additional Context: ${context}` : ''}

Suggest 3-5 additional tasks that would help achieve this goal. Return JSON:
{
  "tasks": [
    { "title": "Task title", "description": "Description", "priority": "LOW|MEDIUM|HIGH" }
  ]
}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from AI');

      const parsed = JSON.parse(content);
      return parsed.tasks || [];
    } catch (error) {
      console.error('Error suggesting additional tasks:', error);
      return [];
    }
  }

  /**
   * Get motivational message based on progress
   */
  async getMotivationalMessage(
    goalTitle: string,
    progress: number,
    goalType: GoalType
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an encouraging life coach. Keep messages brief, personal, and motivating.',
          },
          {
            role: 'user',
            content: `Goal: "${goalTitle}"
Goal Type: ${goalType}
Progress: ${progress}%

Write a brief, personalized motivational message (2-3 sentences).`,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      });

      return response.choices[0].message.content || 'Keep going! You\'re making great progress!';
    } catch (error) {
      return 'Keep going! Every step counts towards your goal!';
    }
  }

  /**
   * Default questions fallback
   */
  private getDefaultQuestions(goalType: GoalType): Question[] {
    const defaultQuestions: Record<GoalType, Question[]> = {
      ACHIEVEMENT: [
        { id: 'q1', question: 'What specific outcome do you want to achieve?', type: 'text', required: true },
        { id: 'q2', question: 'When do you want to achieve this by?', type: 'date', required: true },
        { id: 'q3', question: 'What resources do you have available?', type: 'text', required: false },
        { id: 'q4', question: 'What is your budget for this goal?', type: 'select', options: ['No budget', 'Under $100', '$100-$500', '$500-$1000', 'Over $1000'], required: true },
      ],
      LEARNING: [
        { id: 'q1', question: 'What is your current skill level?', type: 'select', options: ['Complete beginner', 'Some basics', 'Intermediate', 'Advanced'], required: true },
        { id: 'q2', question: 'How much time can you dedicate daily?', type: 'select', options: ['15 minutes', '30 minutes', '1 hour', '2+ hours'], required: true },
        { id: 'q3', question: 'Do you have the necessary equipment/resources?', type: 'select', options: ['Yes', 'No', 'Partially'], required: true },
        { id: 'q4', question: 'What aspect interests you most?', type: 'text', required: false },
      ],
      HEALTH: [
        { id: 'q1', question: 'What is your current activity level?', type: 'select', options: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'], required: true },
        { id: 'q2', question: 'Do you have any health conditions or limitations?', type: 'text', required: false },
        { id: 'q3', question: 'How much time can you exercise per day?', type: 'select', options: ['15 minutes', '30 minutes', '45 minutes', '1 hour+'], required: true },
        { id: 'q4', question: 'Do you have access to a gym?', type: 'select', options: ['Yes', 'No', 'Home equipment only'], required: true },
      ],
      HABIT: [
        { id: 'q1', question: 'Why is this habit important to you?', type: 'text', required: true },
        { id: 'q2', question: 'What time of day works best?', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Flexible'], required: true },
        { id: 'q3', question: 'Have you tried building this habit before?', type: 'select', options: ['Yes, successfully', 'Yes, but failed', 'No, first time'], required: true },
        { id: 'q4', question: 'What usually breaks your habits?', type: 'text', required: false },
      ],
      FINANCIAL: [
        { id: 'q1', question: 'What is your target amount?', type: 'number', required: true },
        { id: 'q2', question: 'What is your timeline?', type: 'date', required: true },
        { id: 'q3', question: 'What is your current monthly savings capacity?', type: 'number', required: true },
        { id: 'q4', question: 'What is your risk tolerance?', type: 'select', options: ['Conservative', 'Moderate', 'Aggressive'], required: true },
      ],
      CAREER: [
        { id: 'q1', question: 'What is your target role/position?', type: 'text', required: true },
        { id: 'q2', question: 'What is your current experience level?', type: 'select', options: ['Entry level', 'Mid level', 'Senior', 'Executive'], required: true },
        { id: 'q3', question: 'What skills do you need to develop?', type: 'text', required: true },
        { id: 'q4', question: 'What is your timeline?', type: 'select', options: ['3 months', '6 months', '1 year', '2+ years'], required: true },
      ],
      PERSONAL: [
        { id: 'q1', question: 'What area of life does this improve?', type: 'select', options: ['Relationships', 'Mental health', 'Confidence', 'Work-life balance', 'Other'], required: true },
        { id: 'q2', question: 'What does success look like for you?', type: 'text', required: true },
        { id: 'q3', question: 'What has held you back before?', type: 'text', required: false },
        { id: 'q4', question: 'Do you have a support system?', type: 'select', options: ['Yes', 'No', 'Somewhat'], required: true },
      ],
    };

    return defaultQuestions[goalType] || defaultQuestions.ACHIEVEMENT;
  }
}

export const aiService = new AIService();