const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createTicketPanel, getGuildTicketConfig } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Post the ticket creation panel in a channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel to post the ticket panel in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const guildConfig = await getGuildTicketConfig(interaction.guild.id);

    if (!guildConfig?.ticketCategoryId) {
      return interaction.reply({
        content: 'This server does not have a ticket category configured yet. Save Guild Settings first.',
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel', true);
    await createTicketPanel(channel);

    await interaction.reply({
      content: `Ticket panel posted in ${channel}.`,
      ephemeral: true,
    });
  },
};
