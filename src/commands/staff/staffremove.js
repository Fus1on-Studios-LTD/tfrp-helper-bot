const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { removeStaffMember } = require('../../services/staffManagementService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffremove')
    .setDescription('Remove a user from the staff system.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to remove').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);

    const removed = await removeStaffMember({
      targetDiscordId: target.id,
      moderatorId: interaction.user.id,
    });

    if (!removed) {
      return interaction.reply({
        content: 'That user is not currently registered as staff.',
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `Removed **${target.tag}** from staff.`,
      ephemeral: true,
    });
  },
};
