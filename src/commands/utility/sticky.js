const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setSticky, removeSticky, getSticky } = require('../../services/stickyMessageService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sticky')
    .setDescription('Manage sticky messages in the current channel.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set the sticky message for this channel.')
        .addStringOption((option) =>
          option
            .setName('content')
            .setDescription('Sticky message content')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove the sticky message from this channel.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('view')
        .setDescription('View the current sticky message in this channel.')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      const content = interaction.options.getString('content', true);

      await setSticky({
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        content,
      });

      return interaction.reply({
        content: 'Sticky message saved for this channel.',
        ephemeral: true,
      });
    }

    if (subcommand === 'remove') {
      await removeSticky(interaction.guild.id, interaction.channel.id);

      return interaction.reply({
        content: 'Sticky message removed from this channel.',
        ephemeral: true,
      });
    }

    const sticky = await getSticky(interaction.guild.id, interaction.channel.id);

    return interaction.reply({
      content: sticky ? `Current sticky message:\n${sticky.content}` : 'There is no sticky message in this channel.',
      ephemeral: true,
    });
  },
};
