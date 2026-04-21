async function listNetworkRules({ prisma }) {
  return prisma.networkSyncRule.findMany({
    orderBy: [{ enabled: "desc" }, { sourceGuildId: "asc" }, { targetGuildId: "asc" }],
    take: 200,
  });
}

async function upsertNetworkRule({
  prisma,
  sourceGuildId,
  sourceRoleId,
  targetGuildId,
  globalRoleKey = null,
  enabled = true,
  actorId = null,
}) {
  if (!sourceGuildId || !sourceRoleId || !targetGuildId) {
    throw new Error("sourceGuildId, sourceRoleId, and targetGuildId are required.");
  }

  const rule = await prisma.networkSyncRule.upsert({
    where: {
      sourceGuildId_sourceRoleId_targetGuildId: {
        sourceGuildId,
        sourceRoleId,
        targetGuildId,
      },
    },
    update: {
      globalRoleKey: globalRoleKey || null,
      enabled: Boolean(enabled),
      updatedAt: new Date(),
    },
    create: {
      sourceGuildId,
      sourceRoleId,
      targetGuildId,
      globalRoleKey: globalRoleKey || null,
      enabled: Boolean(enabled),
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId: targetGuildId,
      action: "NETWORK_SYNC_RULE_UPSERTED",
      userId: actorId,
      metadata: {
        ruleId: rule.id,
        sourceGuildId,
        sourceRoleId,
        targetGuildId,
        globalRoleKey: globalRoleKey || null,
        enabled: Boolean(enabled),
      },
    },
  });

  return rule;
}

async function deleteNetworkRule({ prisma, ruleId, actorId = null }) {
  if (!ruleId) throw new Error("ruleId is required.");

  const existing = await prisma.networkSyncRule.findUnique({
    where: { id: ruleId },
  });

  if (!existing) throw new Error("Network sync rule not found.");

  await prisma.networkSyncRule.delete({
    where: { id: ruleId },
  });

  await prisma.auditLog.create({
    data: {
      guildId: existing.targetGuildId,
      action: "NETWORK_SYNC_RULE_DELETED",
      userId: actorId,
      metadata: {
        ruleId: existing.id,
        sourceGuildId: existing.sourceGuildId,
        sourceRoleId: existing.sourceRoleId,
        targetGuildId: existing.targetGuildId,
        globalRoleKey: existing.globalRoleKey || null,
      },
    },
  });

  return existing;
}

async function toggleNetworkRule({ prisma, ruleId, enabled, actorId = null }) {
  if (!ruleId) throw new Error("ruleId is required.");

  const updated = await prisma.networkSyncRule.update({
    where: { id: ruleId },
    data: {
      enabled: Boolean(enabled),
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId: updated.targetGuildId,
      action: "NETWORK_SYNC_RULE_TOGGLED",
      userId: actorId,
      metadata: {
        ruleId: updated.id,
        enabled: Boolean(enabled),
      },
    },
  });

  return updated;
}

module.exports = {
  listNetworkRules,
  upsertNetworkRule,
  deleteNetworkRule,
  toggleNetworkRule,
};
