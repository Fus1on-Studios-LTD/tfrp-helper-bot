const express = require('express');
const {
  listNetworkRules,
  upsertNetworkRule,
  deleteNetworkRule,
  toggleNetworkRule,
} = require('../services/networkRuleApiService');

module.exports = function createNetworkRulesRouter({ prisma }) {
  const router = express.Router();

  router.post('/network/rules/list', async (_req, res) => {
    try {
      const rules = await listNetworkRules({ prisma });
      res.json({ ok: true, rules });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/network/rules/upsert', async (req, res) => {
    try {
      const {
        sourceGuildId,
        sourceRoleId,
        targetGuildId,
        globalRoleKey = null,
        enabled = true,
        actorId = null,
      } = req.body;

      const rule = await upsertNetworkRule({
        prisma,
        sourceGuildId,
        sourceRoleId,
        targetGuildId,
        globalRoleKey,
        enabled,
        actorId,
      });

      res.json({ ok: true, rule });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/network/rules/delete', async (req, res) => {
    try {
      const { ruleId, actorId = null } = req.body;
      const deleted = await deleteNetworkRule({ prisma, ruleId, actorId });
      res.json({ ok: true, deleted });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/network/rules/toggle', async (req, res) => {
    try {
      const { ruleId, enabled, actorId = null } = req.body;
      const rule = await toggleNetworkRule({ prisma, ruleId, enabled, actorId });
      res.json({ ok: true, rule });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
