const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addUserNote } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notes')
    .setDescription('Add an internal moderation note for a user.')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to note').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('note').setDescription('Internal note').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const note = interaction.options.getString('note', true);

    await addUserNote({
      targetDiscordId: target.id,
      guildId: interaction.guild.id,
      note,
      moderatorId: interaction.user.id,
    });

    await interaction.reply({
      content: `Saved note for **${target.tag}**.`,
      ephemeral: true,
    });
  },
};
