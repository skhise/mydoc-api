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
  const todayStr = today.toISOString().split('T')[0];
  try {
    const reminders = await Reminder.findAll({
      where: {
        [Op.or]: [
          { date: todayStr },
          { is_repeated: true },
          {
            days_before: {
              [Op.gt]: 0,
            },
          },
        ],
      },
    });

    for (const r of reminders) {
const reminderDateStr = moment(r.date).format('YYYY-MM-DD');
const reminderDate = new Date(r.date);
const todayOnly = new Date(today.toDateString());
const reminderDateOnly = new Date(reminderDate.toDateString());

const diffDays = Math.floor(
  (reminderDateOnly - todayOnly) / (1000 * 60 * 60 * 24)
);
const shouldSend =
  reminderDateStr === todayStr;

      if (shouldSend) {
        const user = await User.findByPk(r.created_by);
        if (user?.fcm_token) {
          await sendNotification(user.fcm_token, r.name, r.description);
        }
      }
    }

  } catch (err) {
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
    notification: { title, body }
  };

  try {
    await admin.messaging().send(message);
  } catch (err) {
  }
}
