import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Determine if a log at the given level should be shown
const shouldLog = (level: LogLevel): boolean => {
  if (!config.logging.enabled) return false;

  const configuredLevel = config.logging.level as LogLevel;
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
};

// Format the log message
const formatMessage = (level: LogLevel, message: string, context?: object): string => {
  let prefix = '';

  switch (level) {
    case 'debug':
      prefix = '🔍 DEBUG:';
      break;
    case 'info':
      prefix = '📘 INFO:';
      break;
    case 'warn':
      prefix = '⚠️ WARNING:';
      break;
    case 'error':
      prefix = '❌ ERROR:';
      break;
  }

  return `${prefix} ${message}`;
};

// The logger object with methods for each log level
export const logger = {
  debug: (message: string, context?: object): void => {
    if (shouldLog('debug')) {
      const formattedMessage = formatMessage('debug', message, context);
      console.debug(formattedMessage, context || '');
    }
  },

  info: (message: string, context?: object): void => {
    if (shouldLog('info')) {
      const formattedMessage = formatMessage('info', message, context);
      console.info(formattedMessage, context || '');
    }
  },

  warn: (message: string, context?: object): void => {
    if (shouldLog('warn')) {
      const formattedMessage = formatMessage('warn', message, context);
      console.warn(formattedMessage, context || '');
    }
  },

  error: (message: string, error?: any): void => {
    if (shouldLog('error')) {
      const formattedMessage = formatMessage('error', message);
      if (error) {
        console.error(formattedMessage, error);
      } else {
        console.error(formattedMessage);
      }
    }
  },

  // Log a Supabase-specific success or failure
  supabase: {
    connectionSuccess: (): void => {
      if (shouldLog('info')) {
        console.log('✅ Supabase connection successful');
      }
    },

    connectionFailed: (error: any): void => {
      if (shouldLog('error')) {
        console.error('❌ Supabase connection failed:', error);
      }
    },

    dataSubmitted: (table: string, data?: object): void => {
      if (shouldLog('info')) {
        console.log(`✅ Data successfully saved to "${table}" table`, data || '');
      }
    },

    dataSubmissionFailed: (table: string, error: any): void => {
      if (shouldLog('error')) {
        console.error(`❌ Failed to save data to "${table}" table:`, error);
      }
    },
  },
};
