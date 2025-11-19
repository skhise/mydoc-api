import cron from 'node-cron';
import admin from './firebase.js';
import { Op } from 'sequelize';
import User from '../models/User.model.js';
import Reminder from '../models/Reminder.model.js';
import moment from 'moment';

// Daily at 6 AM
cron.schedule('0 6 * * *', async () => {
  await runReminderCheck();
});

export async function runReminderCheck() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  try {
    console.log('🔔 Running reminder check cron job...');
    
    // Get all active (non-deleted) reminders
    const reminders = await Reminder.findAll({
      where: {
        deletedAt: null,
        [Op.or]: [
          { date: todayStr },
          { is_repeated: true },
          {
            days_before: {
              [Op.gte]: 0,
            },
          },
        ],
      },
    });

    console.log(`Found ${reminders.length} reminders to check`);

    for (const r of reminders) {
      const reminderDateStr = moment(r.date).format('YYYY-MM-DD');
      const reminderDate = new Date(r.date);
      const todayOnly = new Date(today.toDateString());
      const reminderDateOnly = new Date(reminderDate.toDateString());

      const diffDays = Math.floor(
        (reminderDateOnly - todayOnly) / (1000 * 60 * 60 * 24)
      );

      // Check if reminder should be sent today
      let shouldSend = false;
      
      if (reminderDateStr === todayStr) {
        // Exact match - send today
        shouldSend = true;
      } else if (r.days_before > 0 && diffDays === r.days_before) {
        // Send X days before the reminder date
        shouldSend = true;
      } else if (r.is_repeated) {
        // For repeated reminders, check if it's the same day of month
        const reminderDay = reminderDate.getDate();
        const todayDay = today.getDate();
        if (reminderDay === todayDay) {
          shouldSend = true;
        }
      }

      if (shouldSend) {
        // Get user (only if not soft-deleted)
        const user = await User.findOne({
          where: {
            id: r.created_by,
            deletedAt: null,
          },
        });
        
        if (user?.fcmToken) {
          console.log(`Sending reminder notification to user ${user.id}: ${r.name}`);
          await sendNotification(user.fcmToken, r.name, r.description);
        } else {
          console.log(`User ${r.created_by} not found or has no FCM token`);
        }
      }
    }

    console.log('✅ Reminder check completed');
  } catch (err) {
    console.error('❌ Error in reminder cron:', err);
  }
}

// At the bottom of reminderCron.js
// (async () => {
//   console.log('🔁 Running reminder test manually...');
//   await runReminderCheck();
// })();


async function sendNotification(token, title, body) {
  const message = {
    token,
    data: {
      title,
      body,
      type: 'reminder',
      timestamp: new Date().toISOString(),
    },
    android: {
      priority: 'high',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          contentAvailable: true,
        },
      },
    },
  };

  try {
    await admin.messaging().send(message);
    console.log(`✅ Reminder notification sent: ${title}`);
  } catch (err) {
    console.error(`❌ Error sending reminder notification:`, err);
  }
}
