const express = require('express');
const { createLinkUrl, completeOAuthCallback } = require('../services/networkAuthApiService');

module.exports = function createNetworkAuthRouter() {
  const router = express.Router();

  router.post('/network/link/start', async (req, res) => {
    try {
      const { discordId } = req.body;
      if (!discordId) throw new Error('discordId is required.');

      const result = await createLinkUrl({ discordId });
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  router.get('/network/oauth/callback', async (req, res) => {
    try {
      const { state, code } = req.query;
      if (!state || !code) throw new Error('Missing OAuth state or code.');

      const result = await completeOAuthCallback({
        state: String(state),
        code: String(code),
      });

      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(`<!doctype html>
<html><head><title>Discord Link Complete</title>
<style>
body{font-family:Arial,sans-serif;background:#07101f;color:white;display:grid;place-items:center;min-height:100vh;margin:0}
.card{max-width:560px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:28px}
h1{margin-top:0}p{color:rgba(255,255,255,.75);line-height:1.55}
</style></head>
<body><div class="card"><h1>Discord account linked</h1>
<p>Your Discord account for <strong>${result.username}</strong> is now linked.</p>
<p>You can return to Discord and run your sync command again.</p></div></body></html>`);
    } catch (error) {
      res.status(400).setHeader('content-type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><html><body style="font-family:Arial,sans-serif;background:#07101f;color:white;padding:40px">
<h1>Link failed</h1><p>${error.message}</p></body></html>`);
    }
  });

  return router;
};
