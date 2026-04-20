const buckets = new Map();

module.exports = function rateLimitInternalApi(req, res, next) {
  const windowMs = 60 * 1000;
  const maxRequests = 120;

  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0])?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  const existing = buckets.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > existing.resetAt) {
    existing.count = 0;
    existing.resetAt = now + windowMs;
  }

  existing.count += 1;
  buckets.set(ip, existing);

  res.setHeader("X-RateLimit-Limit", String(maxRequests));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxRequests - existing.count)));
  res.setHeader("X-RateLimit-Reset", String(existing.resetAt));

  if (existing.count > maxRequests) {
    return res.status(429).json({
      ok: false,
      error: "Rate limit exceeded.",
      code: "RATE_LIMITED",
    });
  }

  next();
};
