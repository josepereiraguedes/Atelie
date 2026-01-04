/**
 * Logger utility for consistent error handling and logging throughout the application
 */

// Define log levels
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Define log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  error?: Error;
  metadata?: Record<string, unknown>;
}

/**
 * Custom logger class for consistent logging
 */
class Logger {
  private minLevel: LogLevel = 'info';
  
  constructor(minLevel?: LogLevel) {
    if (minLevel) {
      this.minLevel = minLevel;
    }
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, error?: Error, metadata?: Record<string, unknown>) {
    this.log('error', message, context, error, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.log('warn', message, context, undefined, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.log('info', message, context, undefined, metadata);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.log('debug', message, context, undefined, metadata);
  }

  /**
   * Generic log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ) {
    // Skip if log level is below minimum
    if (!this.shouldLog(level)) return;

    // Em produção, apenas registramos erros e avisos
    if (process.env.NODE_ENV === 'production' && level !== 'error' && level !== 'warn') {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      metadata
    };

    // Format the log message
    const formattedMessage = this.formatLogMessage(logEntry);

    // Log to console based on level
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
    }

    // In production, you might want to send logs to a remote service
    // this.sendToRemoteService(logEntry);
  }

  /**
   * Format log message for display
   */
  private formatLogMessage(logEntry: LogEntry): string {
    const timestamp = logEntry.timestamp.toISOString();
    const context = logEntry.context ? `[${logEntry.context}]` : '';
    const message = logEntry.message;
    const error = logEntry.error ? `\nError: ${logEntry.error.message}\nStack: ${logEntry.error.stack}` : '';
    const metadata = logEntry.metadata ? `\nMetadata: ${JSON.stringify(logEntry.metadata)}` : '';

    return `[${timestamp}] ${logEntry.level.toUpperCase()}${context}: ${message}${error}${metadata}`;
  }

  /**
   * Determine if a log level should be logged based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    
    return levelIndex <= minLevelIndex;
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }
}

// Create and export a default logger instance
export const logger = new Logger(process.env.NODE_ENV === 'development' ? 'debug' : 'warn');

export default Logger;

