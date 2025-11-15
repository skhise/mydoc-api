import express from 'express';
import {
  getExpenseNotificationSettings,
  updateExpenseNotificationSettings,
} from '../controllers/expenseNotificationSettingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getExpenseNotificationSettings);
router.put('/', updateExpenseNotificationSettings);

export default router;

