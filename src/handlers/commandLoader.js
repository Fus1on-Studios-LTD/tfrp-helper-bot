const fs = require('node:fs');
const path = require('node:path');
const logger = require('../lib/logger');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  client.commands.clear();

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category.name);
    const files = fs.readdirSync(categoryPath).filter((file) => file.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      delete require.cache[require.resolve(filePath)];

      const command = require(filePath);

      if (!command.data || typeof command.execute !== 'function') {
        logger.warn(`Skipping invalid command file: ${filePath}`);
        continue;
      }

      client.commands.set(command.data.name, command);
      logger.info(`Loaded command /${command.data.name}`);
    }
  }

  logger.info(`Loaded ${client.commands.size} commands.`);
}

module.exports = { loadCommands };
