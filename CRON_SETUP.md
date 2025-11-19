# Cron Jobs Setup for Shared Hosting

This guide explains how to set up cron jobs for your MyDoc API when hosting on shared hosting.

## Overview

Since shared hosting doesn't allow continuous Node.js processes, we've created HTTP endpoints that can be triggered by your hosting provider's cron job scheduler.

## Available Cron Endpoints

1. **Reminder Check**: `/api/cron/reminder-check`
   - Checks for reminders that need to be sent
   - Should run daily at 6:00 AM

2. **Expense Summary**: `/api/cron/expense-summary`
   - Checks if it's time to send daily expense summaries
   - Should run every hour

## Setup Instructions

### Step 1: Set a Secret Key (Recommended for Security)

1. Add an environment variable `CRON_SECRET_KEY` to your hosting environment
2. Or update the default secret in `routes/cronRoutes.js`
3. Use this secret key in your cron job URLs

**Example secret key**: `my-super-secret-cron-key-2024`

### Step 2: Configure Cron Jobs in Your Hosting Control Panel

Most shared hosting providers (cPanel, Plesk, etc.) have a "Cron Jobs" section. Here's how to set them up:

#### For Reminder Check (Daily at 6:00 AM):

**Cron Schedule**: `0 6 * * *`

**Command/URL** (choose one based on your hosting):

**Option 1: Using curl (Recommended)**
```bash
curl -X GET "https://yourdomain.com/api/cron/reminder-check?secret=your-secret-key-change-this"
```

**Option 2: Using wget**
```bash
wget -q -O - "https://yourdomain.com/api/cron/reminder-check?secret=your-secret-key-change-this"
```

**Option 3: Using PHP (if curl/wget not available)**
```php
<?php
file_get_contents('https://yourdomain.com/api/cron/reminder-check?secret=your-secret-key-change-this');
?>
```

#### For Expense Summary (Every Hour):

**Cron Schedule**: `0 * * * *`

**Command/URL**:
```bash
curl -X GET "https://yourdomain.com/api/cron/expense-summary?secret=your-secret-key-change-this"
```

### Step 3: Test Your Cron Jobs

You can test the endpoints manually by visiting these URLs in your browser:

1. `https://yourdomain.com/api/cron/reminder-check?secret=your-secret-key-change-this`
2. `https://yourdomain.com/api/cron/expense-summary?secret=your-secret-key-change-this`

You should see a JSON response like:
```json
{
  "success": true,
  "message": "Reminder check completed successfully",
  "timestamp": "2024-01-15T06:00:00.000Z"
}
```

## Cron Schedule Examples

### Common Cron Formats:

- `0 6 * * *` - Daily at 6:00 AM
- `0 * * * *` - Every hour at minute 0
- `*/15 * * * *` - Every 15 minutes
- `0 0 * * *` - Daily at midnight
- `0 9,18 * * *` - At 9 AM and 6 PM daily

### Recommended Schedules:

1. **Reminder Check**: `0 6 * * *` (Daily at 6:00 AM)
2. **Expense Summary**: `0 * * * *` (Every hour)

## Security Notes

1. **Change the default secret key** in production
2. **Use environment variables** for the secret key if possible
3. **Enable secret key validation** by uncommenting the security check in `routes/cronRoutes.js`
4. **Use HTTPS** for your API endpoints
5. **Restrict access** to cron endpoints if your hosting allows IP whitelisting

## Troubleshooting

### Cron job not running?

1. Check your hosting provider's cron job logs
2. Test the endpoints manually in a browser
3. Check your server logs for errors
4. Verify your API is accessible from the internet
5. Ensure your Node.js application is running

### Getting 401 Unauthorized?

- Make sure you're including the `secret` parameter in the URL
- Verify the secret key matches what's set in your environment or code
- Check if secret key validation is enabled

### Cron job runs but no notifications sent?

1. Check server logs for errors
2. Verify users have FCM tokens set
3. Check Firebase configuration
4. Verify reminders/expenses exist in the database
5. Check notification settings in the database

## Alternative: Using a Cron Service

If your shared hosting doesn't support cron jobs, you can use external cron services:

1. **cron-job.org** - Free cron job service
2. **EasyCron** - Paid service with more features
3. **UptimeRobot** - Free monitoring with cron jobs

Just set up the URLs as mentioned above with the appropriate schedule.

## For VPS/Dedicated Servers

If you're running on a VPS or dedicated server with a continuous Node.js process, you can:

1. Uncomment the cron imports in `index.js`:
   ```javascript
   import './crons/reminderCron.js';
   import './crons/expenseNotificationCron.js';
   ```

2. The cron jobs will run automatically on schedule
3. You can still use the HTTP endpoints for manual triggering or testing

## Support

If you encounter issues, check:
- Server logs
- Database connectivity
- Firebase configuration
- Network connectivity from your hosting to your API

