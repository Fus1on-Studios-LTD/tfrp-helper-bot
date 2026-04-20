const express = require('express');
const { upsertSticky, deleteSticky } = require('../services/stickyApiService');

module.exports = function createStickyRouter({ prisma, client }) {
  const router = express.Router();

  router.post('/sticky/upsert', async (req, res) => {
    try {
      const { guildId, channelId, content, actorId } = req.body;
      const sticky = await upsertSticky({ prisma, client, guildId, channelId, content, actorId });
      res.json({ ok: true, sticky });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/sticky/delete', async (req, res) => {
    try {
      const { guildId, channelId, actorId } = req.body;
      const sticky = await deleteSticky({ prisma, client, guildId, channelId, actorId });
      res.json({ ok: true, sticky });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
