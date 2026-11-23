import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  updateProfile,
  uploadAvatar,
  changePassword,
  updatePreferences,
} from '../controllers/userController.ts';
import { requireAuth, validateRequest, apiError } from '../middleware/auth.ts';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and WebP images are permitted'));
    }
  },
});

const router = Router();

router.use(requireAuth);

router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('jobTitle').optional().trim().isLength({ max: 80 }),
    body('company').optional().trim().isLength({ max: 80 }),
  ],
  validateRequest,
  updateProfile
);

router.post(
  '/avatar',
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        apiError(res, err instanceof Error ? err.message : 'Upload failed', 400);
        return;
      }
      next();
    });
  },
  uploadAvatar
);

router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validateRequest,
  changePassword
);

router.put('/preferences', updatePreferences);

export default router;
