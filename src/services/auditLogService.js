const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

async function createAuditLog({ guildId = null, action, userId = null, metadata = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        guildId,
        action,
        userId,
        metadata,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log.', error);
  }
}

module.exports = {
  createAuditLog,
};
