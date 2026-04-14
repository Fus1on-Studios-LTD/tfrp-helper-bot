const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { timeoutUser } = require('../../services/moderationService');

function parseDurationToMs(value) {
  const match = /^([0-9]+)(m|h|d)$/i.exec(value.trim());
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'm') return amount * 60 * 1000;
  if (unit === 'h') return amount * 60 * 60 * 1000;
  if (unit === 'd') return amount * 24 * 60 * 60 * 1000;
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member and store the action in the database.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to timeout').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('duration').setDescription('Duration like 10m, 1h, 1d').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const durationInput = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const durationMs = parseDurationToMs(durationInput);

    if (!durationMs) {
      return interaction.reply({
        content: 'Invalid duration. Use formats like 10m, 1h, or 1d.',
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        content: 'That user is not in this server.',
        ephemeral: true,
      });
    }

    await member.timeout(durationMs, reason);

    await timeoutUser({
      targetDiscordId: target.id,
      guildId: interaction.guild.id,
      reason,
      moderatorId: interaction.user.id,
      durationMs,
    });

    await interaction.reply({
      content: `Timed out **${target.tag}** for ${durationInput}.`,
      ephemeral: true,
    });
  },
};
