import type { Request, Response, NextFunction } from 'express';
import { AppError, NotFoundError } from '../AppError.js';
import { DatabaseError } from 'pg';
import logger from '../utils/logger.js';

interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert known errors to AppError
  if (!(error instanceof AppError)) {
    if (error instanceof DatabaseError || (error as any).code) {
      error = handlePostgresError(error);
    } else if (error.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token', 401, true);
    } else if (error.name === 'TokenExpiredError') {
      error = new AppError('Token expired', 401, true);
    } else if (error.name === 'ValidationError') {
      error = new AppError('Validation failed', 422, true, (error as any).details);
    } else if (error.name === 'SyntaxError' && 'body' in error) {
      error = new AppError('Invalid JSON in request body', 400, true);
    } else {
      error = new AppError(
        error.message || 'Something went wrong',
        500,
        false
      );
    }
  }

  const appError = error as AppError;
  const statusCode = appError.statusCode || 500;
  const isOperational = appError.isOperational || false;

  // Log error details
  if (!isOperational || statusCode >= 500) {
    logger.error({
      err: appError,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id,
      body: req.body,
      query: req.query,
      params: req.params,
    }, 'Unhandled error occurred');
  } else {
    logger.warn({
      err: appError,
      url: req.url,
      method: req.method,
      statusCode,
    }, 'Operational error occurred');
  }

  // Prepare error response
  const response: ErrorResponse = {
    success: false,
    message: appError.message,
    statusCode,
  };

  if (appError.details) {
    response.details = appError.details;
  }

  if (process.env.NODE_ENV === 'development' && appError.stack) {
    response.stack = appError.stack;
  }

  res.status(statusCode).json(response);
};

// Handle PostgreSQL-specific errors
function handlePostgresError(error: any): AppError {
  const pgError = error as DatabaseError;
  const code = pgError.code;

  switch (code) {
    case '23505':
      const column = extractColumnFromError(pgError.detail);
      return new AppError(
        `${column || 'Field'} already exists`,
        409,
        true,
        { 
          field: column,
          constraint: pgError.constraint,
        }
      );
    
    case '23503':
      return new AppError('Related record not found', 400, true, {
        constraint: pgError.constraint,
      });
    
    case '23502':
      const field = extractColumnFromError(pgError.message);
      return new AppError(`${field || 'Required field'} is missing`, 400, true, {
        field,
      });
    
    case '22P02':
      return new AppError('Invalid ID format', 400, true);
    
    case '42P01':
      return new AppError('Database table not found', 500, false);
    
    case '42703':
      return new AppError('Database column not found', 500, false);
    
    case '08006':
    case '08003':
    case '08000':
      return new AppError('Database connection failed', 503, false);
    
    case '53300':
      return new AppError('Database overloaded', 503, false);
    
    default:
      return new AppError('Database operation failed', 500, false, {
        code: pgError.code,
        message: process.env.NODE_ENV === 'development' ? pgError.message : undefined,
      });
  }
}

function extractColumnFromError(message?: string): string | null {
  if (!message) return null;
  
  const keyMatch = message.match(/Key \((\w+)\)/);
  if (keyMatch && keyMatch[1]) return keyMatch[1];
  
  const columnMatch = message.match(/column "(\w+)"/);
  if (columnMatch && columnMatch[1]) return columnMatch[1];
  
  return null;
}

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};