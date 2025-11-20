/**
 * FCM Token Validator Utility
 * Helps diagnose and fix SenderId mismatch issues
 */

import admin from '../crons/firebase.js';
import User from '../models/User.model.js';
import { Op } from 'sequelize';

/**
 * Validate a single FCM token by checking its format and project compatibility
 * Note: We can't fully validate without attempting to send, so this checks format
 * @param {string} token - FCM token to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateFCMToken(token) {
  if (!token) {
    return { valid: false, error: 'Token is empty' };
  }

  // Basic format validation
  if (token.length < 100) {
    return { valid: false, error: 'Token format appears invalid (too short)' };
  }

  // We can't fully validate without attempting to send
  // The actual validation happens when we try to send notifications
  // This function is mainly for format checking
  return { valid: true, note: 'Format check passed. Full validation requires send attempt.' };
}

/**
 * Clear all FCM tokens from database
 * Use this when switching Firebase projects or when tokens are invalid
 */
export async function clearAllFCMTokens() {
  try {
    const result = await User.update(
      { fcmToken: null },
      { 
        where: { 
          fcmToken: { [Op.ne]: null },
          deletedAt: null 
        } 
      }
    );
    console.log(`✅ Cleared FCM tokens for ${result[0]} users`);
    return { success: true, cleared: result[0] };
  } catch (error) {
    console.error('❌ Error clearing FCM tokens:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get statistics about FCM tokens in the database
 */
export async function getFCMTokenStats() {
  try {
    const totalUsers = await User.count({ where: { deletedAt: null } });
    const usersWithTokens = await User.count({ 
      where: { 
        fcmToken: { [Op.ne]: null },
        deletedAt: null 
      } 
    });
    const usersWithoutTokens = totalUsers - usersWithTokens;

    return {
      totalUsers,
      usersWithTokens,
      usersWithoutTokens,
      percentageWithTokens: totalUsers > 0 ? ((usersWithTokens / totalUsers) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('❌ Error getting FCM token stats:', error);
    return { error: error.message };
  }
}

/**
 * Validate all FCM tokens in the database and clear invalid ones
 * @param {boolean} dryRun - If true, only report issues without clearing tokens
 */
export async function validateAndCleanTokens(dryRun = false) {
  try {
    const users = await User.findAll({
      where: {
        fcmToken: { [Op.ne]: null },
        deletedAt: null
      },
      attributes: ['id', 'name', 'fcmToken']
    });

    console.log(`\n🔍 Validating ${users.length} FCM tokens...`);
    const results = {
      total: users.length,
      valid: 0,
      invalid: 0,
      errors: []
    };

    // Note: We can't fully validate tokens without attempting to send
    // This function is mainly for getting stats and clearing all tokens if needed
    // Actual validation happens when notifications are sent and errors are caught
    console.log(`\n⚠️  Note: Full token validation requires attempting to send notifications.`);
    console.log(`   This function provides token statistics. Invalid tokens will be`);
    console.log(`   automatically cleared when notification sending fails.\n`);

    for (const user of users) {
      const validation = await validateFCMToken(user.fcmToken);
      if (validation.valid) {
        results.valid++;
        console.log(`✅ User ${user.id} (${user.name}): Token format is valid`);
      } else {
        results.invalid++;
        results.errors.push({
          userId: user.id,
          userName: user.name,
          error: validation.error
        });
        console.log(`❌ User ${user.id} (${user.name}): ${validation.error}`);

        if (!dryRun) {
          // Clear invalid token
          await User.update(
            { fcmToken: null },
            { where: { id: user.id } }
          );
          console.log(`   🗑️  Cleared invalid token for user ${user.id}`);
        }
      }
    }

    console.log(`\n📊 Validation Results:`);
    console.log(`   Total: ${results.total}`);
    console.log(`   Valid: ${results.valid}`);
    console.log(`   Invalid: ${results.invalid}`);
    
    if (dryRun) {
      console.log(`\n⚠️  DRY RUN - No tokens were cleared. Run without dryRun=true to clear invalid tokens.`);
    }

    return results;
  } catch (error) {
    console.error('❌ Error validating tokens:', error);
    return { error: error.message };
  }
}

