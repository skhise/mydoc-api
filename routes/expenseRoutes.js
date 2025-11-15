import express from 'express';
import {
  createExpense,
  listExpenses,
  getExpenseById,
  getSignedExpenseFileUrl,
  validateCreateExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import multer from 'multer';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(authenticateToken);

router.post('/', upload.single('file'), validateCreateExpense, createExpense);
router.get('/', listExpenses);
router.get('/file/get-signed-url', getSignedExpenseFileUrl);
router.get('/:id', getExpenseById);
router.put('/:id', upload.single('file'), updateExpense);
router.delete('/:id', deleteExpense);

export default router;

