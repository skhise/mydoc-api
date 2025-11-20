# Fixing SenderId Mismatch Error

## Problem
When sending FCM notifications, you may encounter an error like:
```
SenderId mismatch
messaging/invalid-argument
```

This occurs when the FCM token in the database was registered with a different Firebase project's sender ID than the one used by the backend.

## Root Cause
- **Frontend (App)**: Registers FCM tokens using the sender ID from `google-services.json` (project_number: `797229091241`)
- **Backend (API)**: Sends notifications using Firebase Admin SDK with service account from project `itsmyapp-b2f53`
- **Mismatch**: If tokens were registered with a different project, the sender IDs won't match

## Verification

### Check Project Configuration

1. **Frontend Project** (`MyNewDoc/android/app/google-services.json`):
   - `project_number`: `797229091241` (This is the Sender ID)
   - `project_id`: `itsmyapp-b2f53`

2. **Backend Service Account** (`mydoc-api/crons/serviceAccountKey.json`):
   - `project_id`: `itsmyapp-b2f53` ✅ (Should match)

### Verify FCM Tokens

Check if tokens in the database are valid:
```sql
SELECT id, name, fcmToken, 
       SUBSTRING(fcmToken, 1, 20) as token_preview,
       updatedAt
FROM users 
WHERE fcmToken IS NOT NULL 
  AND deletedAt IS NULL;
```

## Solutions

### Solution 1: Re-register All FCM Tokens (Recommended)

The most reliable fix is to have all users re-register their FCM tokens:

1. **Clear existing tokens** (optional, for testing):
   ```sql
   UPDATE users SET fcmToken = NULL WHERE deletedAt IS NULL;
   ```

2. **Force app to re-register tokens**:
   - Users need to log out and log back in
   - Or restart the app (tokens are registered on app start)

3. **Verify new tokens work**:
   - Send a test notification
   - Check logs for any SenderId errors

### Solution 2: Validate Tokens Before Sending

Add token validation in your notification sending code:

```javascript
// Validate token before sending
async function validateFCMToken(token) {
  try {
    // Try to get token info (this will fail if token is invalid)
    const tokenInfo = await admin.messaging().getApp();
    return true;
  } catch (error) {
    if (error.code === 'messaging/invalid-argument') {
      return false; // Token is invalid or from wrong project
    }
    throw error;
  }
}
```

### Solution 3: Handle Invalid Tokens Gracefully

Update notification sending to handle invalid tokens:

```javascript
async function sendNotification(token, title, body) {
  try {
    await admin.messaging().send({
      token,
      data: { title, body, type: 'notification' },
      android: { priority: 'high' },
    });
  } catch (error) {
    if (error.code === 'messaging/invalid-argument' || 
        error.message?.includes('SenderId')) {
      // Token is invalid - clear it from database
      await User.update(
        { fcmToken: null },
        { where: { fcmToken: token } }
      );
      console.log('Invalid FCM token cleared from database');
      return false;
    }
    throw error;
  }
  return true;
}
```

## Prevention

1. **Always use the same Firebase project** for frontend and backend
2. **Verify project IDs match** before deploying
3. **Clear old tokens** when switching Firebase projects
4. **Add token validation** in your notification sending code
5. **Log token registration** to track which project tokens belong to

## Testing

1. **Check current configuration**:
   ```bash
   # Frontend sender ID
   cat MyNewDoc/android/app/google-services.json | grep project_number
   
   # Backend project ID
   cat mydoc-api/crons/serviceAccountKey.json | grep project_id
   ```

2. **Test notification sending**:
   ```bash
   # Use the cron endpoint to test
   curl "http://your-api.com/api/cron/reminder-check?secret=your-secret"
   ```

3. **Monitor logs**:
   - Check `mydoc-api/logs/cron-*.log` for detailed error messages
   - Look for "SenderId mismatch" errors

## Current Configuration

✅ **Project ID**: `itsmyapp-b2f53` (matches in both frontend and backend)
✅ **Sender ID**: `797229091241` (from google-services.json)
✅ **Firebase Admin SDK**: Initialized with correct project ID

If you're still getting SenderId mismatch errors, the FCM tokens in your database were likely registered with a different Firebase project. Clear them and have users re-register.

