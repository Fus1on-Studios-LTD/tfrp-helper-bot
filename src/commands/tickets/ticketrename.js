const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { renameTicket } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketrename')
    .setDescription('Rename the current ticket channel.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('New ticket name')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const result = await renameTicket(interaction, name);

    await interaction.reply({
      content: result.message,
      ephemeral: true,
    });
  },
};
