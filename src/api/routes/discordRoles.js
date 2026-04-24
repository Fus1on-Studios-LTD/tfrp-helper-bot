const express = require("express");
const { listGuildRoles } = require("../services/discordRoleApiService");

module.exports = function createDiscordRolesRouter({ client }) {
  const router = express.Router();

  router.post("/discord/guild-roles", async (req, res) => {
    try {
      const { guildId } = req.body;
      const roles = await listGuildRoles({ client, guildId });
      res.json({ ok: true, roles });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
