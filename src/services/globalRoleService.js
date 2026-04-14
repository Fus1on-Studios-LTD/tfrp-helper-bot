const prisma = require('../lib/prisma');
const { createAuditLog } = require('./auditLogService');
const { getOrCreateUser } = require('./userService');

async function ensureGuildRecord(guild) {
  return prisma.guild.upsert({
    where: { id: guild.id },
    update: {
      name: guild.name,
      updatedAt: new Date(),
    },
    create: {
      id: guild.id,
      name: guild.name,
    },
  });
}

async function upsertRoleMapping({ guild, key, roleId, moderatorId }) {
  await ensureGuildRecord(guild);

  const mapping = await prisma.globalRoleMapping.upsert({
    where: {
      guildId_key: {
        guildId: guild.id,
        key,
      },
    },
    update: {
      roleId,
      updatedAt: new Date(),
    },
    create: {
      guildId: guild.id,
      key,
      roleId,
    },
  });

  await createAuditLog({
    guildId: guild.id,
    action: 'GLOBAL_ROLE_MAPPING_UPSERT',
    userId: moderatorId,
    metadata: {
      key,
      roleId,
      guildId: guild.id,
      guildName: guild.name,
    },
  });

  return mapping;
}

async function removeRoleMapping({ guildId, key, moderatorId }) {
  const removed = await prisma.globalRoleMapping.delete({
    where: {
      guildId_key: {
        guildId,
        key,
      },
    },
  }).catch(() => null);

  if (removed) {
    await createAuditLog({
      guildId,
      action: 'GLOBAL_ROLE_MAPPING_REMOVED',
      userId: moderatorId,
      metadata: { key, guildId },
    });
  }

  return removed;
}

async function listRoleMappings(guildId) {
  return prisma.globalRoleMapping.findMany({
    where: { guildId },
    orderBy: { key: 'asc' },
  });
}

async function assignGlobalRole({ client, targetDiscordId, key, moderatorId, reason = null }) {
  const user = await getOrCreateUser(targetDiscordId);
  const mappings = await prisma.globalRoleMapping.findMany();

  if (!mappings.length) {
    throw new Error('No global role mappings exist yet.');
  }

  const matchingMappings = mappings.filter((m) => m.key === key);
  if (!matchingMappings.length) {
    throw new Error(`No guild role mappings found for key "${key}".`);
  }

  const assignment = await prisma.globalRoleAssignment.upsert({
    where: {
      discordId_key: {
        discordId: targetDiscordId,
        key,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      discordId: targetDiscordId,
      key,
      assignedBy: moderatorId,
    },
  });

  const results = [];

  for (const mapping of matchingMappings) {
    const guild = client.guilds.cache.get(mapping.guildId);
    if (!guild) {
      results.push({
        guildId: mapping.guildId,
        success: false,
        error: 'Bot is not currently in this guild.',
      });
      continue;
    }

    try {
      const member = await guild.members.fetch(targetDiscordId).catch(() => null);
      if (!member) {
        results.push({
          guildId: guild.id,
          guildName: guild.name,
          success: false,
          error: 'User is not in this guild.',
        });
        continue;
      }

      await member.roles.add(mapping.roleId, reason || `Global role assignment for key ${key}`);
      results.push({
        guildId: guild.id,
        guildName: guild.name,
        success: true,
        roleId: mapping.roleId,
      });
    } catch (error) {
      results.push({
        guildId: guild.id,
        guildName: guild.name,
        success: false,
        error: error.message,
      });
    }
  }

  await createAuditLog({
    guildId: null,
    action: 'GLOBAL_ROLE_ASSIGNED',
    userId: targetDiscordId,
    metadata: {
      key,
      moderatorId,
      reason,
      assignmentId: assignment.id,
      userId: user.id,
      results,
    },
  });

  return { assignment, results };
}

async function removeGlobalRole({ client, targetDiscordId, key, moderatorId, reason = null }) {
  await prisma.globalRoleAssignment.delete({
    where: {
      discordId_key: {
        discordId: targetDiscordId,
        key,
      },
    },
  }).catch(() => null);

  const matchingMappings = await prisma.globalRoleMapping.findMany({
    where: { key },
  });

  if (!matchingMappings.length) {
    throw new Error(`No guild role mappings found for key "${key}".`);
  }

  const results = [];

  for (const mapping of matchingMappings) {
    const guild = client.guilds.cache.get(mapping.guildId);
    if (!guild) {
      results.push({
        guildId: mapping.guildId,
        success: false,
        error: 'Bot is not currently in this guild.',
      });
      continue;
    }

    try {
      const member = await guild.members.fetch(targetDiscordId).catch(() => null);
      if (!member) {
        results.push({
          guildId: guild.id,
          guildName: guild.name,
          success: false,
          error: 'User is not in this guild.',
        });
        continue;
      }

      await member.roles.remove(mapping.roleId, reason || `Global role removal for key ${key}`);
      results.push({
        guildId: guild.id,
        guildName: guild.name,
        success: true,
        roleId: mapping.roleId,
      });
    } catch (error) {
      results.push({
        guildId: guild.id,
        guildName: guild.name,
        success: false,
        error: error.message,
      });
    }
  }

  await createAuditLog({
    guildId: null,
    action: 'GLOBAL_ROLE_REMOVED',
    userId: targetDiscordId,
    metadata: {
      key,
      moderatorId,
      reason,
      results,
    },
  });

  return { results };
}

async function syncMemberRoles({ member }) {
  const assignments = await prisma.globalRoleAssignment.findMany({
    where: { discordId: member.id },
  });

  if (!assignments.length) return [];

  const mappings = await prisma.globalRoleMapping.findMany({
    where: {
      guildId: member.guild.id,
      key: {
        in: assignments.map((a) => a.key),
      },
    },
  });

  const results = [];

  for (const mapping of mappings) {
    try {
      if (!member.roles.cache.has(mapping.roleId)) {
        await member.roles.add(mapping.roleId, `Global role sync for key ${mapping.key}`);
      }

      results.push({
        key: mapping.key,
        roleId: mapping.roleId,
        success: true,
      });
    } catch (error) {
      results.push({
        key: mapping.key,
        roleId: mapping.roleId,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  ensureGuildRecord,
  upsertRoleMapping,
  removeRoleMapping,
  listRoleMappings,
  assignGlobalRole,
  removeGlobalRole,
  syncMemberRoles,
};
