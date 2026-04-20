const express = require('express');
const { claimTicket, closeTicket } = require('../services/ticketActions');

module.exports = function createTicketRouter({ prisma, client }) {
  const router = express.Router();

  router.post('/tickets/claim', async (req, res) => {
    try {
      const { ticketId, guildId, claimedById } = req.body;
      const updated = await claimTicket({ prisma, client, ticketId, guildId, claimedById });
      res.json({ ok: true, ticket: updated });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/tickets/close', async (req, res) => {
    try {
      const { ticketId, closedById } = req.body;
      const updated = await closeTicket({ prisma, client, ticketId, closedById });
      res.json({ ok: true, ticket: updated });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
