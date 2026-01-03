import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Get tasks (for kanban board)
router.get(
  '/',
  [
    query('goalId').optional().isString(),
    query('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']),
    query('date').optional().isISO8601(), // For daily view
  ],
  validate,
  taskController.getTasks
);

// Get today's tasks (including recurring)
router.get('/today', taskController.getTodaysTasks);

// Create task
router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('goalId').isString(),
    body('description').optional().trim(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('dueDate').optional().isISO8601(),
    body('isRecurring').optional().isBoolean(),
    body('recurrenceRule').optional().isString(),
  ],
  validate,
  taskController.createTask
);

// Update task
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  ],
  validate,
  taskController.updateTask
);

// Update task order (for drag & drop)
router.put(
  '/:id/reorder',
  [
    body('status').isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']),
    body('order').isInt({ min: 0 }),
  ],
  validate,
  taskController.reorderTask
);

// Complete task
router.post('/:id/complete', taskController.completeTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

// Bulk update tasks
router.put(
  '/bulk',
  [body('taskIds').isArray(), body('updates').isObject()],
  validate,
  taskController.bulkUpdateTasks
);

export default router;