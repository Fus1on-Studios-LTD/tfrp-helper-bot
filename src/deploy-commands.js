require('./lib/env');

const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const env = require('./lib/env');
const logger = require('./lib/logger');

async function getCommandData() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const categories = fs.readdirSync(commandsPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category.name);
    const files = fs.readdirSync(categoryPath).filter((file) => file.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);

      if (command?.data) {
        commands.push(command.data.toJSON());
      }
    }
  }

  return commands;
}

async function main() {
  const commands = await getCommandData();
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  if (env.DISCORD_TEST_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_TEST_GUILD_ID),
      { body: commands }
    );
    logger.info(`Deployed ${commands.length} guild commands to ${env.DISCORD_TEST_GUILD_ID}`);
    return;
  }

  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commands });
  logger.info(`Deployed ${commands.length} global commands`);
}

main().catch((error) => {
  logger.error('Failed to deploy slash commands.', error);
  process.exit(1);
});
