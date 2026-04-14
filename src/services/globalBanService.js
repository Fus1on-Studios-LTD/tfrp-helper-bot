const prisma = require('../lib/prisma');
const { createAuditLog } = require('./auditLogService');
const { getOrCreateUser } = require('./userService');

async function createGlobalBan({ targetDiscordId, moderatorId, reason }) {
  const user = await getOrCreateUser(targetDiscordId);

  await prisma.globalBan.upsert({
    where: { discordId: targetDiscordId },
    update: {
      reason,
      moderatorId,
    },
    create: {
      discordId: targetDiscordId,
      reason,
      moderatorId,
    },
  });

  await prisma.moderationAction.create({
    data: {
      userId: user.id,
      guildId: null,
      type: 'GLOBAL_BAN',
      reason,
      moderatorId,
    },
  });

  await createAuditLog({
    guildId: null,
    action: 'GLOBAL_BAN_CREATED',
    userId: targetDiscordId,
    metadata: { targetDiscordId, moderatorId, reason },
  });
}

async function propagateGlobalBan(client, targetDiscordId, reason) {
  const results = [];

  for (const [, guild] of client.guilds.cache) {
    try {
      await guild.members.ban(targetDiscordId, { reason: `Global ban: ${reason || 'No reason provided'}` });
      results.push({ guildId: guild.id, guildName: guild.name, success: true });
    } catch (error) {
      results.push({
        guildId: guild.id,
        guildName: guild.name,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  createGlobalBan,
  propagateGlobalBan,
};
