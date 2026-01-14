import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

// Email verification routes
router.get('/verify-email', authController.verifyEmail);

router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.resendVerification
);

router.get('/me', authenticate, authController.getMe);

router.put(
  '/profile',
  authenticate,
  [body('name').optional().trim().notEmpty()],
  validate,
  authController.updateProfile
);

router.post('/logout', authenticate, authController.logout);

export default router;