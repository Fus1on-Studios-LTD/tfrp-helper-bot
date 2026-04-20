function requireBot(client) {
  if (!client || !client.isReady || !client.isReady()) {
    throw new Error('Discord bot client is not ready.');
  }
}

async function fetchGuild(client, guildId) {
  requireBot(client);
  const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    throw new Error(`Guild ${guildId} not found.`);
  }
  return guild;
}

async function fetchChannel(client, guildId, channelId) {
  const guild = await fetchGuild(client, guildId);
  const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    throw new Error(`Channel ${channelId} not found in guild ${guildId}.`);
  }
  return { guild, channel };
}

async function fetchMember(client, guildId, userId) {
  const guild = await fetchGuild(client, guildId);
  const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
  if (!member) {
    throw new Error(`Member ${userId} not found in guild ${guildId}.`);
  }
  return { guild, member };
}

module.exports = {
  fetchGuild,
  fetchChannel,
  fetchMember,
};
