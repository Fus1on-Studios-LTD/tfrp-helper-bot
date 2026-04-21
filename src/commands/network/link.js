const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { createLinkSession } = require('../../services/networkAuthService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account for cross-server sync and network joins.'),

  async execute(interaction) {
    const session = await createLinkSession(interaction.user.id);

    await prisma.auditLog.create({
      data: {
        action: 'NETWORK_OAUTH_LINK_STARTED',
        userId: interaction.user.id,
        metadata: { state: session.state },
      },
    });

    await interaction.reply({
      content: [
        'Use the link below to authorize your Discord account for network sync.',
        '',
        session.url,
      ].join('\n'),
      ephemeral: true,
    });
  },
};
