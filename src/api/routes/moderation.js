const express = require('express');
const {
  warnMember,
  noteMember,
  timeoutMember,
  kickMember,
  banMember,
  lookupUserHistory,
} = require('../services/moderationApiService');

module.exports = function createModerationRouter({ prisma, client }) {
  const router = express.Router();

  router.post('/moderation/warn', async (req, res) => {
    try {
      const { guildId, targetDiscordId, moderatorId, reason } = req.body;
      const action = await warnMember({ prisma, guildId, targetDiscordId, moderatorId, reason });
      res.json({ ok: true, action });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/moderation/note', async (req, res) => {
    try {
      const { guildId, targetDiscordId, moderatorId, reason } = req.body;
      const action = await noteMember({ prisma, guildId, targetDiscordId, moderatorId, reason });
      res.json({ ok: true, action });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/moderation/timeout', async (req, res) => {
    try {
      const { guildId, targetDiscordId, moderatorId, reason, durationMs } = req.body;
      const result = await timeoutMember({
        prisma,
        client,
        guildId,
        targetDiscordId,
        moderatorId,
        reason,
        durationMs: Number(durationMs),
      });
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/moderation/kick', async (req, res) => {
    try {
      const { guildId, targetDiscordId, moderatorId, reason } = req.body;
      const result = await kickMember({ prisma, client, guildId, targetDiscordId, moderatorId, reason });
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/moderation/ban', async (req, res) => {
    try {
      const { guildId, targetDiscordId, moderatorId, reason } = req.body;
      const result = await banMember({ prisma, client, guildId, targetDiscordId, moderatorId, reason });
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/moderation/history', async (req, res) => {
    try {
      const { targetDiscordId, guildId = null } = req.body;
      const result = await lookupUserHistory({ prisma, targetDiscordId, guildId });
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
