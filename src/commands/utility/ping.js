const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency.'),

  async execute(interaction, client) {
    await interaction.reply({
      content: `Pong! Gateway latency: ${client.ws.ping}ms`,
      ephemeral: true,
    });
  },
};
