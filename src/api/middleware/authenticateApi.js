const env = require('../../lib/env');
const { failure } = require('../lib/jsonResponse');

module.exports = function authenticateApi(req, res, next) {
  const bearer = req.get('authorization') || '';
  const presentedSecrets = [
    req.get('x-internal-api-secret'),
    req.get('x-bridge-secret'),
    req.get('x-dashboard-secret'),
    bearer.replace(/^Bearer\s+/i, ''),
  ].filter(Boolean);

  const validSecrets = [
    env.INTERNAL_API_SHARED_SECRET,
    env.INTERNAL_API_SHARED_SECRET_PREVIOUS,
  ].filter(Boolean);

  const isAuthorized = presentedSecrets.some((secret) => validSecrets.includes(secret));

  if (!isAuthorized) {
    return failure(res, 401, 'Unauthorized', 'UNAUTHORIZED');
  }

  next();
};
