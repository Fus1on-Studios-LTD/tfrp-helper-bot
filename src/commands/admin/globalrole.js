const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const {
  upsertRoleMapping,
  removeRoleMapping,
  listRoleMappings,
  assignGlobalRole,
  removeGlobalRole,
} = require('../../services/globalRoleService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('globalrole')
    .setDescription('Manage multi-server global role groups and assignments.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('map')
        .setDescription('Map a global role key to a local role in this server.')
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('Shared global role key, like network_staff')
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('Local server role to use for this key')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('unmap')
        .setDescription('Remove a global role key mapping from this server.')
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('Shared global role key')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List all global role mappings for this server.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('assign')
        .setDescription('Assign a global role key to a user across mapped guilds.')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('User to assign')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('Shared global role key')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('reason')
            .setDescription('Optional assignment reason')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a global role key from a user across mapped guilds.')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('User to remove')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('key')
            .setDescription('Shared global role key')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('reason')
            .setDescription('Optional removal reason')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'map') {
      const key = interaction.options.getString('key', true).trim().toLowerCase();
      const role = interaction.options.getRole('role', true);

      const mapping = await upsertRoleMapping({
        guild: interaction.guild,
        key,
        roleId: role.id,
        moderatorId: interaction.user.id,
      });

      return interaction.reply({
        content: `Mapped global key **${mapping.key}** to local role ${role} in **${interaction.guild.name}**.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'unmap') {
      const key = interaction.options.getString('key', true).trim().toLowerCase();

      const removed = await removeRoleMapping({
        guildId: interaction.guild.id,
        key,
        moderatorId: interaction.user.id,
      });

      return interaction.reply({
        content: removed
          ? `Removed mapping for key **${key}** from this server.`
          : `No mapping exists for key **${key}** in this server.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'list') {
      const mappings = await listRoleMappings(interaction.guild.id);

      if (!mappings.length) {
        return interaction.reply({
          content: 'No global role mappings exist for this server.',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Global Role Mappings: ${interaction.guild.name}`)
        .setColor(0x5865F2)
        .setDescription(
          mappings.map((m, i) => `**${i + 1}.** \`${m.key}\` → <@&${m.roleId}>`).join('\n')
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    if (subcommand === 'assign') {
      const target = interaction.options.getUser('user', true);
      const key = interaction.options.getString('key', true).trim().toLowerCase();
      const reason = interaction.options.getString('reason') || null;

      await interaction.deferReply({ ephemeral: true });

      const { results } = await assignGlobalRole({
        client,
        targetDiscordId: target.id,
        key,
        moderatorId: interaction.user.id,
        reason,
      });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      return interaction.editReply({
        content: [
          `Assigned global role key **${key}** to **${target.tag}**.`,
          `Successful guild assignments: **${successCount}**`,
          `Failed guild assignments: **${failCount}**`,
          '',
          ...results.slice(0, 10).map((r) =>
            `- ${r.guildName || r.guildId}: ${r.success ? 'Success' : `Failed (${r.error})`}`
          ),
        ].join('\n'),
      });
    }

    if (subcommand === 'remove') {
      const target = interaction.options.getUser('user', true);
      const key = interaction.options.getString('key', true).trim().toLowerCase();
      const reason = interaction.options.getString('reason') || null;

      await interaction.deferReply({ ephemeral: true });

      const { results } = await removeGlobalRole({
        client,
        targetDiscordId: target.id,
        key,
        moderatorId: interaction.user.id,
        reason,
      });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      return interaction.editReply({
        content: [
          `Removed global role key **${key}** from **${target.tag}**.`,
          `Successful guild removals: **${successCount}**`,
          `Failed guild removals: **${failCount}**`,
          '',
          ...results.slice(0, 10).map((r) =>
            `- ${r.guildName || r.guildId}: ${r.success ? 'Success' : `Failed (${r.error})`}`
          ),
        ].join('\n'),
      });
    }

    return interaction.reply({
      content: 'Unknown subcommand.',
      ephemeral: true,
    });
  },
};
