const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addStaffMember } = require('../../services/staffManagementService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffadd')
    .setDescription('Add a user to the staff system.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to add').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('rank').setDescription('Starting staff rank').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const rank = interaction.options.getString('rank', true);

    const staff = await addStaffMember({
      targetDiscordId: target.id,
      rank,
      moderatorId: interaction.user.id,
    });

    await interaction.reply({
      content: `Added **${target.tag}** to staff with rank **${staff.rank}**.`,
      ephemeral: true,
    });
  },
};
