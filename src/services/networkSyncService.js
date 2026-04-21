const prisma = require('../lib/prisma');
const client = require('../lib/client');
const logger = require('../lib/logger');
const { getValidAccessToken } = require('./networkAuthService');

async function addUserToGuild({ discordId, guildId, accessToken, botToken }) {
  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
    method: 'PUT',
    headers: {
      authorization: `Bot ${botToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok && response.status !== 201 && response.status !== 204) {
    throw new Error(json?.message || `Failed to add user ${discordId} to guild ${guildId}.`);
  }

  return json;
}

async function applyMappedRoleForKey({ guildId, member, key }) {
  if (!key) return { ok: true, skipped: true };

  const mapping = await prisma.globalRoleMapping.findUnique({
    where: { guildId_key: { guildId, key } },
  });

  if (!mapping) {
    throw new Error(`No global role mapping found for key "${key}" in guild ${guildId}.`);
  }

  await member.roles.add(mapping.roleId, `Network sync role assignment for key ${key}`);
  return { ok: true, roleId: mapping.roleId };
}

async function syncLinkedUserNetworkMemberships(discordId) {
  const accessToken = await getValidAccessToken(discordId);
  const botToken = process.env.DISCORD_TOKEN;
  if (!botToken) throw new Error('Missing DISCORD_TOKEN.');

  const rules = await prisma.networkSyncRule.findMany({
    where: { enabled: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!rules.length) return [];

  const rulesBySourceGuild = new Map();
  for (const rule of rules) {
    const bucket = rulesBySourceGuild.get(rule.sourceGuildId) || [];
    bucket.push(rule);
    rulesBySourceGuild.set(rule.sourceGuildId, bucket);
  }

  const results = [];

  for (const [sourceGuildId, sourceRules] of rulesBySourceGuild.entries()) {
    const sourceGuild = client.guilds.cache.get(sourceGuildId);
    if (!sourceGuild) {
      results.push({ sourceGuildId, ok: false, error: 'Source guild not found in bot cache.' });
      continue;
    }

    const member = await sourceGuild.members.fetch(discordId).catch(() => null);
    if (!member) {
      results.push({ sourceGuildId, ok: false, error: 'User is not present in source guild.' });
      continue;
    }

    const memberRoleIds = new Set(member.roles.cache.keys());

    for (const rule of sourceRules) {
      if (!memberRoleIds.has(rule.sourceRoleId)) {
        results.push({
          sourceGuildId: rule.sourceGuildId,
          targetGuildId: rule.targetGuildId,
          ok: true,
          skipped: true,
          reason: 'Source role not present.',
        });
        continue;
      }

      try {
        await addUserToGuild({
          discordId,
          guildId: rule.targetGuildId,
          accessToken,
          botToken,
        });

        const targetGuild =
          client.guilds.cache.get(rule.targetGuildId) ||
          (await client.guilds.fetch(rule.targetGuildId).catch(() => null));

        if (!targetGuild) throw new Error('Target guild not found.');

        const targetMember = await targetGuild.members.fetch(discordId).catch(() => null);
        if (!targetMember) throw new Error('User did not appear in target guild after join.');

        if (rule.globalRoleKey) {
          await applyMappedRoleForKey({
            guildId: targetGuild.id,
            member: targetMember,
            key: rule.globalRoleKey,
          });
        }

        await prisma.auditLog.create({
          data: {
            guildId: rule.targetGuildId,
            action: 'NETWORK_SYNC_USER_JOINED',
            userId: discordId,
            metadata: {
              sourceGuildId: rule.sourceGuildId,
              sourceRoleId: rule.sourceRoleId,
              targetGuildId: rule.targetGuildId,
              globalRoleKey: rule.globalRoleKey || null,
            },
          },
        });

        results.push({
          sourceGuildId: rule.sourceGuildId,
          targetGuildId: rule.targetGuildId,
          ok: true,
          globalRoleKey: rule.globalRoleKey || null,
        });
      } catch (error) {
        logger.error('Network sync rule failed.', error);
        results.push({
          sourceGuildId: rule.sourceGuildId,
          targetGuildId: rule.targetGuildId,
          ok: false,
          error: error.message,
        });
      }
    }
  }

  return results;
}

async function syncAllLinkedUsers() {
  const linkedUsers = await prisma.linkedDiscordAccount.findMany({
    select: { discordId: true },
  });

  const summary = [];
  for (const linked of linkedUsers) {
    try {
      const results = await syncLinkedUserNetworkMemberships(linked.discordId);
      summary.push({ discordId: linked.discordId, ok: true, results });
    } catch (error) {
      summary.push({ discordId: linked.discordId, ok: false, error: error.message });
    }
  }

  return summary;
}

function startNetworkAutoJoinService() {
  const intervalMs = Number(process.env.NETWORK_SYNC_INTERVAL_MS || 10 * 60 * 1000);
  setInterval(async () => {
    try {
      await syncAllLinkedUsers();
    } catch (error) {
      logger.error('Network auto-join cycle failed.', error);
    }
  }, intervalMs);
}

module.exports = {
  syncLinkedUserNetworkMemberships,
  syncAllLinkedUsers,
  startNetworkAutoJoinService,
};
