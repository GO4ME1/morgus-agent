import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(502, message || `${service} service unavailable`);
  }
}

/**
 * Logger utility
 */
export class Logger {
  private static formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  static info(message: string, meta?: any) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  static warn(message: string, meta?: any) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  static error(message: string, error?: Error | any, meta?: any) {
    const errorMeta = error ? {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        ...error
      }
    } : meta;
    console.error(this.formatMessage('ERROR', message, errorMeta));
  }

  static debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  Logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    userId: (req as any).userId
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message
    });
  }

  // Handle database errors
  if (err.message?.includes('duplicate key')) {
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  if (err.message?.includes('foreign key')) {
    return res.status(400).json({
      error: 'Invalid reference'
    });
  }

  // Handle unknown errors
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error'
    });
  } else {
    return res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request logger middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log request
  Logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    userId: (req as any).userId
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    if (level === 'warn') {
      Logger.warn(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
        statusCode: res.statusCode,
        duration
      });
    } else {
      Logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
        statusCode: res.statusCode,
        duration
      });
    }
  });

  next();
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
}

/**
 * Validation helper
 */
export function validate(condition: boolean, message: string) {
  if (!condition) {
    throw new ValidationError(message);
  }
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    Logger.warn('JSON parse failed', { json, error });
    return defaultValue;
  }
}

/**
 * Retry helper for external API calls
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      Logger.warn(`Retry attempt ${i + 1}/${maxRetries} failed`, { error: error.message });
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
