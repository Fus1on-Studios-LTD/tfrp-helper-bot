const express = require("express");
const {
  listGlobalRoleMappings,
  upsertGlobalRoleMapping,
  deleteGlobalRoleMapping,
} = require("../services/globalRoleMappingApiService");

module.exports = function createGlobalRoleMappingsRouter({ prisma }) {
  const router = express.Router();

  router.post("/globalroles/mappings/list", async (req, res) => {
    try {
      const { guildId = null } = req.body;
      const mappings = await listGlobalRoleMappings({ prisma, guildId });
      res.json({ ok: true, mappings });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post("/globalroles/mappings/upsert", async (req, res) => {
    try {
      const { guildId, key, roleId, actorId = null } = req.body;
      const mapping = await upsertGlobalRoleMapping({ prisma, guildId, key, roleId, actorId });
      res.json({ ok: true, mapping });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post("/globalroles/mappings/delete", async (req, res) => {
    try {
      const { mappingId, actorId = null } = req.body;
      const deleted = await deleteGlobalRoleMapping({ prisma, mappingId, actorId });
      res.json({ ok: true, deleted });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
