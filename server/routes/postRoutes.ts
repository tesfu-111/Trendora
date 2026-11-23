import { Router } from 'express';
import { body } from 'express-validator';
import { getPosts, createPost, deletePost } from '../controllers/postController.ts';
import { requireAuth, validateRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

router.get('/', getPosts);

router.post(
  '/',
  [
    body('platform').isIn(['facebook', 'instagram', 'tiktok', 'youtube', 'x']),
    body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Post title is required'),
    body('likes').isNumeric(),
    body('comments').isNumeric(),
    body('shares').isNumeric(),
  ],
  validateRequest,
  createPost
);

router.delete('/:id', deletePost);

export default router;
