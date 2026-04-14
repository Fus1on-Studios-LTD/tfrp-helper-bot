const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getUserHistory } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View stored moderation history for a user.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to inspect').setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName('global').setDescription('Include all guild history instead of only this server').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const includeGlobal = interaction.options.getBoolean('global') || false;

    const history = await getUserHistory({
      targetDiscordId: target.id,
      guildId: includeGlobal ? undefined : interaction.guild.id,
      limit: 15,
    });

    if (!history.length) {
      return interaction.reply({
        content: `No moderation history found for **${target.tag}**.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Moderation History: ${target.tag}`)
      .setColor(0x2F3136)
      .setDescription(
        history.map((entry, index) => {
          const when = Math.floor(new Date(entry.createdAt).getTime() / 1000);
          return `**${index + 1}. ${entry.type}**\nReason: ${entry.reason || 'None'}\nModerator: <@${entry.moderatorId}>\nWhen: <t:${when}:R>`;
        }).join('\n\n')
      );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
