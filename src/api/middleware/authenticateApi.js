const env = require('../../lib/env');

module.exports = function authenticateApi(req, res, next) {
  const secret =
    req.get('x-internal-api-secret') ||
    req.get('x-bridge-secret') ||
    req.get('x-dashboard-secret') ||
    (req.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (!secret || secret !== env.INTERNAL_API_SHARED_SECRET) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized',
    });
  }

  next();
};
