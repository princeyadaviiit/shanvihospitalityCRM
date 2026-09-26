/**
 * In-memory sliding-window rate limiter for protecting authentication endpoints
 * Adheres strictly to security.md §2 (rate limiting on login, sign-up, password reset).
 */

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const ipRateLimits = new Map<string, RateLimitRecord>();

export type RateLimitOptions = {
  maxRequests?: number;
  windowMs?: number;
  forceCheck?: boolean;
};

export function resetRateLimits(): void {
  ipRateLimits.clear();
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  // In test environment, bypass rate limiting unless explicitly forced
  if (process.env.NODE_ENV === 'test' && !options.forceCheck && process.env.TEST_RATE_LIMIT !== 'true') {
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 };
  }

  const maxRequests = options.maxRequests ?? 10; // 10 attempts
  const windowMs = options.windowMs ?? 60 * 1000; // per 1 minute
  const now = Date.now();

  const record = ipRateLimits.get(identifier);

  if (!record || now > record.resetAt) {
    ipRateLimits.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
