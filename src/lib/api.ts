import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============= AI Agent API Functions =============

export interface GoalClassification {
  category: string;
  subcategory: string;
  isHabitBased: boolean;
  requiresRecurringTasks: boolean;
  estimatedComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY_COMPLEX';
  confidence: number;
  reasoning: string;
}

export interface ProgressAnalysis {
  overallProgress: number;
  tasksCompleted: number;
  totalTasks: number;
  currentPhase: string;
  onTrack: boolean;
  daysAhead: number;
  daysBehind: number;
  strengths: string[];
  areasForImprovement: string[];
  nextRecommendedActions: string[];
  motivationalInsight: string;
  adjustedTimeline?: string;
}

export interface TimelineEstimate {
  recommendedStartDate: string;
  estimatedCompletionDate: string;
  totalDurationWeeks: number;
  weeklyCommitmentHours: number;
  schedule: Array<{
    week: number;
    focus: string;
    tasks: string[];
    expectedProgress: number;
  }>;
  adjustmentSuggestions: string[];
}

export interface OrchestratorResult {
  action: string;
  reasoning: string;
  additionalContext?: Record<string, any>;
}

// Classify a goal to determine its category and complexity
export const classifyGoal = async (goalTitle: string): Promise<{ classification: GoalClassification }> => {
  const response = await api.post('/ai/classify-goal', { goalTitle });
  return response.data;
};

// Process a goal - classify and generate questions in one call
export const processGoal = async (goalTitle: string): Promise<{
  classification: GoalClassification;
  questionnaire: Array<{
    id: string;
    question: string;
    type: 'text' | 'select' | 'number' | 'date' | 'multiselect';
    options?: string[];
    required: boolean;
  }>;
  suggestedGoalType: string;
}> => {
  const response = await api.post('/ai/process-goal', { goalTitle });
  return response.data;
};

// Analyze progress on a goal
export const analyzeProgress = async (goalId: string): Promise<{ analysis: ProgressAnalysis }> => {
  const response = await api.get(`/ai/analyze-progress/${goalId}`);
  return response.data;
};

// Estimate timeline for a goal
export const estimateTimeline = async (
  goalId: string,
  hoursPerWeek?: number
): Promise<{ timeline: TimelineEstimate }> => {
  const response = await api.post('/ai/estimate-timeline', { goalId, hoursPerWeek });
  return response.data;
};

// Orchestrate - determine what action to take based on user message
export const orchestrate = async (
  message: string,
  goalId?: string
): Promise<OrchestratorResult> => {
  const response = await api.post('/ai/orchestrate', { message, goalId });
  return response.data;
};

// Get motivational message for a goal
export const getMotivation = async (goalId: string): Promise<{ message: string; progress: number }> => {
  const response = await api.get(`/ai/motivation/${goalId}`);
  return response.data;
};