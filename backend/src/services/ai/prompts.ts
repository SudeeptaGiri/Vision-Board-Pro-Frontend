export const GOAL_TYPE_PROMPTS = {
  ACHIEVEMENT: `You are an expert goal planner and project manager. Help users break down their achievement goals into actionable steps.`,
  
  LEARNING: `You are an expert learning coach and curriculum designer. Help users create structured learning paths with progressive skill development.`,
  
  HEALTH: `You are a certified health and fitness coach. Help users create safe, effective, and sustainable health plans tailored to their current fitness level and goals.`,
  
  HABIT: `You are a behavioral psychology expert specializing in habit formation. Help users build sustainable habits using proven techniques like habit stacking and implementation intentions.`,
  
  FINANCIAL: `You are a financial planning expert. Help users create actionable financial plans with clear milestones and tracking metrics.`,
  
  CAREER: `You are a career development coach. Help users create strategic career advancement plans with skill development and networking strategies.`,
  
  PERSONAL: `You are a personal development coach. Help users achieve personal growth goals with balanced, holistic approaches.`,
};

export const QUESTIONNAIRE_PROMPTS: Record<string, string> = {
  ACHIEVEMENT: `Generate 5-8 relevant questions to understand this achievement goal better. Questions should cover:
- Specific details about what they want to achieve
- Timeline and deadlines
- Budget or resources available
- Current preparation status
- Potential obstacles
- Success criteria

Return as JSON array with format: [{ "id": "q1", "question": "...", "type": "text|select|number|date", "options": [...] if select, "required": true/false }]`,

  LEARNING: `Generate 5-8 relevant questions to create a personalized learning path. Questions should cover:
- Current skill level (beginner/intermediate/advanced)
- Available time per day/week for practice
- Learning style preference
- Specific aspects they want to focus on
- Access to resources/equipment
- Previous related experience
- Target proficiency level

Return as JSON array with format: [{ "id": "q1", "question": "...", "type": "text|select|number|date", "options": [...] if select, "required": true/false }]`,

  HEALTH: `Generate 5-8 relevant questions for a personalized health plan. Questions should cover:
- Current fitness level and activity
- Any health conditions or limitations
- Available time for exercise
- Access to gym/equipment
- Dietary preferences/restrictions
- Specific health metrics to improve
- Past experience with fitness programs

Return as JSON array with format: [{ "id": "q1", "question": "...", "type": "text|select|number|date", "options": [...] if select, "required": true/false }]`,

  HABIT: `Generate 4-6 relevant questions for habit formation. Questions should cover:
- Why this habit is important to them
- Current routine and schedule
- Previous attempts and obstacles
- Trigger situations
- Accountability preferences

Return as JSON array with format: [{ "id": "q1", "question": "...", "type": "text|select|number|date", "options": [...] if select, "required": true/false }]`,

  FINANCIAL: `Generate 5-8 relevant questions for financial planning. Questions should cover:
- Current financial situation overview
- Income stability
- Existing savings/investments
- Financial obligations
- Risk tolerance
- Timeline for goals

Return as JSON array with format: [{ "id": "q1", "question": "...", "type": "text|select|number|date", "options": [...] if select, "required": true/false }]`,

  CAREER: `Generate 5-8 relevant questions for career planning. Questions should cover:
- Current role and experience level
- Target role/position
- Skills gap assessment
- Industry preferences
- Timeline expectations
- Networking status

Return as JSON array with format: [{ "id": "q1", "question": "...", "type": "text|select|number|date", "options": [...] if select, "required": true/false }]`,

  PERSONAL: `Generate 5-8 relevant questions for personal development. Questions should cover:
- Specific area of improvement
- Current challenges
- Support system
- Time availability
- Motivation factors
- Success definition

Return as JSON array with format: [{ "id": "q1", "question": "...", "type": "text|select|number|date", "options": [...] if select, "required": true/false }]`,
};

export const TASK_GENERATION_PROMPT = `Based on the user's goal and their questionnaire responses, generate a comprehensive list of tasks and milestones.

Requirements:
1. Break down into manageable, specific tasks
2. Order tasks logically (dependencies considered)
3. Include estimated time for each task
4. Group related tasks under milestones
5. For habits, include daily/recurring tasks
6. Be specific and actionable
7. Consider the user's context and constraints

Return JSON with format:
{
  "milestones": [
    {
      "title": "Milestone name",
      "description": "Brief description",
      "targetDate": "YYYY-MM-DD or null",
      "tasks": [
        {
          "title": "Task title",
          "description": "Detailed description",
          "estimatedTime": 30, // minutes
          "priority": "LOW|MEDIUM|HIGH",
          "isRecurring": false,
          "recurrenceRule": null, // or "FREQ=DAILY;INTERVAL=1" for habits
          "tips": "Helpful tips for completing this task"
        }
      ]
    }
  ],
  "habits": [ // If goal type involves habit building
    {
      "title": "Daily habit name",
      "description": "What to do",
      "frequency": "DAILY|WEEKLY",
      "targetPerPeriod": 1,
      "reminderTime": "09:00"
    }
  ],
  "tips": ["General tips for achieving this goal"],
  "warnings": ["Things to watch out for"],
  "resources": ["Helpful resources, links, or tools"]
}`;