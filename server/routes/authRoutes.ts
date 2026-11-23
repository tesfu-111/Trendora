import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.ts';
import { requireAuth, validateRequest } from '../middleware/auth.ts';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

router.post('/logout', requireAuth, logout);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  validateRequest,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').trim().notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
  ],
  validateRequest,
  resetPassword
);

router.get('/me', requireAuth, getMe);

export default router;
