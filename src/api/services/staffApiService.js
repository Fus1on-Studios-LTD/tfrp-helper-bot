async function upsertStaff({ prisma, discordId, rank, note = null, actorId }) {
  const user = await prisma.user.upsert({
    where: { discordId },
    update: {},
    create: { discordId },
  });

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

  await prisma.auditLog.create({
    data: {
      action: 'INTERNAL_API_STAFF_UPSERTED',
      userId: actorId || null,
      metadata: {
        discordId,
        rank,
        note,
        staffId: staff.id,
      },
    },
  });

  return staff;
}

async function changeStaffStrikes({ prisma, discordId, amount, mode, actorId, reason = null }) {
  const user = await prisma.user.findUnique({
    where: { discordId },
    include: { staff: true },
  });

  if (!user?.staff) {
    throw new Error('Staff member not found.');
  }

  const nextStrikes =
    mode === 'remove'
      ? Math.max(0, user.staff.strikes - amount)
      : user.staff.strikes + amount;

  const updated = await prisma.staffMember.update({
    where: { userId: user.id },
    data: {
      strikes: nextStrikes,
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: mode === 'remove' ? 'INTERNAL_API_STAFF_STRIKE_REMOVED' : 'INTERNAL_API_STAFF_STRIKE_ADDED',
      userId: actorId || null,
      metadata: {
        discordId,
        amount,
        reason,
        strikesTotal: updated.strikes,
      },
    },
  });

  return updated;
}

async function removeStaff({ prisma, discordId, actorId, reason = null }) {
  const user = await prisma.user.findUnique({
    where: { discordId },
    include: { staff: true },
  });

  if (!user?.staff) {
    throw new Error('Staff member not found.');
  }

  const removed = await prisma.staffMember.delete({
    where: { userId: user.id },
  });

  await prisma.auditLog.create({
    data: {
      action: 'INTERNAL_API_STAFF_REMOVED',
      userId: actorId || null,
      metadata: {
        discordId,
        reason,
        staffId: removed.id,
      },
    },
  });

  return removed;
}

async function getStaffProfile({ prisma, discordId, guildId = null }) {
  const user = await prisma.user.findUnique({
    where: { discordId },
    include: {
      staff: true,
      actions: {
        where: guildId ? { guildId } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!user?.staff) {
    throw new Error('Staff member not found.');
  }

  const breakdown = user.actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {});

  const recentAudit = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userId: discordId },
        {
          metadata: {
            path: '$.discordId',
            equals: discordId,
          },
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    discordId,
    rank: user.staff.rank,
    strikes: user.staff.strikes,
    createdAt: user.staff.createdAt,
    updatedAt: user.staff.updatedAt,
    totalModerationActions: user.actions.length,
    moderationBreakdown: breakdown,
    recentActions: user.actions,
    recentAudit,
  };
}

module.exports = {
  upsertStaff,
  changeStaffStrikes,
  removeStaff,
  getStaffProfile,
};
