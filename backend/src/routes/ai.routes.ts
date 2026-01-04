import { Router } from 'express';
import { body } from 'express-validator';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Get questionnaire for goal type
router.post(
  '/questionnaire',
  [
    body('goalType').isIn(['ACHIEVEMENT', 'LEARNING', 'HEALTH', 'HABIT', 'FINANCIAL', 'CAREER', 'PERSONAL']),
    body('goalTitle').trim().notEmpty(),
  ],
  validate,
  aiController.getQuestionnaire
);

// Generate plan from answers
router.post(
  '/generate-plan',
  [
    body('goalId').isString(),
    body('answers').isObject(),
  ],
  validate,
  aiController.generatePlan
);

// Get task suggestions
router.post(
  '/suggest-tasks',
  [
    body('goalId').isString(),
    body('context').optional().isString(),
  ],
  validate,
  aiController.suggestTasks
);

// Get motivational message
router.get('/motivation/:goalId', aiController.getMotivation);

// ============= New Agent-Powered Endpoints =============

// Classify a goal (determine category, complexity, if habit-based)
router.post(
  '/classify-goal',
  [body('goalTitle').trim().notEmpty()],
  validate,
  aiController.classifyGoal
);

// Process a new goal (classify + generate questions in one call)
router.post(
  '/process-goal',
  [body('goalTitle').trim().notEmpty()],
  validate,
  aiController.processGoal
);

// Analyze progress on a goal
router.get('/analyze-progress/:goalId', aiController.analyzeProgress);

// Estimate timeline for a goal
router.post(
  '/estimate-timeline',
  [
    body('goalId').isString(),
    body('hoursPerWeek').optional().isNumeric(),
  ],
  validate,
  aiController.estimateTimeline
);

// Orchestrate - determine what action to take based on user message
router.post(
  '/orchestrate',
  [
    body('message').trim().notEmpty(),
    body('goalId').optional().isString(),
  ],
  validate,
  aiController.orchestrate
);

export default router;