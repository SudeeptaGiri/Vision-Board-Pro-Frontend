import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as goalController from '../controllers/goal.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all goals with filters
router.get(
  '/',
  [
    query('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ABANDONED']),
    query('type').optional().isIn(['ACHIEVEMENT', 'LEARNING', 'HEALTH', 'HABIT', 'FINANCIAL', 'CAREER', 'PERSONAL']),
    query('categoryId').optional().isString(),
  ],
  validate,
  goalController.getGoals
);

// Get single goal with all details
router.get('/:id', goalController.getGoal);

// Create new goal
router.post(
  '/',
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim(),
    body('type').isIn(['ACHIEVEMENT', 'LEARNING', 'HEALTH', 'HABIT', 'FINANCIAL', 'CAREER', 'PERSONAL']),
    body('targetDate').optional().isISO8601(),
    body('categoryId').optional().isString(),
  ],
  validate,
  goalController.createGoal
);

// Update goal
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ABANDONED']),
    body('targetDate').optional().isISO8601(),
  ],
  validate,
  goalController.updateGoal
);

// Delete goal
router.delete('/:id', goalController.deleteGoal);

// Submit questionnaire answers and generate plan
router.post(
  '/:id/generate-plan',
  [body('answers').isObject()],
  validate,
  goalController.generatePlan
);

// Get goal progress and stats
router.get('/:id/progress', goalController.getGoalProgress);

export default router;