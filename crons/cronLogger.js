import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log file path (one file per day)
const getLogFilePath = () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logsDir, `cron-${dateStr}.log`);
};

// Format log message with timestamp
const formatLogMessage = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padEnd(5);
  let logMessage = `[${timestamp}] [${levelStr}] ${message}`;
  
  if (data) {
    logMessage += ` | Data: ${JSON.stringify(data)}`;
  }
  
  return logMessage + '\n';
};

// Write to log file
const writeToFile = (message) => {
  try {
    const logFile = getLogFilePath();
    fs.appendFileSync(logFile, message, 'utf8');
  } catch (error) {
    // Fallback to console if file write fails
    console.error('Failed to write to log file:', error);
    console.log(message.trim());
  }
};

// Logger object
const cronLogger = {
  /**
   * Log info message
   */
  info: (message, data = null) => {
    const logMessage = formatLogMessage('INFO', message, data);
    writeToFile(logMessage);
    // Also log to console for immediate visibility
    console.log(message, data || '');
  },

  /**
   * Log error message
   */
  error: (message, error = null) => {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...(error.response && { response: error.response.data })
    } : null;
    const logMessage = formatLogMessage('ERROR', message, errorData);
    writeToFile(logMessage);
    // Also log to console
    console.error(message, error || '');
  },

  /**
   * Log warning message
   */
  warn: (message, data = null) => {
    const logMessage = formatLogMessage('WARN', message, data);
    writeToFile(logMessage);
    console.warn(message, data || '');
  },

  /**
   * Log success message
   */
  success: (message, data = null) => {
    const logMessage = formatLogMessage('SUCCESS', message, data);
    writeToFile(logMessage);
    console.log(`✅ ${message}`, data || '');
  },

  /**
   * Log debug message (only in development)
   */
  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      const logMessage = formatLogMessage('DEBUG', message, data);
      writeToFile(logMessage);
      console.log(`🔍 ${message}`, data || '');
    }
  },

  /**
   * Get log file path for current day
   */
  getLogFilePath: () => getLogFilePath(),

  /**
   * Clean old log files (older than specified days)
   */
  cleanOldLogs: (daysToKeep = 30) => {
    try {
      const files = fs.readdirSync(logsDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      files.forEach(file => {
        if (file.startsWith('cron-') && file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtimeMs;

          if (fileAge > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted old log file: ${file}`);
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning old log files:', error);
    }
  }
};

// Clean old logs on startup (keep last 30 days)
cronLogger.cleanOldLogs(30);

export default cronLogger;

