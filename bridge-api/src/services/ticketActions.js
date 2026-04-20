async function claimTicket({ prisma, client, guildId, ticketId, claimedById, auditAction = 'BRIDGE_TICKET_CLAIMED' }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');

  const guild = client.guilds.cache.get(guildId) || client.guilds.cache.get(ticket.guildId);
  const channel = guild ? guild.channels.cache.get(ticket.channelId) : null;

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      claimedById,
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId: updated.guildId,
      action: auditAction,
      userId: claimedById,
      metadata: { ticketId: updated.id, channelId: updated.channelId },
    },
  });

  if (channel && channel.isTextBased()) {
    await channel.send(`🎫 Ticket claimed by <@${claimedById}>`).catch(() => null);
  }

  return updated;
}

async function closeTicket({ prisma, client, ticketId, closedById, auditAction = 'BRIDGE_TICKET_CLOSED' }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');

  const guild = client.guilds.cache.get(ticket.guildId);
  const channel = guild ? guild.channels.cache.get(ticket.channelId) : null;

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'closed',
      closedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId: updated.guildId,
      action: auditAction,
      userId: closedById,
      metadata: { ticketId: updated.id, channelId: updated.channelId },
    },
  });

  if (channel && channel.isTextBased()) {
    await channel.send(`🔒 Ticket closed by <@${closedById}>`).catch(() => null);
    setTimeout(() => {
      channel.delete().catch(() => null);
    }, 5000);
  }

  return updated;
}

module.exports = {
  claimTicket,
  closeTicket,
};
