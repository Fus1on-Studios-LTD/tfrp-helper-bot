const express = require('express');
const prisma = require('../../lib/prisma');
const { unlinkDiscordAccount } = require('../../services/networkAuthService');
const { syncLinkedUserNetworkMemberships } = require('../../services/networkSyncService');

module.exports = function createNetworkSyncRouter() {
  const router = express.Router();

  router.post('/network/unlink', async (req, res) => {
    try {
      const { discordId, actorId } = req.body;
      if (!discordId) {
        throw new Error('discordId is required.');
      }

      await unlinkDiscordAccount(discordId);

      await prisma.auditLog.create({
        data: {
          action: 'NETWORK_OAUTH_LINK_REMOVED_FROM_DASHBOARD',
          userId: actorId || discordId,
          metadata: {
            discordId,
            actorId: actorId || null,
          },
        },
      });

      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/network/sync-user', async (req, res) => {
    try {
      const { discordId, actorId } = req.body;
      if (!discordId) {
        throw new Error('discordId is required.');
      }

      const results = await syncLinkedUserNetworkMemberships(discordId);

      await prisma.auditLog.create({
        data: {
          action: 'NETWORK_SYNC_TRIGGERED_FROM_DASHBOARD',
          userId: actorId || discordId,
          metadata: {
            discordId,
            actorId: actorId || null,
            resultsCount: results.length,
          },
        },
      });

      res.json({ ok: true, results });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
