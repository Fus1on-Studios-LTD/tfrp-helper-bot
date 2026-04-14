const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addStaffStrike, removeStaffStrike } = require('../../services/staffManagementService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffstrike')
    .setDescription('Add or remove staff strikes.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add strike(s) to a staff member.')
        .addUserOption((option) =>
          option.setName('user').setDescription('Staff user').setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('amount').setDescription('Number of strikes').setRequired(false).setMinValue(1)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Reason for the strike').setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove strike(s) from a staff member.')
        .addUserOption((option) =>
          option.setName('user').setDescription('Staff user').setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('amount').setDescription('Number of strikes to remove').setRequired(false).setMinValue(1)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Reason for strike removal').setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount') || 1;
    const reason = interaction.options.getString('reason') || null;

    try {
      if (subcommand === 'add') {
        const updated = await addStaffStrike({
          targetDiscordId: target.id,
          amount,
          reason,
          moderatorId: interaction.user.id,
        });

        return interaction.reply({
          content: `Added ${amount} strike(s) to **${target.tag}**. Total strikes: **${updated.strikes}**.`,
          ephemeral: true,
        });
      }

      const updated = await removeStaffStrike({
        targetDiscordId: target.id,
        amount,
        reason,
        moderatorId: interaction.user.id,
      });

      return interaction.reply({
        content: `Removed ${amount} strike(s) from **${target.tag}**. Total strikes: **${updated.strikes}**.`,
        ephemeral: true,
      });
    } catch (error) {
      return interaction.reply({
        content: error.message,
        ephemeral: true,
      });
    }
  },
};
