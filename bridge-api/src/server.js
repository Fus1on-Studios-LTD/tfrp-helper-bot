require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });
require('./lib/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./lib/env');
const logger = require('./lib/logger');
const authenticate = require('./middleware/authenticate');
const createHealthRouter = require('./routes/health');
const createTicketRouter = require('./routes/tickets');
const createStickyRouter = require('./routes/sticky');
const createStaffRouter = require('./routes/staff');

const prisma = require('../../src/lib/prisma');
const client = require('../../src/lib/client');

const app = express();

app.set('trust proxy', env.BRIDGE_TRUST_PROXY);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use(createHealthRouter());
app.use(authenticate);
app.use('/api', createTicketRouter({ prisma, client }));
app.use('/api', createStickyRouter({ prisma, client }));
app.use('/api', createStaffRouter({ prisma }));

app.use((error, req, res, next) => {
  logger.error('Unhandled bridge error.', error);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

app.listen(env.BRIDGE_PORT, env.BRIDGE_HOST, () => {
  logger.info(`Dashboard API bridge listening on http://${env.BRIDGE_HOST}:${env.BRIDGE_PORT}`);
});
