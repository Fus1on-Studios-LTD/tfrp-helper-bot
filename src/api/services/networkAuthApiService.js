const { createLinkSession, completeLinkSession } = require('../../services/networkAuthService');
const prisma = require('../../lib/prisma');

async function createLinkUrl({ discordId }) {
  const session = await createLinkSession(discordId);
  return { state: session.state, url: session.url };
}

async function completeOAuthCallback({ state, code }) {
  const result = await completeLinkSession({ state, code });

  await prisma.auditLog.create({
    data: {
      action: 'NETWORK_OAUTH_LINK_COMPLETED',
      userId: result.discordId,
      metadata: {
        username: result.username,
        global_name: result.global_name,
      },
    },
  });

  return result;
}

module.exports = { createLinkUrl, completeOAuthCallback };
