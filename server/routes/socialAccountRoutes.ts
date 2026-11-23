import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSocialAccounts,
  createSocialAccount,
  updateSocialAccountById,
  deleteSocialAccountById,
  initiatePlatformOAuth,
  upsertManualAccount,
  disconnectSocialAccount,
  loadSampleWorkspace,
  clearSampleWorkspace,
} from '../controllers/socialAccountController.ts';
import { requireAuth, validateRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

router.get('/', getSocialAccounts);

router.post(
  '/',
  [
    body('platform').isIn(['facebook', 'instagram', 'tiktok', 'youtube', 'x']),
    body('accountName').trim().isLength({ min: 1, max: 100 }).withMessage('Account name is required'),
    body('handle').trim().isLength({ min: 1, max: 100 }).withMessage('Handle is required'),
    body('followers').isNumeric().withMessage('Followers must be numeric'),
    body('likes').isNumeric().withMessage('Likes must be numeric'),
    body('engagementRate').isFloat({ min: 0, max: 100 }).withMessage('Engagement rate must be 0-100'),
  ],
  validateRequest,
  createSocialAccount
);

router.put(
  '/account/:id',
  [
    body('accountName').trim().isLength({ min: 1, max: 100 }).withMessage('Account name is required'),
    body('handle').trim().isLength({ min: 1, max: 100 }).withMessage('Handle is required'),
    body('followers').isNumeric().withMessage('Followers must be numeric'),
    body('likes').isNumeric().withMessage('Likes must be numeric'),
    body('engagementRate').isFloat({ min: 0, max: 100 }).withMessage('Engagement rate must be 0-100'),
  ],
  validateRequest,
  updateSocialAccountById
);

router.delete('/account/:id', deleteSocialAccountById);

router.post('/sample/load', loadSampleWorkspace);
router.delete('/sample/clear', clearSampleWorkspace);
router.post('/:platform/oauth', initiatePlatformOAuth);

router.put(
  '/:platform/manual',
  [
    body('accountName').trim().isLength({ min: 1, max: 100 }).withMessage('Account name is required'),
    body('handle').trim().isLength({ min: 1, max: 100 }).withMessage('Handle is required'),
    body('followers').isNumeric().withMessage('Followers must be numeric'),
    body('likes').isNumeric().withMessage('Likes must be numeric'),
    body('engagementRate').isFloat({ min: 0, max: 100 }).withMessage('Engagement rate must be 0-100'),
  ],
  validateRequest,
  upsertManualAccount
);

router.delete('/:platform', disconnectSocialAccount);

export default router;
