/**
 * Test Notification Script
 * 
 * This file can be used to test FCM notifications
 * Run with: node crons/testNotification.js
 * Or import and call from an API endpoint
 */

import admin from './firebase.js';
import User from '../models/User.model.js';
import cronLogger from './cronLogger.js';
import { Op } from 'sequelize';

/**
 * Send a test notification to a specific user by ID
 * @param {number} userId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendTestNotificationToUser(userId, title = 'Test Notification', body = 'This is a test notification from the server') {
  try {
    cronLogger.info(`🧪 Sending test notification to user ${userId}...`);

    // Get user with FCM token
    const user = await User.findOne({
      where: {
        id: userId,
        deletedAt: null,
      },
      attributes: ['id', 'name', 'fcmToken'],
    });

    if (!user) {
      const error = `User ${userId} not found`;
      cronLogger.error(error);
      return { success: false, message: error };
    }

    if (!user.fcmToken) {
      const error = `User ${userId} (${user.name}) has no FCM token`;
      cronLogger.warn(error);
      return { success: false, message: error };
    }

    cronLogger.info(`Found user: ${user.name}, Token: ${user.fcmToken.substring(0, 20)}...`);

    // Create notification message
    const message = {
      token: user.fcmToken,
      data: {
        title,
        body,
        type: 'test',
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
            alert: {
              title,
              body,
            },
          },
        },
      },
    };

    // Send notification
    const response = await admin.messaging().send(message);
    
    cronLogger.success(`Test notification sent successfully to user ${userId} (${user.name})`, {
      userId: user.id,
      userName: user.name,
      messageId: response,
      title,
      body
    });

    return {
      success: true,
      message: `Test notification sent to user ${user.name} (ID: ${userId})`,
      messageId: response,
    };
  } catch (error) {
    cronLogger.error(`Error sending test notification to user ${userId}`, error);
    
    // Handle specific error types
    let errorMessage = error.message || 'Unknown error';
    let shouldClearToken = false;

    if (error.code === 'messaging/invalid-argument' || 
        error.code === 'messaging/registration-token-not-registered' ||
        error.message?.includes('SenderId') || 
        error.message?.includes('sender-id') ||
        error.message?.includes('Invalid registration token')) {
      
      errorMessage = `Invalid FCM token (SenderId mismatch or invalid token): ${error.message}`;
      shouldClearToken = true;
      
      cronLogger.error('SenderId mismatch detected', {
        errorCode: error.code,
        errorMessage: error.message,
        userId,
        projectId: 'itsmyapp-b2f53',
        projectNumber: '797229091241',
      });
    }

    // Clear invalid token if needed
    if (shouldClearToken) {
      try {
        await User.update(
          { fcmToken: null },
          { where: { id: userId } }
        );
        cronLogger.warn(`Cleared invalid FCM token for user ${userId}`);
        errorMessage += ' (Token cleared from database)';
      } catch (updateError) {
        cronLogger.error(`Error clearing invalid token for user ${userId}`, updateError);
      }
    }

    return {
      success: false,
      message: errorMessage,
      errorCode: error.code,
    };
  }
}

/**
 * Send test notification to all users with FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Promise<{success: number, failed: number, results: Array}>}
 */
export async function sendTestNotificationToAllUsers(title = 'Test Notification', body = 'This is a test notification from the server') {
  try {
    cronLogger.info('🧪 Sending test notifications to all users...');

    // Get all users with FCM tokens
    const users = await User.findAll({
      where: {
        fcmToken: { [Op.ne]: null },
        deletedAt: null,
      },
      attributes: ['id', 'name', 'fcmToken'],
    });

    if (users.length === 0) {
      const message = 'No users with FCM tokens found';
      cronLogger.warn(message);
      return {
        success: 0,
        failed: 0,
        total: 0,
        message,
        results: [],
      };
    }

    cronLogger.info(`Found ${users.length} users with FCM tokens`);

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    // Send to each user
    for (const user of users) {
      const result = await sendTestNotificationToUser(user.id, title, body);
      results.push({
        userId: user.id,
        userName: user.name,
        ...result,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    cronLogger.success(`Test notifications completed`, {
      total: users.length,
      success: successCount,
      failed: failedCount,
    });

    return {
      success: successCount,
      failed: failedCount,
      total: users.length,
      results,
    };
  } catch (error) {
    cronLogger.error('Error sending test notifications to all users', error);
    return {
      success: 0,
      failed: 0,
      total: 0,
      error: error.message,
      results: [],
    };
  }
}

/**
 * Send test notification to a user by mobile number
 * @param {string} mobile - User mobile number
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendTestNotificationByMobile(mobile, title = 'Test Notification', body = 'This is a test notification from the server') {
  try {
    cronLogger.info(`🧪 Sending test notification to user with mobile ${mobile}...`);

    const user = await User.findOne({
      where: {
        mobile,
        deletedAt: null,
      },
      attributes: ['id', 'name', 'fcmToken'],
    });

    if (!user) {
      const error = `User with mobile ${mobile} not found`;
      cronLogger.error(error);
      return { success: false, message: error };
    }

    return await sendTestNotificationToUser(user.id, title, body);
  } catch (error) {
    cronLogger.error(`Error sending test notification to mobile ${mobile}`, error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Get list of users with FCM tokens (for testing)
 * @returns {Promise<Array>}
 */
export async function getUsersWithTokens() {
  try {
    const users = await User.findAll({
      where: {
        fcmToken: { [Op.ne]: null },
        deletedAt: null,
      },
      attributes: ['id', 'name', 'mobile', 'fcmToken'],
      order: [['id', 'ASC']],
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      hasToken: !!user.fcmToken,
      tokenPreview: user.fcmToken ? user.fcmToken.substring(0, 20) + '...' : null,
    }));
  } catch (error) {
    cronLogger.error('Error getting users with tokens', error);
    return [];
  }
}

// If running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      console.log('🧪 Test Notification Script');
      console.log('==========================\n');

      // Get users with tokens
      const users = await getUsersWithTokens();
      console.log(`Found ${users.length} users with FCM tokens:\n`);
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Name: ${user.name}, Mobile: ${user.mobile || 'N/A'}`);
      });

      if (users.length === 0) {
        console.log('\n❌ No users with FCM tokens found. Please register tokens first.');
        process.exit(1);
      }

      // Send test to first user
      console.log(`\n📤 Sending test notification to first user (ID: ${users[0].id})...\n`);
      const result = await sendTestNotificationToUser(
        users[0].id,
        '🧪 Test Notification',
        'This is a test notification sent from the server. If you receive this, your FCM setup is working correctly!'
      );

      if (result.success) {
        console.log(`\n✅ ${result.message}`);
        console.log(`   Message ID: ${result.messageId}`);
      } else {
        console.log(`\n❌ ${result.message}`);
        if (result.errorCode) {
          console.log(`   Error Code: ${result.errorCode}`);
        }
      }
    } catch (error) {
      console.error('❌ Error running test:', error);
      process.exit(1);
    }
  })();
}

