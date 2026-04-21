const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { unlinkDiscordAccount } = require('../../services/networkAuthService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Remove your linked Discord OAuth account from the network sync system.'),

  async execute(interaction) {
    await unlinkDiscordAccount(interaction.user.id);

    await prisma.auditLog.create({
      data: {
        action: 'NETWORK_OAUTH_LINK_REMOVED',
        userId: interaction.user.id,
      },
    });

    await interaction.reply({
      content: 'Your linked Discord OAuth account has been removed.',
      ephemeral: true,
    });
  },
};
