const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildTranscript, getTicketByChannelId } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickettranscript')
    .setDescription('Generate a text transcript preview for the current ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const ticket = await getTicketByChannelId(interaction.channel.id);

    if (!ticket) {
      return interaction.reply({
        content: 'This channel is not a tracked ticket.',
        ephemeral: true,
      });
    }

    const transcript = await buildTranscript(interaction.channel);

    await interaction.reply({
      content: ['```', transcript.slice(0, 1900), '```'].join('\n'),
      ephemeral: true,
    });
  },
};
