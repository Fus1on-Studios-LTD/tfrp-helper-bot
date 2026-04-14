const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setStaffRank } = require('../../services/staffManagementService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffrank')
    .setDescription('Set or update a staff member rank.')
    .addUserOption((option) =>
      option.setName('user').setDescription('Staff user').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('rank').setDescription('New rank').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const rank = interaction.options.getString('rank', true);

    const staff = await setStaffRank({
      targetDiscordId: target.id,
      rank,
      moderatorId: interaction.user.id,
    });

    await interaction.reply({
      content: `Updated **${target.tag}** to rank **${staff.rank}**.`,
      ephemeral: true,
    });
  },
};
