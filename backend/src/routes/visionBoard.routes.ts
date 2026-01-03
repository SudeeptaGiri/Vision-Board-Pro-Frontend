import { Router } from 'express';
import { body } from 'express-validator';
import * as visionBoardController from '../controllers/visionBoard.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

// Get all vision boards
router.get('/', visionBoardController.getVisionBoards);

// Get single vision board
router.get('/:id', visionBoardController.getVisionBoard);

// Create vision board
router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('description').optional().trim(),
  ],
  validate,
  visionBoardController.createVisionBoard
);

// Update vision board
router.put('/:id', visionBoardController.updateVisionBoard);

// Delete vision board
router.delete('/:id', visionBoardController.deleteVisionBoard);

// Add item to vision board
router.post(
  '/:id/items',
  upload.single('image'),
  visionBoardController.addVisionItem
);

// Update vision item (position, size, etc.)
router.put('/:boardId/items/:itemId', visionBoardController.updateVisionItem);

// Delete vision item
router.delete('/:boardId/items/:itemId', visionBoardController.deleteVisionItem);

// Upload image
router.post(
  '/upload',
  upload.single('image'),
  visionBoardController.uploadImage
);

export default router;