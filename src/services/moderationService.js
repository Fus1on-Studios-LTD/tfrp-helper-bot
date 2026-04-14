const prisma = require('../lib/prisma');
const { getOrCreateUser } = require('./userService');
const { createAuditLog } = require('./auditLogService');

async function createModerationAction({
  targetDiscordId,
  guildId = null,
  type,
  reason = null,
  moderatorId,
}) {
  const user = await getOrCreateUser(targetDiscordId);

  const action = await prisma.moderationAction.create({
    data: {
      userId: user.id,
      guildId,
      type,
      reason,
      moderatorId,
    },
  });

  await createAuditLog({
    guildId,
    action: `MODERATION_${type}`,
    userId: targetDiscordId,
    metadata: {
      targetDiscordId,
      moderatorId,
      reason,
      moderationActionId: action.id,
    },
  });

  return action;
}

async function addUserNote({ targetDiscordId, guildId, note, moderatorId }) {
  return createModerationAction({
    targetDiscordId,
    guildId,
    type: 'NOTE',
    reason: note,
    moderatorId,
  });
}

async function warnUser({ targetDiscordId, guildId, reason, moderatorId }) {
  return createModerationAction({
    targetDiscordId,
    guildId,
    type: 'WARN',
    reason,
    moderatorId,
  });
}

async function timeoutUser({ targetDiscordId, guildId, reason, moderatorId, durationMs }) {
  return createModerationAction({
    targetDiscordId,
    guildId,
    type: 'TIMEOUT',
    reason: reason || `Timed out for ${durationMs}ms`,
    moderatorId,
  });
}

async function kickUser({ targetDiscordId, guildId, reason, moderatorId }) {
  return createModerationAction({
    targetDiscordId,
    guildId,
    type: 'KICK',
    reason,
    moderatorId,
  });
}

async function banUser({ targetDiscordId, guildId, reason, moderatorId }) {
  return createModerationAction({
    targetDiscordId,
    guildId,
    type: 'BAN',
    reason,
    moderatorId,
  });
}

async function getUserHistory({ targetDiscordId, guildId = undefined, limit = 20 }) {
  const user = await prisma.user.findUnique({
    where: { discordId: targetDiscordId },
  });

  if (!user) return [];

  return prisma.moderationAction.findMany({
    where: {
      userId: user.id,
      ...(guildId ? { guildId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

module.exports = {
  createModerationAction,
  addUserNote,
  warnUser,
  timeoutUser,
  kickUser,
  banUser,
  getUserHistory,
};
