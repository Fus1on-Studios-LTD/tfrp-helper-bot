const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { removeUserFromTicket } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketremove')
    .setDescription('Remove a user from the current ticket.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('User to remove from the ticket')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const result = await removeUserFromTicket(interaction, target.id);

    await interaction.reply({
      content: result.message,
      ephemeral: true,
    });
  },
};
