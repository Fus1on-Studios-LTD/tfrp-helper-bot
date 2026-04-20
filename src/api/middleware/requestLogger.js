const logger = require('../../lib/logger');

module.exports = function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0])?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    logger.info(
      `[internal-api] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${durationMs}ms from ${ip}`
    );
  });

  next();
};
