import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

/**
 * In-memory rate limiting store
 * In production, use Redis for distributed rate limiting
 */
const store: RateLimitStore = {};

/**
 * Rate limiting middleware
 * Tracks requests by IP address and enforces limits
 * 
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed in the window
 * @param message - Custom error message
 */
export function rateLimit(
  windowMs: number = 60000, // 1 minute default
  maxRequests: number = 10,
  message: string = "Too many requests, please try again later"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP, handling proxy headers
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const key = `${clientIp}:${req.path}`;

    // Initialize or get rate limit entry
    if (!store[key]) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    const entry = store[key];

    // Check if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    // Increment request count
    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = entry.resetTime;

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetTime);

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: "Too Many Requests",
        message,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Cleanup old entries from store (call periodically)
 * Prevents memory leaks from accumulating entries
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, entry] of Object.entries(store)) {
    // Delete entries that have been expired for more than 1 hour
    if (now - entry.resetTime > 3600000) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => delete store[key]);

  if (keysToDelete.length > 0) {
    console.log(`[RateLimit] Cleaned up ${keysToDelete.length} expired entries`);
  }
}

/**
 * Start automatic cleanup interval
 * Cleans up old entries every 30 minutes
 */
export function startRateLimitCleanup() {
  const timer = setInterval(() => {
    cleanupRateLimitStore();
  }, 30 * 60 * 1000); // 30 minutes
  timer.unref?.();

  console.log("[RateLimit] Cleanup interval started");
}

/**
 * Clear specific IP from rate limit (internal use only)
 */
function clearRateLimitInternal(clientIp: string) {
  const keysToDelete = Object.keys(store).filter((key) =>
    key.startsWith(clientIp)
  );

  keysToDelete.forEach((key) => delete store[key]);
}

/**
 * Clear all rate limits (internal use only)
 */
function clearAllRateLimitsInternal() {
  Object.keys(store).forEach((key) => delete store[key]);
}
