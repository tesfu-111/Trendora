import { Router } from 'express';
import { body } from 'express-validator';
import {
  getReports,
  generateReport,
  exportCsvReport,
  deleteReport,
} from '../controllers/reportController.ts';
import { requireAuth, validateRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

router.get('/', getReports);
router.get('/export/csv', exportCsvReport);

router.post(
  '/',
  [
    body('title').trim().isLength({ min: 2, max: 140 }).withMessage('Report title is required'),
    body('reportType').isIn(['weekly', 'monthly', 'followers', 'engagement', 'platform_comparison', 'custom']),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ],
  validateRequest,
  generateReport
);

router.delete('/:id', deleteReport);

export default router;
