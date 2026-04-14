const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createTicketPanel } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Post the ticket panel in the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await createTicketPanel(interaction.channel);

    await interaction.reply({
      content: 'Ticket panel posted.',
      ephemeral: true,
    });
  },
};
