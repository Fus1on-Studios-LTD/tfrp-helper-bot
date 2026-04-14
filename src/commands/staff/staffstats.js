const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getStaffStats } = require('../../services/staffManagementService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffstats')
    .setDescription('View tracked staff stats for a user.')
    .addUserOption((option) =>
      option.setName('user').setDescription('Staff user').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const stats = await getStaffStats(target.id);

    if (!stats) {
      return interaction.reply({
        content: 'That user is not registered as staff.',
        ephemeral: true,
      });
    }

    const moderationLines = Object.keys(stats.moderationCounts).length
      ? Object.entries(stats.moderationCounts).map(([type, count]) => `- ${type}: ${count}`).join('\n')
      : 'No tracked moderation actions yet.';

    const embed = new EmbedBuilder()
      .setTitle(`Staff Stats: ${target.tag}`)
      .setColor(0x57F287)
      .addFields(
        { name: 'Rank', value: stats.rank || 'Unknown', inline: true },
        { name: 'Strikes', value: String(stats.strikes ?? 0), inline: true },
        { name: 'Total Logged Actions', value: String(stats.totalModerationActions), inline: true },
        { name: 'Moderation Breakdown', value: moderationLines, inline: false },
      );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
