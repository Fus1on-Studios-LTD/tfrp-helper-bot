const prisma = require('../lib/prisma');
const { getOrCreateUser } = require('./userService');
const { createAuditLog } = require('./auditLogService');

async function addStaffMember({ targetDiscordId, rank, moderatorId }) {
  const user = await getOrCreateUser(targetDiscordId);

  const staff = await prisma.staffMember.upsert({
    where: { userId: user.id },
    update: {
      rank,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      rank,
      strikes: 0,
    },
  });

  await createAuditLog({
    guildId: null,
    action: 'STAFF_MEMBER_ADDED',
    userId: targetDiscordId,
    metadata: { targetDiscordId, rank, moderatorId, staffId: staff.id },
  });

  return staff;
}

async function removeStaffMember({ targetDiscordId, moderatorId }) {
  const user = await prisma.user.findUnique({
    where: { discordId: targetDiscordId },
  });

  if (!user) return null;

  const staff = await prisma.staffMember.delete({
    where: { userId: user.id },
  }).catch(() => null);

  if (staff) {
    await createAuditLog({
      guildId: null,
      action: 'STAFF_MEMBER_REMOVED',
      userId: targetDiscordId,
      metadata: { targetDiscordId, moderatorId, staffId: staff.id },
    });
  }

  return staff;
}

async function setStaffRank({ targetDiscordId, rank, moderatorId }) {
  const user = await getOrCreateUser(targetDiscordId);

  const staff = await prisma.staffMember.upsert({
    where: { userId: user.id },
    update: {
      rank,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      rank,
      strikes: 0,
    },
  });

  await createAuditLog({
    guildId: null,
    action: 'STAFF_RANK_UPDATED',
    userId: targetDiscordId,
    metadata: { targetDiscordId, rank, moderatorId, staffId: staff.id },
  });

  return staff;
}

async function addStaffStrike({ targetDiscordId, amount = 1, reason, moderatorId }) {
  const user = await getOrCreateUser(targetDiscordId);

  const existing = await prisma.staffMember.findUnique({
    where: { userId: user.id },
  });

  if (!existing) {
    throw new Error('That user is not registered as staff.');
  }

  const updated = await prisma.staffMember.update({
    where: { userId: user.id },
    data: {
      strikes: { increment: amount },
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    guildId: null,
    action: 'STAFF_STRIKE_ADDED',
    userId: targetDiscordId,
    metadata: { targetDiscordId, amount, reason, moderatorId, strikesTotal: updated.strikes },
  });

  return updated;
}

async function removeStaffStrike({ targetDiscordId, amount = 1, reason, moderatorId }) {
  const user = await prisma.user.findUnique({
    where: { discordId: targetDiscordId },
  });

  if (!user) {
    throw new Error('That user does not exist in the database.');
  }

  const existing = await prisma.staffMember.findUnique({
    where: { userId: user.id },
  });

  if (!existing) {
    throw new Error('That user is not registered as staff.');
  }

  const nextStrikes = Math.max(0, existing.strikes - amount);

  const updated = await prisma.staffMember.update({
    where: { userId: user.id },
    data: {
      strikes: nextStrikes,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    guildId: null,
    action: 'STAFF_STRIKE_REMOVED',
    userId: targetDiscordId,
    metadata: { targetDiscordId, amount, reason, moderatorId, strikesTotal: updated.strikes },
  });

  return updated;
}

async function getStaffMember(targetDiscordId) {
  const user = await prisma.user.findUnique({
    where: { discordId: targetDiscordId },
    include: { staff: true },
  });

  if (!user || !user.staff) return null;

  return {
    discordId: user.discordId,
    ...user.staff,
  };
}

async function listStaffMembers() {
  const staff = await prisma.staffMember.findMany({
    include: { user: true },
    orderBy: [{ rank: 'asc' }, { createdAt: 'asc' }],
  });

  return staff.map((entry) => ({
    id: entry.id,
    discordId: entry.user.discordId,
    rank: entry.rank,
    strikes: entry.strikes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));
}

async function getStaffStats(targetDiscordId) {
  const user = await prisma.user.findUnique({
    where: { discordId: targetDiscordId },
    include: {
      staff: true,
      actions: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!user || !user.staff) return null;

  const moderationCounts = user.actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {});

  return {
    discordId: user.discordId,
    rank: user.staff.rank,
    strikes: user.staff.strikes,
    createdAt: user.staff.createdAt,
    updatedAt: user.staff.updatedAt,
    moderationCounts,
    totalModerationActions: user.actions.length,
  };
}

module.exports = {
  addStaffMember,
  removeStaffMember,
  setStaffRank,
  addStaffStrike,
  removeStaffStrike,
  getStaffMember,
  listStaffMembers,
  getStaffStats,
};
