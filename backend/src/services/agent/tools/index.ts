import { tool } from '@openai/agents';
import { z } from 'zod';

// Search for learning resources
export const searchResourcesTool = tool({
  name: 'search_resources',
  description:
    'Search for learning resources, tutorials, courses, or guides related to a topic',
  parameters: z.object({
    topic: z.string().describe('The topic to search resources for'),
    resourceType: z
      .enum(['course', 'tutorial', 'book', 'video', 'article', 'tool'])
      .describe('Type of resource to search for'),
    difficulty: z
      .enum(['beginner', 'intermediate', 'advanced'])
      .describe('Difficulty level - use beginner if unknown'),
  }),
  execute: async ({ topic, resourceType, difficulty }) => {
    // In production, this would call actual APIs (Google, YouTube, Udemy, etc.)
    // For now, return structured placeholder data
    return {
      resources: [
        {
          title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} ${topic} ${resourceType}`,
          type: resourceType,
          url: `https://example.com/${topic.toLowerCase().replace(/\s+/g, '-')}`,
          rating: 4.5,
          description: `A comprehensive ${resourceType} for learning ${topic}`,
        },
      ],
    };
  },
});

// Calculate dates and timelines
export const calculateTimelineTool = tool({
  name: 'calculate_timeline',
  description: 'Calculate dates and create timeline based on duration and start date',
  parameters: z.object({
    startDate: z.string().describe('Start date in ISO format'),
    durationWeeks: z.number().describe('Duration in weeks'),
    hoursPerWeek: z.number().describe('Hours available per week'),
  }),
  execute: async ({ startDate, durationWeeks, hoursPerWeek }) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationWeeks * 7);

    const totalHours = durationWeeks * hoursPerWeek;

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalWeeks: durationWeeks,
      totalHours,
      weeklySchedule: Array.from({ length: durationWeeks }, (_, i) => ({
        week: i + 1,
        startDate: new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        hoursAllocated: hoursPerWeek,
      })),
    };
  },
});

// Get current date/time info
export const getCurrentDateTool = tool({
  name: 'get_current_date',
  description: 'Get the current date and time information',
  parameters: z.object({}),
  execute: async () => {
    const now = new Date();
    return {
      currentDate: now.toISOString(),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      month: now.toLocaleDateString('en-US', { month: 'long' }),
      year: now.getFullYear(),
      quarter: Math.ceil((now.getMonth() + 1) / 3),
    };
  },
});

// Estimate cost for goals (travel, purchases, etc.)
export const estimateCostTool = tool({
  name: 'estimate_cost',
  description: 'Estimate costs for various goal-related expenses',
  parameters: z.object({
    category: z
      .enum(['travel', 'education', 'equipment', 'subscription', 'other'])
      .describe('Category of expense'),
    items: z.array(z.string()).describe('List of items to estimate'),
    location: z.string().describe('Location if relevant, use "general" if unknown'),
    quality: z
      .enum(['budget', 'moderate', 'premium', 'luxury'])
      .describe('Quality tier - use moderate if not specified'),
  }),
  execute: async ({ category, items, location, quality }) => {
    // In production, this would use actual pricing APIs
    const multipliers = { budget: 0.6, moderate: 1, premium: 1.5, luxury: 2.5 };
    const baseCosts: Record<string, number> = {
      travel: 2000,
      education: 500,
      equipment: 300,
      subscription: 50,
      other: 100,
    };

    const baseCost = baseCosts[category] * multipliers[quality];

    return {
      estimatedTotal: baseCost * items.length,
      breakdown: items.map((item) => ({
        item,
        estimatedCost: baseCost,
        currency: 'USD',
      })),
      note: `Estimates based on ${quality} tier${location !== 'general' ? ` in ${location}` : ''}`,
    };
  },
});