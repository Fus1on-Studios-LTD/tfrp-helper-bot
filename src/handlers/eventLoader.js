const fs = require('node:fs');
const path = require('node:path');
const logger = require('../lib/logger');

async function loadEvents(client) {
  const eventsRoot = path.join(__dirname, '..', 'events');
  const categories = fs.readdirSync(eventsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  for (const category of categories) {
    const categoryPath = path.join(eventsRoot, category.name);
    const files = fs.readdirSync(categoryPath).filter((file) => file.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      delete require.cache[require.resolve(filePath)];

      const event = require(filePath);

      if (!event.name || typeof event.execute !== 'function') {
        logger.warn(`Skipping invalid event file: ${filePath}`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      logger.info(`Loaded event ${event.name}`);
    }
  }
}

module.exports = { loadEvents };
