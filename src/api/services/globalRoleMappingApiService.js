async function listGlobalRoleMappings({ prisma, guildId = null }) {
  return prisma.globalRoleMapping.findMany({
    where: guildId ? { guildId } : {},
    orderBy: [{ guildId: "asc" }, { key: "asc" }],
    take: 300,
  });
}

async function upsertGlobalRoleMapping({ prisma, guildId, key, roleId, actorId = null }) {
  if (!guildId || !key || !roleId) {
    throw new Error("guildId, key, and roleId are required.");
  }

  const normalizedKey = String(key).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");

  const mapping = await prisma.globalRoleMapping.upsert({
    where: { guildId_key: { guildId, key: normalizedKey } },
    update: { roleId, updatedAt: new Date() },
    create: { guildId, key: normalizedKey, roleId },
  });

  await prisma.auditLog.create({
    data: {
      guildId,
      action: "GLOBAL_ROLE_MAPPING_UPSERTED",
      userId: actorId,
      metadata: { mappingId: mapping.id, key: normalizedKey, roleId },
    },
  });

  return mapping;
}

async function deleteGlobalRoleMapping({ prisma, mappingId, actorId = null }) {
  if (!mappingId) throw new Error("mappingId is required.");

  const existing = await prisma.globalRoleMapping.findUnique({ where: { id: mappingId } });
  if (!existing) throw new Error("Global role mapping not found.");

  await prisma.globalRoleMapping.delete({ where: { id: mappingId } });

  await prisma.auditLog.create({
    data: {
      guildId: existing.guildId,
      action: "GLOBAL_ROLE_MAPPING_DELETED",
      userId: actorId,
      metadata: { mappingId: existing.id, key: existing.key, roleId: existing.roleId },
    },
  });

  return existing;
}

module.exports = {
  listGlobalRoleMappings,
  upsertGlobalRoleMapping,
  deleteGlobalRoleMapping,
};
