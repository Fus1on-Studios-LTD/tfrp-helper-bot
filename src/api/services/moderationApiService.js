async function ensureUser(prisma, discordId) {
  return prisma.user.upsert({
    where: { discordId },
    update: {},
    create: { discordId },
  });
}

async function createModerationAction({
  prisma,
  guildId = null,
  targetDiscordId,
  moderatorId,
  type,
  reason = null,
}) {
  const user = await ensureUser(prisma, targetDiscordId);

  const action = await prisma.moderationAction.create({
    data: {
      userId: user.id,
      guildId,
      type,
      reason,
      moderatorId,
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId,
      action: `INTERNAL_API_MODERATION_${type}`,
      userId: moderatorId,
      metadata: {
        targetDiscordId,
        moderatorId,
        type,
        reason,
        moderationActionId: action.id,
      },
    },
  });

  return action;
}

async function warnMember({ prisma, guildId, targetDiscordId, moderatorId, reason }) {
  return createModerationAction({
    prisma,
    guildId,
    targetDiscordId,
    moderatorId,
    type: "WARN",
    reason,
  });
}

async function noteMember({ prisma, guildId, targetDiscordId, moderatorId, reason }) {
  return createModerationAction({
    prisma,
    guildId,
    targetDiscordId,
    moderatorId,
    type: "NOTE",
    reason,
  });
}

async function timeoutMember({ prisma, client, guildId, targetDiscordId, moderatorId, reason, durationMs }) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new Error("Guild not found.");

  const member = await guild.members.fetch(targetDiscordId).catch(() => null);
  if (!member) throw new Error("Member not found in guild.");

  await member.timeout(durationMs, reason || "Timed out from dashboard");

  await createModerationAction({
    prisma,
    guildId,
    targetDiscordId,
    moderatorId,
    type: "TIMEOUT",
    reason: reason || `Timed out for ${durationMs}ms`,
  });

  return { ok: true };
}

async function kickMember({ prisma, client, guildId, targetDiscordId, moderatorId, reason }) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new Error("Guild not found.");

  const member = await guild.members.fetch(targetDiscordId).catch(() => null);
  if (!member) throw new Error("Member not found in guild.");

  await member.kick(reason || "Kicked from dashboard");

  await createModerationAction({
    prisma,
    guildId,
    targetDiscordId,
    moderatorId,
    type: "KICK",
    reason,
  });

  return { ok: true };
}

async function banMember({ prisma, client, guildId, targetDiscordId, moderatorId, reason }) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new Error("Guild not found.");

  await guild.members.ban(targetDiscordId, {
    reason: reason || "Banned from dashboard",
  });

  await createModerationAction({
    prisma,
    guildId,
    targetDiscordId,
    moderatorId,
    type: "BAN",
    reason,
  });

  return { ok: true };
}

async function lookupUserHistory({ prisma, targetDiscordId, guildId = null }) {
  const user = await prisma.user.findUnique({
    where: { discordId: targetDiscordId },
  });

  if (!user) {
    return {
      targetDiscordId,
      actions: [],
    };
  }

  const actions = await prisma.moderationAction.findMany({
    where: {
      userId: user.id,
      ...(guildId ? { guildId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return {
    targetDiscordId,
    actions,
  };
}

module.exports = {
  warnMember,
  noteMember,
  timeoutMember,
  kickMember,
  banMember,
  lookupUserHistory,
};
