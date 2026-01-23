// src/utils/logger.ts
import pino, { type Logger, type LoggerOptions } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
    service: 'api-monitor',
  },

  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // FIX: Use spread operator to conditionally add the property
  // This ensures the 'transport' key doesn't exist at all if !isDevelopment
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
        messageFormat: '{levelLabel} - [{module}] {msg}',
      },
    },
  }),
});

export const createLogger = (module: string): Logger => {
  return baseLogger.child({ module });
};

export default baseLogger;