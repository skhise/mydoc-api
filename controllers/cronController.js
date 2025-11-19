import { runReminderCheck } from '../crons/reminderCron.js';
import { runDailyExpenseSummary } from '../crons/expenseNotificationCron.js';

/**
 * Trigger reminder check cron job
 * This endpoint can be called by shared hosting cron jobs
 */
export const triggerReminderCron = async (req, res) => {
  try {
    console.log('🔔 Reminder cron triggered via HTTP endpoint');
    await runReminderCheck();
    res.status(200).json({
      success: true,
      message: 'Reminder check completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in reminder cron endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error running reminder check',
      error: error.message,
    });
  }
};

/**
 * Trigger expense summary cron job
 * This endpoint can be called by shared hosting cron jobs
 */
export const triggerExpenseSummaryCron = async (req, res) => {
  try {
    console.log('💰 Expense summary cron triggered via HTTP endpoint');
    await runDailyExpenseSummary();
    res.status(200).json({
      success: true,
      message: 'Expense summary check completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in expense summary cron endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error running expense summary check',
      error: error.message,
    });
  }
};

