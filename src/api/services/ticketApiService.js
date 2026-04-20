async function claimTicket({ prisma, client, ticketId, claimedById }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');
  if (ticket.status !== 'open') throw new Error('Only open tickets can be claimed.');

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

async function unclaimTicket({ prisma, client, ticketId, actorId }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');
  if (ticket.status !== 'open') throw new Error('Only open tickets can be unclaimed.');

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      claimedById: null,
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId: updated.guildId,
      action: 'INTERNAL_API_TICKET_UNCLAIMED',
      userId: actorId,
      metadata: { ticketId: updated.id, channelId: updated.channelId },
    },
  });

  const guild = client.guilds.cache.get(updated.guildId);
  const channel = guild ? guild.channels.cache.get(updated.channelId) : null;
  if (channel && channel.isTextBased()) {
    await channel.send(`🪪 Ticket unclaimed by <@${actorId}>`).catch(() => null);
  }

  return updated;
}

async function closeTicket({ prisma, client, ticketId, closedById, force = false }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');
  if (ticket.status === 'closed' && !force) throw new Error('Ticket is already closed.');

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
      action: force ? 'INTERNAL_API_TICKET_FORCE_CLOSED' : 'INTERNAL_API_TICKET_CLOSED',
      userId: closedById,
      metadata: { ticketId: updated.id, channelId: updated.channelId },
    },
  });

  const guild = client.guilds.cache.get(updated.guildId);
  const channel = guild ? guild.channels.cache.get(updated.channelId) : null;
  if (channel && channel.isTextBased()) {
    await channel.send(`${force ? '⛔' : '🔒'} Ticket closed by <@${closedById}>`).catch(() => null);
    setTimeout(() => {
      channel.delete().catch(() => null);
    }, 5000);
  }

  return updated;
}

async function reopenTicket({ prisma, client, ticketId, reopenedById }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');
  if (ticket.status !== 'closed') throw new Error('Only closed tickets can be reopened.');

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'open',
      closedAt: null,
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      guildId: updated.guildId,
      action: 'INTERNAL_API_TICKET_REOPENED',
      userId: reopenedById,
      metadata: { ticketId: updated.id, channelId: updated.channelId },
    },
  });

  const guild = client.guilds.cache.get(updated.guildId);
  const channel = guild ? guild.channels.cache.get(updated.channelId) : null;
  if (channel && channel.isTextBased()) {
    await channel.send(`🔓 Ticket reopened by <@${reopenedById}>`).catch(() => null);
  }

  return updated;
}

async function getTicketTranscript({ prisma, client, ticketId }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found.');

  const guild = client.guilds.cache.get(ticket.guildId);
  const channel = guild ? guild.channels.cache.get(ticket.channelId) : null;
  if (!channel || !channel.isTextBased()) {
    throw new Error('Ticket channel is not available.');
  }

  const messages = await channel.messages.fetch({ limit: 100 });
  const ordered = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const transcript = ordered.map((msg) => {
    const createdAt = new Date(msg.createdTimestamp).toISOString();
    const author = `${msg.author.tag} (${msg.author.id})`;
    const content = msg.content || '[no text content]';
    return `[${createdAt}] ${author}: ${content}`;
  }).join('\n');

  return {
    ticket,
    transcript,
  };
}

module.exports = {
  claimTicket,
  unclaimTicket,
  closeTicket,
  reopenTicket,
  getTicketTranscript,
};
