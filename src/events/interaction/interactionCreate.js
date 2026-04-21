const { openTicket, closeTicket, claimTicket } = require('../../services/ticketService');
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

        return await command.execute(interaction, client);
      }

      if (interaction.isButton()) {
        if (
          interaction.customId === 'ticket:create' ||
          interaction.customId === 'ticket:claim' ||
          interaction.customId === 'ticket:close'
        ) {
          await interaction.deferReply({ ephemeral: true });

          if (interaction.customId === 'ticket:create') {
            const result = await openTicket(interaction);
            return await interaction.editReply({ content: result.message });
          }

          if (interaction.customId === 'ticket:claim') {
            const result = await claimTicket(interaction);
            return await interaction.editReply({ content: result.message });
          }

          if (interaction.customId === 'ticket:close') {
            const result = await closeTicket(interaction);
            return await interaction.editReply({ content: result.message });
          }

          return await interaction.editReply({
            content: 'Unknown button interaction.',
          });
        }

        return;
      }
    } catch (error) {
      logger.error('Interaction handler failed.', error);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: 'An unexpected error occurred.',
        }).catch(() => null);
      }

      return interaction.reply({
        content: 'An unexpected error occurred.',
        ephemeral: true,
      }).catch(() => null);
    }
  },
};