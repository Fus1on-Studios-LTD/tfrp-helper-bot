const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addUserToTicket } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketadd')
    .setDescription('Add a user to the current ticket.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('User to add to the ticket')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const result = await addUserToTicket(interaction, target.id);

    await interaction.reply({
      content: result.message,
      ephemeral: true,
    });
  },
};
