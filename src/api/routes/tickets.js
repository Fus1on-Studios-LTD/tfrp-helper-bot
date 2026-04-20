const express = require('express');
const { claimTicket, closeTicket } = require('../services/ticketApiService');

module.exports = function createTicketRouter({ prisma, client }) {
  const router = express.Router();

  router.post('/tickets/claim', async (req, res) => {
    try {
      const { ticketId, claimedById } = req.body;
      const ticket = await claimTicket({ prisma, client, ticketId, claimedById });
      res.json({ ok: true, ticket });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/tickets/close', async (req, res) => {
    try {
      const { ticketId, closedById } = req.body;
      const ticket = await closeTicket({ prisma, client, ticketId, closedById });
      res.json({ ok: true, ticket });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
