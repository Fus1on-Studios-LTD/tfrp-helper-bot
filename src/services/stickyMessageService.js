const prisma = require('../lib/prisma');
const env = require('../lib/env');

async function getSticky(guildId, channelId) {
  return prisma.stickyMessage.findUnique({
    where: {
      guildId_channelId: {
        guildId,
        channelId,
      },
    },
  });
}

async function setSticky({ guildId, channelId, content }) {
  return prisma.stickyMessage.upsert({
    where: {
      guildId_channelId: {
        guildId,
        channelId,
      },
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
}

async function removeSticky(guildId, channelId) {
  return prisma.stickyMessage.delete({
    where: {
      guildId_channelId: {
        guildId,
        channelId,
      },
    },
  }).catch(() => null);
}

async function maybePostSticky(message) {
  if (!message.guild || !message.channel || message.author.bot) return;

  const sticky = await getSticky(message.guild.id, message.channel.id);
  if (!sticky) return;

  const cooldownMs = env.STICKY_COOLDOWN_MS;
  const now = Date.now();
  const lastPostedAt = sticky.lastPostedAt ? new Date(sticky.lastPostedAt).getTime() : 0;

  if (now - lastPostedAt < cooldownMs) return;

  if (sticky.messageId) {
    try {
      const oldMessage = await message.channel.messages.fetch(sticky.messageId);
      await oldMessage.delete().catch(() => null);
    } catch (_) {
    }
  }

  const posted = await message.channel.send({
    content: `📌 **Sticky Message**\n${sticky.content}`,
  });

  await prisma.stickyMessage.update({
    where: {
      guildId_channelId: {
        guildId: message.guild.id,
        channelId: message.channel.id,
      },
    },
    data: {
      messageId: posted.id,
      lastPostedAt: new Date(),
    },
  });
}

module.exports = {
  getSticky,
  setSticky,
  removeSticky,
  maybePostSticky,
};
