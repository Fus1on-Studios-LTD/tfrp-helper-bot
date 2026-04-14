const {
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const prisma = require('../lib/prisma');
const env = require('../lib/env');
const { getOrCreateUser } = require('./userService');

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

async function openTicket(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  const existing = await prisma.ticket.findFirst({
    where: {
      guildId: guild.id,
      creatorId: interaction.user.id,
      status: 'open',
    },
  });

  if (existing) {
    return {
      ok: false,
      message: `You already have an open ticket: <#${existing.channelId}>`,
    };
  }

  const user = await getOrCreateUser(interaction.user.id);

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
    type: ChannelType.GuildText,
    parent: env.TICKET_CATEGORY_ID || null,
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
        ],
      },
      {
        id: guild.members.me.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
      },
    ],
  });

  await prisma.ticket.create({
    data: {
      guildId: guild.id,
      channelId: channel.id,
      userId: user.id,
      creatorId: interaction.user.id,
      status: 'open',
      subject: 'Support Ticket',
    },
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `Hello <@${interaction.user.id}>, support will be with you shortly.`,
    components: [row],
  });

  return {
    ok: true,
    message: `Your ticket has been created: ${channel}`,
  };
}

async function closeTicket(interaction) {
  const ticket = await prisma.ticket.findUnique({
    where: { channelId: interaction.channel.id },
  });

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
};
