import express from "express";
import { triggerReminderCron, triggerExpenseSummaryCron } from "../controllers/cronController.js";

const router = express.Router();

// Middleware to check for secret key (optional but recommended for security)
const validateCronSecret = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET_KEY || 'your-secret-key-change-this';
  const providedSecret = req.query.secret || req.headers['x-cron-secret'];
  
  if (providedSecret && providedSecret === cronSecret) {
    return next();
  }
  
  // Allow without secret for now, but you should set CRON_SECRET_KEY in production
  // Uncomment the line below to require secret key:
  // return res.status(401).json({ success: false, message: 'Unauthorized: Invalid secret key' });
  
  next();
};

// Endpoint to trigger reminder cron job
// Usage: GET /api/cron/reminder-check?secret=your-secret-key
router.get("/reminder-check", validateCronSecret, triggerReminderCron);

// Endpoint to trigger expense summary cron job
// Usage: GET /api/cron/expense-summary?secret=your-secret-key
router.get("/expense-summary", validateCronSecret, triggerExpenseSummaryCron);

export default router;

