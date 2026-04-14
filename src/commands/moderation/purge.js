const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createAuditLog } = require('../../services/auditLogService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of recent messages from the current channel.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('How many messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      await createAuditLog({
        guildId: interaction.guild.id,
        action: 'MESSAGES_PURGED',
        userId: interaction.user.id,
        metadata: {
          channelId: interaction.channel.id,
          amountRequested: amount,
          amountDeleted: deleted.size,
        },
      });

      return interaction.reply({
        content: `Deleted ${deleted.size} message(s). Messages older than 14 days are skipped by Discord.`,
        ephemeral: true,
      });
    } catch (error) {
      return interaction.reply({
        content: `Failed to purge messages: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
