require('./lib/env');

const client = require('./lib/client');
const logger = require('./lib/logger');
const prisma = require('./lib/prisma');
const env = require('./lib/env');
const { loadCommands } = require('./handlers/commandLoader');
const { loadEvents } = require('./handlers/eventLoader');

async function main() {
  await prisma.$connect();
  logger.info('Connected to MySQL via Prisma.');

  await loadCommands(client);
  await loadEvents(client);

  await client.login(env.DISCORD_TOKEN);
}

main().catch(async (error) => {
  logger.error('Bot startup failed.', error);
  await prisma.$disconnect().catch(() => null);
  process.exit(1);
});

process.on('SIGINT', async () => {
  logger.warn('Received SIGINT. Shutting down.');
  await prisma.$disconnect().catch(() => null);
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.warn('Received SIGTERM. Shutting down.');
  await prisma.$disconnect().catch(() => null);
  client.destroy();
  process.exit(0);
});
