const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { kickUser } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member and store the action in the database.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to kick').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the kick').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        content: 'That user is not in this server.',
        ephemeral: true,
      });
    }

    await member.kick(reason);

    await kickUser({
      targetDiscordId: target.id,
      guildId: interaction.guild.id,
      reason,
      moderatorId: interaction.user.id,
    });

    await interaction.reply({
      content: `Kicked **${target.tag}**.`,
      ephemeral: true,
    });
  },
};
