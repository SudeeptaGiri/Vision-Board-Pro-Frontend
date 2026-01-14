import { Router } from 'express';
import { body, query } from 'express-validator';
import * as visionBoardController from '../controllers/visionBoard.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== S3 UPLOAD (must be before /:id routes) ====================

// Direct file upload (fallback/legacy endpoint)
router.post(
  '/upload',
  upload.single('file'),
  visionBoardController.directUpload
);

// Get presigned URL for upload
router.post(
  '/upload/presigned-url',
  [
    body('fileType').notEmpty().withMessage('fileType is required'),
    body('fileSize').isNumeric().withMessage('fileSize must be a number'),
    body('visionBoardId').optional().trim(),
  ],
  validate,
  visionBoardController.getPresignedUrl
);

// Confirm upload completed
router.post(
  '/upload/confirm',
  [
    body('key').notEmpty().withMessage('key is required'),
    body('publicUrl').notEmpty().withMessage('publicUrl is required'),
    body('visionBoardId').optional().trim(),
  ],
  validate,
  visionBoardController.confirmUpload
);

// Get user's images
router.get('/upload/my-images', visionBoardController.getMyImages);

// Delete an image
router.delete('/upload/:imageId', visionBoardController.deleteImage);

// ==================== VISION BOARDS ====================

// Get all vision boards
router.get('/', visionBoardController.getVisionBoards);

// Get single vision board
router.get('/:id', visionBoardController.getVisionBoard);

// Create vision board
router.post(
  '/',
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('theme').optional().trim(),
    body('backgroundColor').optional().trim(),
    body('background').optional().trim(),
  ],
  validate,
  visionBoardController.createVisionBoard
);

// Update vision board
router.put('/:id', visionBoardController.updateVisionBoard);

// Delete vision board
router.delete('/:id', visionBoardController.deleteVisionBoard);

// ==================== VISION ITEMS ====================

// Add item to vision board
router.post(
  '/:id/items',
  [
    body('type').isIn(['IMAGE', 'TEXT', 'QUOTE', 'GOAL_CARD']),
    body('title').optional().trim(),
    body('quote').optional().trim(),
    body('imageUrl').optional().trim(),
    body('imageKey').optional().trim(),
    body('goalId').optional().trim(),
    body('positionX').optional().isNumeric(),
    body('positionY').optional().isNumeric(),
    body('width').optional().isNumeric(),
    body('height').optional().isNumeric(),
  ],
  validate,
  visionBoardController.addVisionItem
);

// Update vision item
router.put('/:boardId/items/:itemId', visionBoardController.updateVisionItem);

// Delete vision item
router.delete('/:boardId/items/:itemId', visionBoardController.deleteVisionItem);

export default router;