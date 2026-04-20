const express = require('express');
const { upsertStaff, changeStaffStrikes, removeStaff } = require('../services/staffApiService');

module.exports = function createStaffRouter({ prisma }) {
  const router = express.Router();

  router.post('/staff/upsert', async (req, res) => {
    try {
      const { discordId, rank, actorId } = req.body;
      const staff = await upsertStaff({ prisma, discordId, rank, actorId });
      res.json({ ok: true, staff });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/staff/strikes', async (req, res) => {
    try {
      const { discordId, amount, mode, actorId } = req.body;
      const staff = await changeStaffStrikes({
        prisma,
        discordId,
        amount: Number(amount || 1),
        mode,
        actorId,
      });
      res.json({ ok: true, staff });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/staff/remove', async (req, res) => {
    try {
      const { discordId, actorId } = req.body;
      const removed = await removeStaff({ prisma, discordId, actorId });
      res.json({ ok: true, removed });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
