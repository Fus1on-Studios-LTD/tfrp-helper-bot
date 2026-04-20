const express = require('express');
const { upsertGuildConfig } = require('../services/settingsApiService');

module.exports = function createSettingsRouter({ prisma }) {
  const router = express.Router();

  router.post('/settings/guild-config', async (req, res) => {
    try {
      const {
        guildId,
        modLogChannelId = null,
        ticketCategoryId = null,
        ticketLogChannelId = null,
        stickyCooldownMs = 15000,
        actorId = null,
      } = req.body;

      const config = await upsertGuildConfig({
        prisma,
        guildId,
        modLogChannelId,
        ticketCategoryId,
        ticketLogChannelId,
        stickyCooldownMs,
        actorId,
      });

      res.json({ ok: true, config });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
