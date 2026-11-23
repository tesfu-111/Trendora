import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDashboardOverview,
  getAnalyticsCharts,
  recordMetricSnapshot,
} from '../controllers/analyticsController.ts';
import { requireAuth, validateRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

router.get('/overview', getDashboardOverview);
router.get('/charts', getAnalyticsCharts);

router.post(
  '/snapshot',
  [
    body('platform').isIn(['facebook', 'instagram', 'tiktok', 'youtube', 'x']),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('followers').isNumeric().withMessage('Followers must be a number'),
    body('likes').isNumeric().withMessage('Likes must be a number'),
    body('comments').isNumeric().withMessage('Comments must be a number'),
    body('shares').isNumeric().withMessage('Shares must be a number'),
  ],
  validateRequest,
  recordMetricSnapshot
);

export default router;
