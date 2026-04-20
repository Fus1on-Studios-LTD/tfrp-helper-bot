async function claimTicket({ prisma, client, ticketId, claimedById }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');

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
      action: 'INTERNAL_API_TICKET_CLAIMED',
      userId: claimedById,
      metadata: { ticketId: updated.id, channelId: updated.channelId },
    },
  });

  const guild = client.guilds.cache.get(updated.guildId);
  const channel = guild ? guild.channels.cache.get(updated.channelId) : null;
  if (channel && channel.isTextBased()) {
    await channel.send(`🎫 Ticket claimed by <@${claimedById}>`).catch(() => null);
  }

  return updated;
}

async function closeTicket({ prisma, client, ticketId, closedById }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');

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
      action: 'INTERNAL_API_TICKET_CLOSED',
      userId: closedById,
      metadata: { ticketId: updated.id, channelId: updated.channelId },
    },
  });

  const guild = client.guilds.cache.get(updated.guildId);
  const channel = guild ? guild.channels.cache.get(updated.channelId) : null;
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
