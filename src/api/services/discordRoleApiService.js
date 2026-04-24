async function listGuildRoles({ client, guildId }) {
  if (!guildId) {
    throw new Error("guildId is required.");
  }

  const guild =
    client.guilds.cache.get(guildId) ||
    (await client.guilds.fetch(guildId).catch(() => null));

  if (!guild) {
    throw new Error("Guild not found or bot is not in that guild.");
  }

  const botMember = await guild.members.fetchMe().catch(() => null);
  const botHighestPosition = botMember?.roles?.highest?.position ?? 0;

  const roles = await guild.roles.fetch();

  return [...roles.values()]
    .filter((role) => !role.managed)
    .filter((role) => role.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map((role) => ({
      id: role.id,
      name: role.name,
      color: role.hexColor,
      position: role.position,
      managed: role.managed,
      mentionable: role.mentionable,
      assignableByBot: botHighestPosition > role.position,
    }));
}

module.exports = {
  listGuildRoles,
};
