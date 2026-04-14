const prisma = require('../lib/prisma');

async function getOrCreateUser(discordId) {
  return prisma.user.upsert({
    where: { discordId },
    update: {},
    create: { discordId },
  });
}

module.exports = {
  getOrCreateUser,
};
