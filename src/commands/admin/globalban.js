const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createGlobalBan, propagateGlobalBan } = require('../../services/globalBanService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('globalban')
    .setDescription('Ban a user across every server the bot can access.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to globally ban')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for the global ban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.deferReply({ ephemeral: true });

    await createGlobalBan({
      targetDiscordId: target.id,
      moderatorId: interaction.user.id,
      reason,
    });

    const results = await propagateGlobalBan(client, target.id, reason);

    const successCount = results.filter((item) => item.success).length;
    const failCount = results.length - successCount;

    const preview = results
      .slice(0, 8)
      .map((item) => `- ${item.guildName}: ${item.success ? 'Banned' : `Failed (${item.error})`}`)
      .join('\n');

    await interaction.editReply({
      content: [
        `Global ban stored for **${target.tag}**.`,
        `Successful guild bans: **${successCount}**`,
        `Failed guild bans: **${failCount}**`,
        preview ? `\nResults:\n${preview}` : '',
      ].join('\n'),
    });
  },
};
