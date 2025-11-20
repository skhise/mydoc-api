# Fixing SenderId Mismatch - Step by Step Guide

## Quick Fix (Recommended)

If you're getting SenderId mismatch errors, the fastest solution is to clear all existing FCM tokens and have users re-register:

### Step 1: Clear All FCM Tokens

**Option A: Using API Endpoint** (Recommended)
```bash
curl -X POST http://your-api.com/api/fcm/clear-all \
  -H "Content-Type: application/json"
```

**Option B: Using SQL** (Direct database access)
```sql
UPDATE users SET fcmToken = NULL WHERE deletedAt IS NULL;
```

### Step 2: Verify Configuration

Check that your Firebase configuration matches:

1. **Frontend** (`MyNewDoc/android/app/google-services.json`):
   - `project_number`: `797229091241` (This is the Sender ID)
   - `project_id`: `itsmyapp-b2f53`

2. **Backend** (`mydoc-api/crons/serviceAccountKey.json`):
   - `project_id`: `itsmyapp-b2f53` ✅ (Should match)

3. **Backend Firebase Init** (`mydoc-api/crons/firebase.js`):
   - Should log: `Project ID: itsmyapp-b2f53`
   - Should log: `Expected Sender ID: 797229091241`

### Step 3: Have Users Re-register Tokens

Users need to:
1. **Log out and log back in**, OR
2. **Restart the app** (tokens are registered on app start)

The app will automatically register new FCM tokens with the correct sender ID.

## Detailed Diagnosis

### Check Current Token Statistics

```bash
curl http://your-api.com/api/fcm/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalUsers": 10,
    "usersWithTokens": 8,
    "usersWithoutTokens": 2,
    "percentageWithTokens": "80.00"
  }
}
```

### Check Server Logs

When the server starts, check the Firebase initialization logs:
```
🔥 Firebase Admin SDK Configuration:
  Project ID: itsmyapp-b2f53
  Client Email: firebase-adminsdk-jadcz@itsmyapp-b2f53.iam.gserviceaccount.com
  Expected Sender ID (from google-services.json): 797229091241
✅ Firebase Admin SDK initialized successfully
```

### Check Notification Error Logs

When sending notifications fails, check `mydoc-api/logs/cron-*.log` for errors like:
```
[ERROR] Invalid FCM token detected (SenderId mismatch or invalid token)
  errorCode: messaging/invalid-argument
  errorMessage: The registration token is not a valid FCM registration token
  projectId: itsmyapp-b2f53
  projectNumber: 797229091241
```

## Why This Happens

1. **Old Tokens**: FCM tokens in the database were registered with a different Firebase project
2. **Project Switch**: You switched Firebase projects but didn't clear old tokens
3. **Multiple Projects**: App and backend are using different Firebase projects

## Prevention

1. **Always clear tokens when switching projects**:
   ```bash
   curl -X POST http://your-api.com/api/fcm/clear-all
   ```

2. **Monitor token validity**:
   - Check logs regularly for SenderId errors
   - Invalid tokens are automatically cleared when detected

3. **Verify configuration before deployment**:
   - Ensure `project_id` matches in both frontend and backend
   - Ensure `project_number` (Sender ID) matches

## Testing After Fix

1. **Send a test notification**:
   ```bash
   curl "http://your-api.com/api/cron/reminder-check?secret=your-secret"
   ```

2. **Check logs**:
   ```bash
   tail -f mydoc-api/logs/cron-$(date +%Y-%m-%d).log
   ```

3. **Verify in app**:
   - User should receive notification
   - No errors in server logs

## API Endpoints

### GET `/api/fcm/stats`
Get statistics about FCM tokens in the database.

### POST `/api/fcm/clear-all`
Clear all FCM tokens from the database. Use when switching Firebase projects.

### POST `/api/fcm/validate-and-clean?dryRun=true`
Validate all tokens (format check only). Use `dryRun=false` to actually clear invalid tokens.

## Still Having Issues?

1. **Check Firebase Console**:
   - Go to Firebase Console → Project Settings
   - Verify the project number matches `797229091241`
   - Verify the service account email matches your `serviceAccountKey.json`

2. **Verify Service Account Permissions**:
   - Service account should have "Firebase Cloud Messaging API Admin" role
   - Or "Firebase Admin SDK Administrator Service Agent" role

3. **Check App Package Name**:
   - Ensure `com.mynewdoc` matches in both:
     - `google-services.json`
     - Android app's `build.gradle` (applicationId)

4. **Clear and Rebuild**:
   ```bash
   # In MyNewDoc directory
   cd android
   ./gradlew clean
   cd ..
   # Rebuild the app
   ```

