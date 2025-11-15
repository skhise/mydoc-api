import ExpenseNotificationSettings from '../models/ExpenseNotificationSettings.model.js';
import User from '../models/User.model.js';

// Get or create expense notification settings for a user
export const getExpenseNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // From authMiddleware

    let settings = await ExpenseNotificationSettings.findOne({
      where: { userId },
    });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = await ExpenseNotificationSettings.create({
        userId,
        enabled: true,
        notifyOnAdd: true,
        notifyOnUpdate: true,
        notifyOnDelete: true,
        notifyDailySummary: false,
        dailySummaryTime: '18:00',
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update expense notification settings
export const updateExpenseNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // From authMiddleware
    const { enabled, notifyOnAdd, notifyOnUpdate, notifyOnDelete, notifyDailySummary, dailySummaryTime } = req.body;

    let settings = await ExpenseNotificationSettings.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create new settings if they don't exist
      settings = await ExpenseNotificationSettings.create({
        userId,
        enabled: enabled !== undefined ? enabled : true,
        notifyOnAdd: notifyOnAdd !== undefined ? notifyOnAdd : true,
        notifyOnUpdate: notifyOnUpdate !== undefined ? notifyOnUpdate : true,
        notifyOnDelete: notifyOnDelete !== undefined ? notifyOnDelete : true,
        notifyDailySummary: notifyDailySummary !== undefined ? notifyDailySummary : false,
        dailySummaryTime: dailySummaryTime || '18:00',
      });
    } else {
      // Update existing settings
      await settings.update({
        enabled: enabled !== undefined ? enabled : settings.enabled,
        notifyOnAdd: notifyOnAdd !== undefined ? notifyOnAdd : settings.notifyOnAdd,
        notifyOnUpdate: notifyOnUpdate !== undefined ? notifyOnUpdate : settings.notifyOnUpdate,
        notifyOnDelete: notifyOnDelete !== undefined ? notifyOnDelete : settings.notifyOnDelete,
        notifyDailySummary: notifyDailySummary !== undefined ? notifyDailySummary : settings.notifyDailySummary,
        dailySummaryTime: dailySummaryTime || settings.dailySummaryTime,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense notification settings updated successfully',
      settings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

