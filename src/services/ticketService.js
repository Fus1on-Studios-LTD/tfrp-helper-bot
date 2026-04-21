const {
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const { getOrCreateUser } = require('./userService');
const { createAuditLog } = require('./auditLogService');

function buildTicketControlRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:claim')
      .setLabel('Claim Ticket')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket:close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );
}

async function getGuildTicketConfig(guildId) {
  return prisma.guildConfig.findUnique({
    where: { guildId },
  });
}

async function createTicketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle('Support Tickets')
    .setDescription('Press the button below to open a support ticket.')
    .setColor(0x5865F2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:create')
      .setLabel('Open Ticket')
      .setStyle(ButtonStyle.Primary)
  );

  return channel.send({ embeds: [embed], components: [row] });
}

async function getOpenTicketCountForCategory(guildId, creatorId, categoryKey) {
  return prisma.ticket.count({
    where: {
      guildId,
      creatorId,
      categoryKey,
      status: 'open',
    },
  });
}

async function openTicket(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;
  const categoryKey = 'support';

  const guildConfig = await getGuildTicketConfig(guild.id);

  if (!guildConfig?.ticketCategoryId) {
    return {
      ok: false,
      message: 'Ticket system is not configured for this server yet. Set a ticket category in Guild Settings first.',
    };
  }

  const parentCategory = await guild.channels.fetch(guildConfig.ticketCategoryId).catch(() => null);
  if (!parentCategory) {
    return {
      ok: false,
      message: 'The configured ticket category for this server could not be found. Update Guild Settings and try again.',
    };
  }

  const openCount = await getOpenTicketCountForCategory(guild.id, interaction.user.id, categoryKey);
  if (openCount > 0) {
    const existing = await prisma.ticket.findFirst({
      where: {
        guildId: guild.id,
        creatorId: interaction.user.id,
        categoryKey,
        status: 'open',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ok: false,
      message: `You already have an open ${categoryKey} ticket: <#${existing.channelId}>`,
    };
  }

  const user = await getOrCreateUser(interaction.user.id);

  const safeName = `ticket-${interaction.user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 90);

  const channel = await guild.channels.create({
    name: safeName || `ticket-${interaction.user.id}`,
    type: ChannelType.GuildText,
    parent: guildConfig.ticketCategoryId,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  const ticket = await prisma.ticket.create({
    data: {
      guildId: guild.id,
      channelId: channel.id,
      userId: user.id,
      creatorId: interaction.user.id,
      status: 'open',
      subject: 'Support Ticket',
      categoryKey,
    },
  });

  await createAuditLog({
    guildId: guild.id,
    action: 'TICKET_CREATED',
    userId: interaction.user.id,
    metadata: {
      ticketId: ticket.id,
      channelId: channel.id,
      categoryKey,
      ticketCategoryId: guildConfig.ticketCategoryId,
    },
  });

  await channel.send({
    content: `Hello <@${interaction.user.id}>, support will be with you shortly.`,
    components: [buildTicketControlRow()],
  });

  return {
    ok: true,
    message: `Your ticket has been created: ${channel}`,
  };
}

async function getTicketByChannelId(channelId) {
  return prisma.ticket.findUnique({
    where: { channelId },
  });
}

async function claimTicket(interaction) {
  const ticket = await getTicketByChannelId(interaction.channel.id);

  if (!ticket || ticket.status !== 'open') {
    return { ok: false, message: 'This channel is not an open ticket.' };
  }

  if (ticket.claimedById && ticket.claimedById !== interaction.user.id) {
    return {
      ok: false,
      message: `This ticket is already claimed by <@${ticket.claimedById}>.`,
    };
  }

  await prisma.ticket.update({
    where: { channelId: interaction.channel.id },
    data: {
      claimedById: interaction.user.id,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    guildId: interaction.guild.id,
    action: 'TICKET_CLAIMED',
    userId: interaction.user.id,
    metadata: {
      ticketId: ticket.id,
      channelId: interaction.channel.id,
    },
  });

  return { ok: true, message: `Ticket claimed by <@${interaction.user.id}>.` };
}

async function renameTicket(interaction, name) {
  const ticket = await getTicketByChannelId(interaction.channel.id);

  if (!ticket || ticket.status !== 'open') {
    return { ok: false, message: 'This channel is not an open ticket.' };
  }

  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 90);
  await interaction.channel.setName(sanitized);

  await prisma.ticket.update({
    where: { channelId: interaction.channel.id },
    data: {
      subject: name,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    guildId: interaction.guild.id,
    action: 'TICKET_RENAMED',
    userId: interaction.user.id,
    metadata: {
      ticketId: ticket.id,
      newName: name,
      channelName: sanitized,
    },
  });

  return { ok: true, message: `Ticket renamed to **${sanitized}**.` };
}

async function addUserToTicket(interaction, targetUserId) {
  const ticket = await getTicketByChannelId(interaction.channel.id);

  if (!ticket || ticket.status !== 'open') {
    return { ok: false, message: 'This channel is not an open ticket.' };
  }

  const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
  if (!member) {
    return { ok: false, message: 'That user is not in this server.' };
  }

  await interaction.channel.permissionOverwrites.edit(targetUserId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
    EmbedLinks: true,
  });

  await createAuditLog({
    guildId: interaction.guild.id,
    action: 'TICKET_USER_ADDED',
    userId: interaction.user.id,
    metadata: {
      ticketId: ticket.id,
      targetUserId,
      channelId: interaction.channel.id,
    },
  });

  return { ok: true, message: `Added <@${targetUserId}> to this ticket.` };
}

async function removeUserFromTicket(interaction, targetUserId) {
  const ticket = await getTicketByChannelId(interaction.channel.id);

  if (!ticket || ticket.status !== 'open') {
    return { ok: false, message: 'This channel is not an open ticket.' };
  }

  if (ticket.creatorId === targetUserId) {
    return { ok: false, message: 'You cannot remove the ticket creator from their own ticket.' };
  }

  await interaction.channel.permissionOverwrites.delete(targetUserId).catch(() => null);

  await createAuditLog({
    guildId: interaction.guild.id,
    action: 'TICKET_USER_REMOVED',
    userId: interaction.user.id,
    metadata: {
      ticketId: ticket.id,
      targetUserId,
      channelId: interaction.channel.id,
    },
  });

  return { ok: true, message: `Removed <@${targetUserId}> from this ticket.` };
}

async function buildTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  const ordered = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const lines = ordered.map((msg) => {
    const createdAt = new Date(msg.createdTimestamp).toISOString();
    const author = `${msg.author.tag} (${msg.author.id})`;
    const content = msg.content || '[no text content]';
    return `[${createdAt}] ${author}: ${content}`;
  });

  return lines.join('\n');
}

async function sendTranscript(interaction, ticket) {
  const guildConfig = await getGuildTicketConfig(interaction.guild.id);
  const transcriptChannelId = guildConfig?.ticketLogChannelId || null;

  if (!transcriptChannelId) return;

  const transcriptChannel = await interaction.guild.channels.fetch(transcriptChannelId).catch(() => null);
  if (!transcriptChannel || !transcriptChannel.isTextBased()) return;

  const transcript = await buildTranscript(interaction.channel);

  const content = [
    `**Ticket Transcript**`,
    `Ticket ID: ${ticket.id}`,
    `Guild: ${interaction.guild.id}`,
    `Creator: <@${ticket.creatorId}>`,
    `Claimed By: ${ticket.claimedById ? `<@${ticket.claimedById}>` : 'Unclaimed'}`,
    `Closed By: <@${interaction.user.id}>`,
    '',
    '```',
    transcript.slice(0, 1900),
    '```',
  ].join('\n');

  await transcriptChannel.send({ content }).catch((error) => {
    logger.error('Failed to send transcript.', error);
  });
}

async function closeTicket(interaction) {
  const ticket = await getTicketByChannelId(interaction.channel.id);

  if (!ticket || ticket.status !== 'open') {
    return {
      ok: false,
      message: 'This channel is not an open ticket.',
    };
  }

  await prisma.ticket.update({
    where: { channelId: interaction.channel.id },
    data: {
      status: 'closed',
      closedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await sendTranscript(interaction, ticket);

  await createAuditLog({
    guildId: interaction.guild.id,
    action: 'TICKET_CLOSED',
    userId: interaction.user.id,
    metadata: {
      ticketId: ticket.id,
      channelId: interaction.channel.id,
      creatorId: ticket.creatorId,
      claimedById: ticket.claimedById,
    },
  });

  await interaction.channel.send('This ticket will be deleted in 5 seconds.');
  setTimeout(async () => {
    await interaction.channel.delete().catch(() => null);
  }, 5000);

  return {
    ok: true,
    message: 'Ticket closed.',
  };
}

module.exports = {
  createTicketPanel,
  openTicket,
  closeTicket,
  claimTicket,
  renameTicket,
  addUserToTicket,
  removeUserFromTicket,
  buildTranscript,
  getTicketByChannelId,
  getGuildTicketConfig,
};
