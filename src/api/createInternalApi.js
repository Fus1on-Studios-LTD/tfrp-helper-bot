const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const env = require('../lib/env');
const logger = require('../lib/logger');
const authenticateApi = require('./middleware/authenticateApi');
const rateLimitInternalApi = require('./middleware/rateLimitInternalApi');
const restrictInternalApiIp = require('./middleware/restrictInternalApiIp');
const requestLogger = require('./middleware/requestLogger');
const { failure } = require('./lib/jsonResponse');

const createHealthRouter = require('./routes/health');
const createTicketRouter = require('./routes/tickets');
const createStickyRouter = require('./routes/sticky');
const createStaffRouter = require('./routes/staff');
const createSettingsRouter = require('./routes/settings');
const createModerationRouter = require('./routes/moderation');

function createInternalApi({ prisma, client }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.INTERNAL_API_TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: false,
      credentials: false,
    })
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(requestLogger);

  app.use(createHealthRouter());

  app.use(restrictInternalApiIp);
  app.use(rateLimitInternalApi);
  app.use(authenticateApi);

  app.use('/api', createTicketRouter({ prisma, client }));
  app.use('/api', createStickyRouter({ prisma, client }));
  app.use('/api', createStaffRouter({ prisma }));
  app.use('/api', createSettingsRouter({ prisma }));
  app.use('/api', createModerationRouter({ prisma, client }));

  app.use((req, res) => {
    return failure(res, 404, 'Not found', 'NOT_FOUND');
  });

  app.use((error, req, res, next) => {
    logger.error('Unhandled internal API error.', error);
    return failure(
      res,
      500,
      'Internal server error',
      'INTERNAL_API_ERROR',
      env.NODE_ENV === 'production' ? null : error.message
    );
  });

  return app;
}

module.exports = { createInternalApi };
