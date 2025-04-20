import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Add application metadata to logs
const getMetadata = () => ({
  timestamp: new Date().toISOString(),
  appVersion: config.app.version,
  environment: config.app.environment,
  sessionId:
    typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') || 'unknown' : 'server',
});

// Determine if a log at the given level should be shown
const shouldLog = (level: LogLevel): boolean => {
  if (!config.logging.enabled) return false;

  // In production, we might want to restrict debug logs
  if (isProduction && level === 'debug' && config.logging.debugInProduction === false) {
    return false;
  }

  const configuredLevel = config.logging.level as LogLevel;
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
};

// Format the log message
const formatMessage = (level: LogLevel, message: string): string => {
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

  // For production, we might want a more machine-parseable format
  if (isProduction) {
    return `[${level.toUpperCase()}] ${message}`;
  }

  return `${prefix} ${message}`;
};

// Function to send logs to a remote service in production
const sendToRemoteLogger = (_level: LogLevel, _message: string, _data?: any) => {
  if (!isProduction) return;

  // This would be replaced with actual remote logging service in production
  // For now, just ensure we don't lose important logs
  if (_level === 'error' || _level === 'warn') {
    try {
      // In a real implementation, this would call an API
      // const logData = {
      //   level,
      //   message,
      //   ...getMetadata(),
      //   data
      // };
      // Example for future implementation:
      /*
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      */
    } catch (e) {
      // Fail silently in production to avoid logging errors causing more errors
      if (isDevelopment) {
        console.error('Failed to send log to remote service:', e);
      }
    }
  }
};

// The logger object with methods for each log level
export const logger = {
  debug: (message: string, context?: object): void => {
    if (shouldLog('debug')) {
      const formattedMessage = formatMessage('debug', message, context);
      console.debug(formattedMessage, context || '');
      sendToRemoteLogger('debug', message, context);
    }
  },

  info: (message: string, context?: object): void => {
    if (shouldLog('info')) {
      const formattedMessage = formatMessage('info', message, context);
      console.info(formattedMessage, context || '');
      sendToRemoteLogger('info', message, context);
    }
  },

  warn: (message: string, context?: object): void => {
    if (shouldLog('warn')) {
      const formattedMessage = formatMessage('warn', message, context);
      console.warn(formattedMessage, context || '');
      sendToRemoteLogger('warn', message, context);
    }
  },

  error: (message: string, error?: any): void => {
    if (shouldLog('error')) {
      const formattedMessage = formatMessage('error', message);
      if (error) {
        console.error(formattedMessage, error);
        sendToRemoteLogger('error', message, { error: error.toString(), stack: error.stack });
      } else {
        console.error(formattedMessage);
        sendToRemoteLogger('error', message);
      }
    }
  },

  // Log a Supabase-specific success or failure
  supabase: {
    connectionSuccess: (): void => {
      if (shouldLog('info')) {
        const msg = 'Supabase connection successful';
        const metadata = {
          ...getMetadata(),
          component: 'supabase',
          action: 'connection',
        };
        console.log('✅ ' + msg);
        sendToRemoteLogger('info', msg, metadata);
      }
    },

    connectionFailed: (error: any): void => {
      if (shouldLog('error')) {
        const msg = 'Supabase connection failed';
        const metadata = {
          ...getMetadata(),
          component: 'supabase',
          action: 'connection',
          error: error.toString(),
        };
        console.error('❌ ' + msg, error);
        sendToRemoteLogger('error', msg, metadata);
      }
    },

    dataSubmitted: (table: string, data?: object): void => {
      if (shouldLog('info')) {
        const msg = `Data successfully saved to "${table}" table`;
        const metadata = {
          ...getMetadata(),
          component: 'supabase',
          action: 'insert',
          table,
        };
        console.log('✅ ' + msg, data || '');
        sendToRemoteLogger('info', msg, { ...metadata, data });
      }
    },

    dataSubmissionFailed: (table: string, error: any): void => {
      if (shouldLog('error')) {
        const msg = `Failed to save data to "${table}" table`;
        const metadata = {
          ...getMetadata(),
          component: 'supabase',
          action: 'insert',
          table,
          error: error.toString(),
        };
        console.error('❌ ' + msg, error);
        sendToRemoteLogger('error', msg, metadata);
      }
    },

    // Storage operations logging
    fileUploaded: (bucket: string, filePath: string): void => {
      if (shouldLog('info')) {
        const msg = `File successfully uploaded to "${bucket}/${filePath}"`;
        const metadata = {
          ...getMetadata(),
          component: 'supabase',
          action: 'storage.upload',
          bucket,
          filePath,
        };
        console.log('✅ ' + msg);
        sendToRemoteLogger('info', msg, metadata);
      }
    },

    fileUploadFailed: (bucket: string, filePath: string, error: any): void => {
      if (shouldLog('error')) {
        const msg = `Failed to upload file to "${bucket}/${filePath}"`;
        const metadata = {
          ...getMetadata(),
          component: 'supabase',
          action: 'storage.upload',
          bucket,
          filePath,
          error: error.toString(),
        };
        console.error('❌ ' + msg, error);
        sendToRemoteLogger('error', msg, metadata);
      }
    },
  },

  // API logging methods
  api: {
    request: (method: string, url: string, data?: object): void => {
      if (shouldLog('debug')) {
        const msg = `API Request: ${method} ${url}`;
        const metadata = {
          ...getMetadata(),
          component: 'api',
          action: 'request',
          method,
          url,
        };
        console.debug('🔍 ' + msg, data || '');
        sendToRemoteLogger('debug', msg, { ...metadata, data });
      }
    },

    response: (method: string, url: string, status: number, data?: object): void => {
      // Log all non-200 responses at warn level or higher
      const level = status >= 400 ? (status >= 500 ? 'error' : 'warn') : 'debug';

      if (shouldLog(level)) {
        const msg = `API Response: ${method} ${url} [${status}]`;
        const metadata = {
          ...getMetadata(),
          component: 'api',
          action: 'response',
          method,
          url,
          status,
        };

        if (level === 'error') {
          console.error('❌ ' + msg, data || '');
        } else if (level === 'warn') {
          console.warn('⚠️ ' + msg, data || '');
        } else {
          console.debug('🔍 ' + msg, data || '');
        }

        sendToRemoteLogger(level, msg, { ...metadata, data });
      }
    },
  },
};
