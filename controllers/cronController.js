import { runReminderCheck } from '../crons/reminderCron.js';
import { runDailyExpenseSummary } from '../crons/expenseNotificationCron.js';
import cronLogger from '../crons/cronLogger.js';

/**
 * Trigger reminder check cron job
 * This endpoint can be called by shared hosting cron jobs
 */
export const triggerReminderCron = async (req, res) => {
  try {
    cronLogger.info('🔔 Reminder cron triggered via HTTP endpoint', {
      source: 'HTTP',
      ip: req.ip || req.connection.remoteAddress
    });
    await runReminderCheck();
    cronLogger.success('Reminder cron HTTP endpoint completed successfully');
    res.status(200).json({
      success: true,
      message: 'Reminder check completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    cronLogger.error('Error in reminder cron HTTP endpoint', error);
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
    cronLogger.info('💰 Expense summary cron triggered via HTTP endpoint', {
      source: 'HTTP',
      ip: req.ip || req.connection.remoteAddress
    });
    await runDailyExpenseSummary();
    cronLogger.success('Expense summary cron HTTP endpoint completed successfully');
    res.status(200).json({
      success: true,
      message: 'Expense summary check completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    cronLogger.error('Error in expense summary cron HTTP endpoint', error);
    res.status(500).json({
      success: false,
      message: 'Error running expense summary check',
      error: error.message,
    });
  }
};

