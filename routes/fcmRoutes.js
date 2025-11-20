import express from "express";
import { 
  validateFCMToken, 
  clearAllFCMTokens, 
  getFCMTokenStats, 
  validateAndCleanTokens 
} from "../utils/fcmTokenValidator.js";

const router = express.Router();

/**
 * GET /api/fcm/stats
 * Get statistics about FCM tokens
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await getFCMTokenStats();
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fcm/validate
 * Validate a specific FCM token
 * Body: { token: "fcm-token-here" }
 */
router.post("/validate", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required"
      });
    }

    const result = await validateFCMToken(token);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fcm/clear-all
 * Clear all FCM tokens from database
 * Use this when switching Firebase projects
 */
router.post("/clear-all", async (req, res) => {
  try {
    const result = await clearAllFCMTokens();
    res.status(200).json({
      success: result.success,
      message: `Cleared FCM tokens for ${result.cleared} users`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fcm/validate-and-clean
 * Validate all tokens and clear invalid ones
 * Query: ?dryRun=true to only report without clearing
 */
router.post("/validate-and-clean", async (req, res) => {
  try {
    const dryRun = req.query.dryRun === 'true';
    const result = await validateAndCleanTokens(dryRun);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      dryRun,
      message: dryRun 
        ? `Found ${result.invalid} invalid tokens (dry run - not cleared)`
        : `Cleared ${result.invalid} invalid tokens`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

