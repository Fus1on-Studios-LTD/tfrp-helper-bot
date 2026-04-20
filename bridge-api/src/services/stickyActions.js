async function upsertSticky({ prisma, client, guildId, channelId, content, actorId }) {
  const sticky = await prisma.stickyMessage.upsert({
    where: {
      guildId_channelId: { guildId, channelId },
    },
    update: {
      content,
      updatedAt: new Date(),
    },
    create: {
      guildId,
      channelId,
      content,
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId,
      action: 'BRIDGE_STICKY_UPSERTED',
      userId: actorId || null,
      metadata: { channelId, stickyId: sticky.id },
    },
  });

  const guild = client.guilds.cache.get(guildId);
  const channel = guild ? guild.channels.cache.get(channelId) : null;

  if (channel && channel.isTextBased()) {
    if (sticky.messageId) {
      const existing = await channel.messages.fetch(sticky.messageId).catch(() => null);
      if (existing) await existing.delete().catch(() => null);
    }

    const sent = await channel.send(`📌 **Sticky Message**\n${content}`).catch(() => null);
    if (sent) {
      await prisma.stickyMessage.update({
        where: {
          guildId_channelId: { guildId, channelId },
        },
        data: {
          messageId: sent.id,
          lastPostedAt: new Date(),
        },
      });
    }
  }

  return sticky;
}

async function deleteSticky({ prisma, guildId, channelId, actorId }) {
  const sticky = await prisma.stickyMessage.findUnique({
    where: {
      guildId_channelId: { guildId, channelId },
    },
  });

  if (!sticky) {
    return null;
  }

  await prisma.stickyMessage.delete({
    where: {
      guildId_channelId: { guildId, channelId },
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId,
      action: 'BRIDGE_STICKY_DELETED',
      userId: actorId || null,
      metadata: { channelId, stickyId: sticky.id },
    },
  });

  return sticky;
}

module.exports = {
  upsertSticky,
  deleteSticky,
};
