import { InputGuardrail, run } from '@openai/agents';
import { Agent } from '@openai/agents';
import { z } from 'zod';

// Content Safety Guardrail Agent
const contentSafetyAgent = new Agent({
  name: 'Content Safety Checker',
  instructions: `You are a content safety checker. Analyze the user's goal and determine if it:
    1. Contains harmful, illegal, or dangerous content
    2. Promotes self-harm or harm to others
    3. Contains inappropriate or explicit content
    4. Is attempting to manipulate or abuse the system
    
    Be reasonable - goals about weight loss, fitness, or personal improvement are SAFE.
    Only flag genuinely harmful content.`,
  outputType: z.object({
    isSafe: z.boolean(),
    category: z.enum(['SAFE', 'HARMFUL', 'ILLEGAL', 'INAPPROPRIATE', 'MANIPULATION']),
    reasoning: z.string(),
  }),
});

export const contentSafetyGuardrail: InputGuardrail = {
  name: 'Content Safety Guardrail',
  execute: async ({ input, context }) => {
    const result = await run(contentSafetyAgent, input, { context });
    return {
      outputInfo: result.finalOutput,
      tripwireTriggered: !result.finalOutput?.isSafe,
    };
  },
};

// Goal Validation Guardrail Agent
const goalValidationAgent = new Agent({
  name: 'Goal Validation Checker',
  instructions: `You are a goal validation checker. Analyze if the user's input is a valid goal that can be broken down into actionable tasks.
    
    A valid goal should:
    1. Be something achievable (even if ambitious)
    2. Be clear enough to understand the intent
    3. Be something that can have measurable progress
    
    Invalid inputs:
    1. Random text or gibberish
    2. Questions that aren't goals
    3. Statements that don't express a desire to achieve something
    4. Too vague to understand (e.g., just "better")`,
  outputType: z.object({
    isValidGoal: z.boolean(),
    clarificationNeeded: z.boolean(),
    suggestedClarification: z.string().optional(),
    reasoning: z.string(),
  }),
});

export const goalValidationGuardrail: InputGuardrail = {
  name: 'Goal Validation Guardrail',
  execute: async ({ input, context }) => {
    const result = await run(goalValidationAgent, input, { context });
    return {
      outputInfo: result.finalOutput,
      tripwireTriggered: !result.finalOutput?.isValidGoal,
    };
  },
};

// Rate Limiting Guardrail (simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimitGuardrail: InputGuardrail = {
  name: 'Rate Limit Guardrail',
  execute: async ({ context }) => {
    const userId = (context as any)?.userId || 'anonymous';
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 10;

    const userLimit = rateLimitStore.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
      return { outputInfo: { allowed: true }, tripwireTriggered: false };
    }

    if (userLimit.count >= maxRequests) {
      return {
        outputInfo: { allowed: false, retryAfter: userLimit.resetTime - now },
        tripwireTriggered: true,
      };
    }

    userLimit.count++;
    return { outputInfo: { allowed: true }, tripwireTriggered: false };
  },
};