# Test Notification Guide

This guide explains how to use the test notification script to test FCM notifications and debug SenderId mismatch issues.

## File Location

- **Test Script**: `mydoc-api/crons/testNotification.js`
- **API Routes**: `mydoc-api/routes/cronRoutes.js`

## Usage Methods

### Method 1: Using API Endpoints (Recommended)

#### 1. Get List of Users with FCM Tokens

```bash
curl "http://your-api.com/api/cron/test-notification/users?secret=your-secret-key"
```

Response:
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "mobile": "1234567890",
      "hasToken": true,
      "tokenPreview": "dKx8vN2mP5qR7tY9wZ..."
    }
  ]
}
```

#### 2. Send Test Notification to Specific User (by ID)

```bash
curl -X POST "http://your-api.com/api/cron/test-notification/user/1?secret=your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

#### 3. Send Test Notification to User (by Mobile)

```bash
curl -X POST "http://your-api.com/api/cron/test-notification/mobile/1234567890?secret=your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

#### 4. Send Test Notification to All Users

```bash
curl -X POST "http://your-api.com/api/cron/test-notification/all?secret=your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message to all users"
  }'
```

Response:
```json
{
  "success": 3,
  "failed": 1,
  "total": 4,
  "results": [
    {
      "userId": 1,
      "userName": "John Doe",
      "success": true,
      "message": "Test notification sent to user John Doe (ID: 1)",
      "messageId": "projects/itsmyapp-b2f53/messages/0:1234567890"
    },
    {
      "userId": 2,
      "userName": "Jane Smith",
      "success": false,
      "message": "Invalid FCM token (SenderId mismatch or invalid token): ...",
      "errorCode": "messaging/invalid-argument"
    }
  ]
}
```

### Method 2: Running Script Directly

```bash
cd mydoc-api
node crons/testNotification.js
```

This will:
1. List all users with FCM tokens
2. Send a test notification to the first user
3. Show success/failure status

### Method 3: Import and Use in Code

```javascript
import { 
  sendTestNotificationToUser,
  sendTestNotificationToAllUsers,
  getUsersWithTokens 
} from './crons/testNotification.js';

// Send to specific user
const result = await sendTestNotificationToUser(1, 'Test', 'Message');

// Get users with tokens
const users = await getUsersWithTokens();

// Send to all users
const results = await sendTestNotificationToAllUsers('Test', 'Message');
```

## Error Handling

The test script automatically:
- ✅ **Detects SenderId mismatch errors**
- ✅ **Clears invalid tokens from database**
- ✅ **Logs detailed error information**
- ✅ **Returns success/failure status**

### Common Errors

1. **SenderId Mismatch**:
   ```
   Error: Invalid FCM token (SenderId mismatch or invalid token)
   Error Code: messaging/invalid-argument
   ```
   **Solution**: Clear all tokens and have users re-register

2. **User Not Found**:
   ```
   Error: User 123 not found
   ```
   **Solution**: Check user ID exists in database

3. **No FCM Token**:
   ```
   Error: User 123 (John Doe) has no FCM token
   ```
   **Solution**: User needs to log in/restart app to register token

## Testing SenderId Fix

After clearing tokens and having users re-register:

1. **Get list of users**:
   ```bash
   curl "http://your-api.com/api/cron/test-notification/users?secret=your-secret-key"
   ```

2. **Send test to first user**:
   ```bash
   curl -X POST "http://your-api.com/api/cron/test-notification/user/1?secret=your-secret-key"
   ```

3. **Check logs**:
   ```bash
   tail -f mydoc-api/logs/cron-$(date +%Y-%m-%d).log
   ```

4. **Verify in app**: User should receive notification

## Logs

All test notifications are logged to:
- **Console**: Immediate feedback
- **File**: `mydoc-api/logs/cron-YYYY-MM-DD.log`

Example log entry:
```
[2024-01-15T10:30:00.000Z] [INFO ] 🧪 Sending test notification to user 1...
[2024-01-15T10:30:00.123Z] [SUCCESS] Test notification sent successfully to user 1 (John Doe)
```

## Security

⚠️ **Important**: These endpoints require the cron secret key:
- Query parameter: `?secret=your-secret-key`
- Header: `X-Cron-Secret: your-secret-key`

Default secret: `itesmenotitsyou` (change in production!)

## Troubleshooting

### No Users Found
- Users need to log in/restart app to register FCM tokens
- Check database: `SELECT id, name, fcmToken FROM users WHERE fcmToken IS NOT NULL;`

### All Notifications Fail
- Check Firebase configuration matches
- Verify service account key is valid
- Check server logs for initialization errors

### Some Notifications Fail
- Invalid tokens are automatically cleared
- Have affected users log out/in to re-register tokens
- Check logs for specific error messages

## Example Workflow

1. **Clear all tokens** (if switching projects):
   ```bash
   curl -X POST "http://your-api.com/api/fcm/clear-all"
   ```

2. **Get users list**:
   ```bash
   curl "http://your-api.com/api/cron/test-notification/users?secret=your-secret-key"
   ```

3. **Send test to one user**:
   ```bash
   curl -X POST "http://your-api.com/api/cron/test-notification/user/1?secret=your-secret-key"
   ```

4. **If successful, send to all**:
   ```bash
   curl -X POST "http://your-api.com/api/cron/test-notification/all?secret=your-secret-key"
   ```

5. **Check results and logs**:
   - Review API response for success/failure counts
   - Check `mydoc-api/logs/cron-*.log` for detailed logs
   - Verify notifications received in app

