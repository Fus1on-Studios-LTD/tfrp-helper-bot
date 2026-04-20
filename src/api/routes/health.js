const express = require('express');

module.exports = function createHealthRouter() {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ ok: true, service: 'internal-bot-api' });
  });

  return router;
};
