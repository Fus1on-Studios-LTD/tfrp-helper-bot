const { openTicket, closeTicket } = require('../../services/ticketService');
const logger = require('../../lib/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          return interaction.reply({
            content: 'Unknown command.',
            ephemeral: true,
          });
        }

        return command.execute(interaction, client);
      }

      if (interaction.isButton()) {
        if (interaction.customId === 'ticket:create') {
          const result = await openTicket(interaction);
          return interaction.reply({
            content: result.message,
            ephemeral: true,
          });
        }

        if (interaction.customId === 'ticket:close') {
          const result = await closeTicket(interaction);
          return interaction.reply({
            content: result.message,
            ephemeral: true,
          });
        }
      }
    } catch (error) {
      logger.error('Interaction handler failed.', error);

      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          content: 'An unexpected error occurred while processing that interaction.',
          ephemeral: true,
        }).catch(() => null);
      }

      return interaction.reply({
        content: 'An unexpected error occurred while processing that interaction.',
        ephemeral: true,
      }).catch(() => null);
    }
  },
};
