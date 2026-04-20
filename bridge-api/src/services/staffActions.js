async function upsertStaff({ prisma, discordId, rank, actorId }) {
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
      action: 'BRIDGE_STAFF_UPSERTED',
      userId: actorId || null,
      metadata: { discordId, rank, staffId: staff.id },
    },
  });

  return staff;
}

async function changeStaffStrikes({ prisma, discordId, amount, mode, actorId }) {
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
      action: mode === 'remove' ? 'BRIDGE_STAFF_STRIKE_REMOVED' : 'BRIDGE_STAFF_STRIKE_ADDED',
      userId: actorId || null,
      metadata: { discordId, amount, strikesTotal: updated.strikes },
    },
  });

  return updated;
}

module.exports = {
  upsertStaff,
  changeStaffStrikes,
};
