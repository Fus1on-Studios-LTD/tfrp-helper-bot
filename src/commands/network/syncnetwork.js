const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { syncLinkedUserNetworkMemberships } = require('../../services/networkSyncService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('syncnetwork')
    .setDescription('Sync a linked user into network guilds based on configured source roles.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to sync. Defaults to yourself.').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    await interaction.deferReply({ ephemeral: true });

    try {
      const results = await syncLinkedUserNetworkMemberships(target.id);
      const lines = results.length
        ? results.slice(0, 20).map((result) => {
            const targetGuild = result.targetGuildId || result.sourceGuildId;
            return `- ${targetGuild}: ${result.ok ? (result.skipped ? `Skipped (${result.reason})` : 'Success') : `Failed (${result.error})`}`;
          })
        : ['- No sync rules matched.'];

      await interaction.editReply({
        content: [`Network sync completed for **${target.tag}**.`, '', ...lines].join('\n'),
      });
    } catch (error) {
      await interaction.editReply({
        content: `Network sync failed: ${error.message}`,
      });
    }
  },
};
