const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { warnUser } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user and store the warning in the database.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to warn').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the warning').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    await warnUser({
      targetDiscordId: target.id,
      guildId: interaction.guild.id,
      reason,
      moderatorId: interaction.user.id,
    });

    await interaction.reply({
      content: `Warned **${target.tag}**. Reason: ${reason}`,
      ephemeral: true,
    });
  },
};
