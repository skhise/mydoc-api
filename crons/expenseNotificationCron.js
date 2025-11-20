import cron from 'node-cron';
import admin from './firebase.js';
import { Op } from 'sequelize';
import User from '../models/User.model.js';
import Expense from '../models/Expense.model.js';
import Project from '../models/Project.model.js';
import ExpenseNotificationSettings from '../models/ExpenseNotificationSettings.model.js';
import cronLogger from './cronLogger.js';

// Run daily at the user's configured time (default 6 PM)
// This cron runs every hour and checks if it's time to send daily summaries
cron.schedule('0 * * * *', async () => {
  await runDailyExpenseSummary();
});

export async function runDailyExpenseSummary() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    cronLogger.info(`💰 Running daily expense summary check at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`, {
      hour: currentHour,
      minute: currentMinute
    });

    // Get all users with daily summary enabled (excluding soft-deleted users)
    const settings = await ExpenseNotificationSettings.findAll({
      where: {
        enabled: true,
        notifyDailySummary: true,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'fcmToken'],
          required: true,
          where: {
            deletedAt: null,
          },
        },
      ],
    });

    cronLogger.info(`Found ${settings.length} users with daily summary enabled`, {
      userCount: settings.length
    });

    for (const setting of settings) {
      if (!setting.user || !setting.user.fcmToken) {
        cronLogger.warn(`Skipping setting ${setting.id} - user not found or no FCM token`, {
          settingId: setting.id,
          userId: setting.userId
        });
        continue;
      }

      // Parse the dailySummaryTime (format: "HH:MM")
      const [summaryHour, summaryMinute] = (setting.dailySummaryTime || '18:00').split(':').map(Number);

      // Check if it's time to send the summary
      if (currentHour === summaryHour && currentMinute === 0) {
        cronLogger.info(`Sending daily summary to user ${setting.user.id} at ${summaryHour}:00`, {
          userId: setting.user.id,
          summaryTime: `${summaryHour}:00`
        });
        await sendDailyExpenseSummary(setting.user.id, setting.user.fcmToken);
      }
    }
    
    cronLogger.success('Daily expense summary check completed', {
      checkedUsers: settings.length,
      time: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`
    });
  } catch (err) {
    cronLogger.error('Error in daily expense summary cron', err);
  }
}

async function sendDailyExpenseSummary(userId, fcmToken) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all expenses for today where this user paid
    const expenses = await Expense.findAll({
      where: {
        paidBy: userId,
        deletedAt: null,
        date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (expenses.length === 0) {
      // Send a message that no expenses were added today
      const message = {
        token: fcmToken,
        notification: {
          title: 'Daily Expense Summary',
          body: 'No expenses were added today.',
        },
      };
      await admin.messaging().send(message);
      return;
    }

    // Calculate total
    const total = expenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount);
    }, 0);

    // Create summary message
    const expenseCount = expenses.length;
    const projectNames = [...new Set(expenses.map(e => e.project?.name || 'Unknown'))].join(', ');

    const title = 'Daily Expense Summary';
    const body = `You added ${expenseCount} expense${expenseCount > 1 ? 's' : ''} today totaling ₹${total.toFixed(2)}. Projects: ${projectNames}`;

    const message = {
      token: fcmToken,
      notification: { title, body },
    };

    await admin.messaging().send(message);
    cronLogger.success(`Daily expense summary sent to user ${userId}`, {
      userId,
      expenseCount,
      totalAmount: total.toFixed(2)
    });
  } catch (error) {
    cronLogger.error(`Error sending daily expense summary to user ${userId}`, error);
  }
}

