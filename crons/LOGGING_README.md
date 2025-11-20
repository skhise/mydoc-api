# Cron Job Logging System

## Overview

All cron job activities are now logged to daily log files for better tracking and debugging. Logs are stored in the `logs/` directory at the root of the API project.

## Log File Structure

- **Location**: `mydoc-api/logs/`
- **Format**: `cron-YYYY-MM-DD.log` (one file per day)
- **Example**: `cron-2024-01-15.log`

## Log Format

Each log entry includes:
- **Timestamp**: ISO 8601 format (e.g., `2024-01-15T06:00:00.000Z`)
- **Level**: INFO, ERROR, WARN, SUCCESS, DEBUG
- **Message**: Human-readable message
- **Data**: Optional JSON data for context

**Example log entry:**
```
[2024-01-15T06:00:00.000Z] [INFO ] 🔔 Running reminder check cron job... | Data: {}
[2024-01-15T06:00:00.123Z] [INFO ] Found 5 reminders to check | Data: {"count":5}
[2024-01-15T06:00:01.456Z] [SUCCESS] Reminder notification sent: Meeting Reminder | Data: {"userId":1,"reminderId":10,"title":"Meeting Reminder"}
```

## Log Levels

### INFO
General information about cron job execution:
- Job start/end
- Number of items processed
- User notifications sent

### SUCCESS
Successful operations:
- Notifications sent successfully
- Jobs completed without errors

### WARN
Warning messages:
- Users without FCM tokens
- Skipped items
- Non-critical issues

### ERROR
Error messages with full stack traces:
- Database errors
- Notification sending failures
- Unexpected exceptions

### DEBUG
Debug information (only in development):
- Detailed execution flow
- Variable values
- Internal state

## Automatic Log Cleanup

The logging system automatically cleans up old log files:
- **Retention**: 30 days (configurable)
- **Cleanup**: Runs on logger initialization
- **Manual cleanup**: Call `cronLogger.cleanOldLogs(daysToKeep)`

## Usage in Cron Jobs

### Basic Usage

```javascript
import cronLogger from './cronLogger.js';

// Info log
cronLogger.info('Job started', { jobType: 'reminder' });

// Success log
cronLogger.success('Job completed', { processed: 10 });

// Error log
cronLogger.error('Job failed', error);

// Warning log
cronLogger.warn('Skipping item', { reason: 'No FCM token' });
```

### With Data Context

```javascript
cronLogger.info('Sending notification', {
  userId: 123,
  reminderId: 456,
  title: 'Meeting Reminder'
});
```

## Viewing Logs

### View Today's Logs
```bash
cat logs/cron-$(date +%Y-%m-%d).log
```

### View Last 50 Lines
```bash
tail -n 50 logs/cron-$(date +%Y-%m-%d).log
```

### Search for Errors
```bash
grep ERROR logs/cron-*.log
```

### View All Logs for a Date Range
```bash
# View logs from last 7 days
for i in {0..6}; do
  date=$(date -d "$i days ago" +%Y-%m-%d)
  if [ -f "logs/cron-$date.log" ]; then
    echo "=== $date ==="
    cat "logs/cron-$date.log"
  fi
done
```

## Log File Location

Logs are stored in:
```
mydoc-api/
  └── logs/
      ├── cron-2024-01-15.log
      ├── cron-2024-01-16.log
      └── cron-2024-01-17.log
```

## Configuration

### Change Log Retention

Edit `cronLogger.js`:
```javascript
// Keep logs for 60 days instead of 30
cronLogger.cleanOldLogs(60);
```

### Change Log Directory

Edit `cronLogger.js`:
```javascript
const logsDir = path.join(__dirname, '..', 'custom-logs');
```

## Troubleshooting

### Logs Not Being Created

1. Check directory permissions:
   ```bash
   ls -la mydoc-api/logs/
   ```

2. Ensure logs directory exists:
   ```bash
   mkdir -p mydoc-api/logs
   chmod 755 mydoc-api/logs
   ```

### Logs Too Large

- Reduce retention period
- Implement log rotation (future enhancement)
- Compress old logs

### Missing Logs

- Check if cron jobs are running
- Verify logger is imported correctly
- Check for file system errors in console

## Best Practices

1. **Include Context**: Always include relevant data in logs
2. **Use Appropriate Levels**: Use ERROR for failures, INFO for normal flow
3. **Don't Log Sensitive Data**: Avoid logging passwords, tokens, or PII
4. **Monitor Log Size**: Regularly check log file sizes
5. **Review Logs Regularly**: Check logs for errors and warnings

## Integration with Monitoring

You can integrate these logs with monitoring tools:
- **File-based monitoring**: Use `tail -f` to watch logs in real-time
- **Log aggregation**: Send logs to services like Loggly, Papertrail, etc.
- **Alerting**: Set up alerts based on ERROR level logs

## Example Log Output

```
[2024-01-15T06:00:00.000Z] [INFO ] 🔔 Running reminder check cron job... | Data: {}
[2024-01-15T06:00:00.123Z] [INFO ] Found 5 reminders to check | Data: {"count":5}
[2024-01-15T06:00:01.456Z] [INFO ] Sending reminder notification to user 1: Meeting Reminder | Data: {"userId":1,"reminderId":10,"reminderName":"Meeting Reminder"}
[2024-01-15T06:00:02.789Z] [SUCCESS] Reminder notification sent: Meeting Reminder | Data: {"userId":1,"reminderId":10,"title":"Meeting Reminder"}
[2024-01-15T06:00:03.012Z] [WARN ] User 2 not found or has no FCM token | Data: {"userId":2,"reminderId":11}
[2024-01-15T06:00:03.345Z] [SUCCESS] Reminder check completed | Data: {"totalReminders":5,"date":"2024-01-15"}
```

