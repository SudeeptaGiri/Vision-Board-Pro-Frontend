import { Router } from 'express';
import { body, query } from 'express-validator';
import * as habitController from '../controllers/habit.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Get all habits
router.get('/', habitController.getHabits);

// Get habit with logs
router.get('/:id', habitController.getHabit);

// Get habit stats
router.get('/:id/stats', habitController.getHabitStats);

// Create habit
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('frequency').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
    body('targetPerPeriod').optional().isInt({ min: 1 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    body('reminderTime').optional({ checkFalsy: true }).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  ],
  validate,
  habitController.createHabit
);

// Update habit
router.put('/:id', habitController.updateHabit);

// Log habit completion
router.post(
  '/:id/log',
  [
    body('date').isISO8601(),
    body('completed').isBoolean(),
    body('notes').optional().trim(),
  ],
  validate,
  habitController.logHabit
);

// Get streaks
router.get('/streaks/all', habitController.getAllStreaks);

// Delete habit
router.delete('/:id', habitController.deleteHabit);

export default router;