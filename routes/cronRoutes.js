import express from "express";
import { triggerReminderCron, triggerExpenseSummaryCron } from "../controllers/cronController.js";
import { 
  sendTestNotificationToUser, 
  sendTestNotificationToAllUsers,
  sendTestNotificationByMobile,
  getUsersWithTokens 
} from "../crons/testNotification.js";

const router = express.Router();

// Middleware to check for secret key (optional but recommended for security)
const validateCronSecret = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET_KEY || 'itesmenotitsyou';
  const providedSecret = req.query.secret || req.headers['x-cron-secret'];
  
  if (providedSecret && providedSecret === cronSecret) {
    return next();
  }
  
  // Allow without secret for now, but you should set CRON_SECRET_KEY in production
  // Uncomment the line below to require secret key:
  // return res.status(401).json({ success: false, message: 'Unauthorized: Invalid secret key' });
  
  next();
};

// Health check endpoint (no secret required for testing)
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cron endpoints are accessible",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint to trigger reminder cron job
// Usage: GET /api/cron/reminder-check?secret=your-secret-key
router.get("/reminder-check", validateCronSecret, triggerReminderCron);

// Endpoint to trigger expense summary cron job
// Usage: GET /api/cron/expense-summary?secret=your-secret-key
router.get("/expense-summary", validateCronSecret, triggerExpenseSummaryCron);

// Test notification endpoints
// Get list of users with FCM tokens
router.get("/test-notification/users", validateCronSecret, async (req, res) => {
  try {
    const users = await getUsersWithTokens();
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test notification to a specific user by ID
// Usage: POST /api/cron/test-notification/user/1?secret=your-secret-key
// Body: { "title": "Custom Title", "body": "Custom Body" } (optional)
router.post("/test-notification/user/:userId", validateCronSecret, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { title, body } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID"
      });
    }

    const result = await sendTestNotificationToUser(
      userId,
      title || 'Test Notification',
      body || 'This is a test notification from the server'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test notification to a user by mobile number
// Usage: POST /api/cron/test-notification/mobile/1234567890?secret=your-secret-key
// Body: { "title": "Custom Title", "body": "Custom Body" } (optional)
router.post("/test-notification/mobile/:mobile", validateCronSecret, async (req, res) => {
  try {
    const { mobile } = req.params;
    const { title, body } = req.body;

    const result = await sendTestNotificationByMobile(
      mobile,
      title || 'Test Notification',
      body || 'This is a test notification from the server'
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test notification to all users with FCM tokens
// Usage: POST /api/cron/test-notification/all?secret=your-secret-key
// Body: { "title": "Custom Title", "body": "Custom Body" } (optional)
router.post("/test-notification/all", validateCronSecret, async (req, res) => {
  try {
    const { title, body } = req.body;

    const result = await sendTestNotificationToAllUsers(
      title || 'Test Notification',
      body || 'This is a test notification from the server'
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

