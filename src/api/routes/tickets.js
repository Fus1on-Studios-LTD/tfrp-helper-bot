const express = require('express');
const {
  claimTicket,
  unclaimTicket,
  closeTicket,
  reopenTicket,
  getTicketTranscript,
} = require('../services/ticketApiService');

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

  router.post('/tickets/unclaim', async (req, res) => {
    try {
      const { ticketId, actorId } = req.body;
      const ticket = await unclaimTicket({ prisma, client, ticketId, actorId });
      res.json({ ok: true, ticket });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/tickets/close', async (req, res) => {
    try {
      const { ticketId, closedById, force = false } = req.body;
      const ticket = await closeTicket({ prisma, client, ticketId, closedById, force: Boolean(force) });
      res.json({ ok: true, ticket });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/tickets/reopen', async (req, res) => {
    try {
      const { ticketId, reopenedById } = req.body;
      const ticket = await reopenTicket({ prisma, client, ticketId, reopenedById });
      res.json({ ok: true, ticket });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.post('/tickets/transcript', async (req, res) => {
    try {
      const { ticketId } = req.body;
      const data = await getTicketTranscript({ prisma, client, ticketId });
      res.json({ ok: true, ...data });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  return router;
};
