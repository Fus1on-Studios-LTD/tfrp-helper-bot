const env = require('../../lib/env');

function normalizeIp(ip) {
  if (!ip) return "";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
}

module.exports = function restrictInternalApiIp(req, res, next) {
  if (!env.INTERNAL_API_ALLOWED_IPS || env.INTERNAL_API_ALLOWED_IPS.length === 0) {
    return next();
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0])?.trim() ||
    req.socket.remoteAddress ||
    "";

  const ip = normalizeIp(rawIp);

  if (!env.INTERNAL_API_ALLOWED_IPS.includes(ip)) {
    return res.status(403).json({
      ok: false,
      error: "Forbidden IP.",
      code: "IP_NOT_ALLOWED",
    });
  }

  next();
};
