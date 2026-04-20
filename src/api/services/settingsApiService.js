async function upsertGuildConfig({
  prisma,
  guildId,
  modLogChannelId = null,
  ticketCategoryId = null,
  ticketLogChannelId = null,
  stickyCooldownMs = 15000,
  actorId = null,
  guildName = null,
}) {
  if (!guildId) {
    throw new Error('Guild ID is required.');
  }

  if (Number.isNaN(Number(stickyCooldownMs)) || Number(stickyCooldownMs) < 0) {
    throw new Error('Sticky cooldown must be a valid non-negative number.');
  }

  await prisma.guild.upsert({
    where: { id: guildId },
    update: {
      name: guildName || `Guild ${guildId}`,
      updatedAt: new Date(),
    },
    create: {
      id: guildId,
      name: guildName || `Guild ${guildId}`,
    },
  });

  const config = await prisma.guildConfig.upsert({
    where: { guildId },
    update: {
      modLogChannelId,
      ticketCategoryId,
      ticketLogChannelId,
      stickyCooldownMs: Number(stickyCooldownMs),
      updatedAt: new Date(),
    },
    create: {
      guildId,
      modLogChannelId,
      ticketCategoryId,
      ticketLogChannelId,
      stickyCooldownMs: Number(stickyCooldownMs),
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId,
      action: 'INTERNAL_API_GUILD_CONFIG_UPDATED',
      userId: actorId || null,
      metadata: {
        modLogChannelId,
        ticketCategoryId,
        ticketLogChannelId,
        stickyCooldownMs: Number(stickyCooldownMs),
      },
    },
  });

  return config;
}

module.exports = {
  upsertGuildConfig,
};