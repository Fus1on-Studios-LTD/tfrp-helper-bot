const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listStaffMembers } = require('../../services/staffManagementService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stafflist')
    .setDescription('List all registered staff members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const staff = await listStaffMembers();

    if (!staff.length) {
      return interaction.reply({
        content: 'No staff members are currently registered.',
        ephemeral: true,
      });
    }

    const lines = staff.slice(0, 20).map((entry, index) => (
      `**${index + 1}.** <@${entry.discordId}> — ${entry.rank} — ${entry.strikes} strike(s)`
    ));

    const embed = new EmbedBuilder()
      .setTitle('Registered Staff Members')
      .setColor(0x5865F2)
      .setDescription(lines.join('\n'));

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
