const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { claimTicket } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketclaim')
    .setDescription('Claim the current ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const result = await claimTicket(interaction);
    await interaction.reply({
      content: result.message,
      ephemeral: true,
    });
  },
};
