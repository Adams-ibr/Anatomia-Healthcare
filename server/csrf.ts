import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern with tokens
 * - GET requests return a CSRF token in response (X-CSRF-Token header)
 * - POST/PATCH/DELETE requests require the token in X-CSRF-Token header or body
 */

declare global {
  namespace Express {
    interface Request {
      csrfToken?: string;
    }
  }
}

const TOKEN_LENGTH = 32;
const TOKEN_LIFETIME = 1000 * 60 * 60 * 24; // 24 hours in milliseconds
const COOKIE_NAME = "X-CSRF-Token";
const HEADER_NAME = "X-CSRF-Token";
const BODY_FIELD_NAME = "csrfToken";

/**
 * Generate a random CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Validate token format
 */
function isValidTokenFormat(token: string): boolean {
  // Should be hex string of TOKEN_LENGTH * 2 characters (64 chars for 32 bytes)
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * CSRF token generation middleware for GET requests
 * Generates and attaches a token to responses
 */
export function csrfGenerate(req: Request, res: Response, next: NextFunction) {
  // For GET requests, generate a new token or use existing one
  if (req.method === "GET") {
    let token = req.cookies?.[COOKIE_NAME];
    
    if (!token || !isValidTokenFormat(token)) {
      token = generateToken();
    }
    
    // Attach token to request for later use
    req.csrfToken = token;
    
    // Set secure httpOnly cookie with token
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_LIFETIME,
      path: "/",
    });
    
    // Also set header so client can read it (for frameworks)
    res.setHeader(HEADER_NAME, token);
  }
  
  next();
}

/**
 * CSRF token validation middleware for state-changing requests
 * Validates token from header or body against cookie
 */
export function csrfValidate(req: Request, res: Response, next: NextFunction) {
  // Skip validation for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[COOKIE_NAME];
  const headerToken = req.headers[HEADER_NAME.toLowerCase()] as string;
  const bodyToken = (req.body as any)?.[BODY_FIELD_NAME];
  
  // Try token from header first (preferred for API calls), then body
  const providedToken = headerToken || bodyToken;

  // Check if we have both tokens
  if (!cookieToken || !providedToken) {
    console.warn(`CSRF validation failed: missing tokens. Cookie: ${!!cookieToken}, Provided: ${!!providedToken}`);
    return res.status(403).json({
      error: "CSRF token missing",
      details: "Request rejected due to missing CSRF token. Use GET request first to obtain token.",
    });
  }

  // Validate token format
  if (!isValidTokenFormat(cookieToken) || !isValidTokenFormat(providedToken)) {
    console.warn(`CSRF validation failed: invalid token format`);
    return res.status(403).json({
      error: "CSRF token invalid",
      details: "Request rejected due to invalid CSRF token format.",
    });
  }

  // Compare tokens (constant-time comparison to prevent timing attacks)
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(providedToken))) {
    console.warn(`CSRF validation failed: token mismatch`);
    return res.status(403).json({
      error: "CSRF token mismatch",
      details: "Request rejected due to CSRF token mismatch. This may indicate a cross-site attack.",
    });
  }

  // Token is valid, proceed
  req.csrfToken = providedToken;
  next();
}

/**
 * Compose both CSRF middlewares for convenience
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  csrfGenerate(req, res, (err) => {
    if (err) return next(err);
    csrfValidate(req, res, next);
  });
}

/**
 * Middleware to attach CSRF token to locals for template rendering (if needed)
 */
export function attachCsrfToken(req: Request, res: Response, next: NextFunction) {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken;
  }
  next();
}
