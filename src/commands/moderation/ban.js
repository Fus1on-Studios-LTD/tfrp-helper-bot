const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { banUser } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from this server and store the action in the database.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the ban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.guild.members.ban(target.id, { reason });

    await banUser({
      targetDiscordId: target.id,
      guildId: interaction.guild.id,
      reason,
      moderatorId: interaction.user.id,
    });

    await interaction.reply({
      content: `Banned **${target.tag}**.`,
      ephemeral: true,
    });
  },
};
