const env = require('../lib/env');
const logger = require('../lib/logger');
const { createInternalApi } = require('./createInternalApi');

function startInternalApi({ prisma, client }) {
  const app = createInternalApi({ prisma, client });

  const server = app.listen(env.INTERNAL_API_PORT, env.INTERNAL_API_HOST, () => {
    logger.info(`Internal bot API listening on http://${env.INTERNAL_API_HOST}:${env.INTERNAL_API_PORT}`);
  });

  return server;
}

module.exports = { startInternalApi };
