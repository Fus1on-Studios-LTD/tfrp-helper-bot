const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const env = require('../lib/env');
const logger = require('../lib/logger');
const authenticateApi = require('./middleware/authenticateApi');
const createHealthRouter = require('./routes/health');
const createTicketRouter = require('./routes/tickets');
const createStickyRouter = require('./routes/sticky');
const createStaffRouter = require('./routes/staff');
const createSettingsRouter = require('./routes/settings');

function createInternalApi({ prisma, client }) {
  const app = express();

  app.set('trust proxy', env.INTERNAL_API_TRUST_PROXY);
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use(createHealthRouter());
  app.use(authenticateApi);
  app.use('/api', createTicketRouter({ prisma, client }));
  app.use('/api', createStickyRouter({ prisma, client }));
  app.use('/api', createStaffRouter({ prisma }));
  app.use('/api', createSettingsRouter({ prisma }));

  app.use((error, req, res, next) => {
    logger.error('Unhandled internal API error.', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  });

  return app;
}

module.exports = { createInternalApi };
