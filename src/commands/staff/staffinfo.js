const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getStaffMember } = require('../../services/staffManagementService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffinfo')
    .setDescription('View staff profile information.')
    .addUserOption((option) =>
      option.setName('user').setDescription('Staff user').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const staff = await getStaffMember(target.id);

    if (!staff) {
      return interaction.reply({
        content: 'That user is not registered as staff.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Staff Info: ${target.tag}`)
      .setColor(0x5865F2)
      .addFields(
        { name: 'Rank', value: staff.rank || 'Unknown', inline: true },
        { name: 'Strikes', value: String(staff.strikes ?? 0), inline: true },
        { name: 'Added', value: `<t:${Math.floor(new Date(staff.createdAt).getTime() / 1000)}:R>`, inline: true },
      );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
