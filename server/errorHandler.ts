import { Response } from "express";

interface ErrorResponse {
  error: string;
  details?: string;
  stack?: string;
}

/**
 * Safely send error responses without exposing stack traces in production
 * 
 * Stack traces are ONLY included in development environment
 * Production and staging never expose implementation details
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  errorMessage: string,
  error?: Error | unknown,
  sanitizeMessage = true
): Response {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // Sanitize user-facing message for production 5xx errors
  let clientMessage = errorMessage;
  if (sanitizeMessage && !isDevelopment && statusCode >= 500) {
    clientMessage = "Internal Server Error";
  }

  const errorResponse: ErrorResponse = {
    error: clientMessage,
  };

  // Only include details in development
  if (isDevelopment && error instanceof Error) {
    errorResponse.details = error.message;
    errorResponse.stack = error.stack;
  }

  return res.status(statusCode).json(errorResponse);
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}
