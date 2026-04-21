const crypto = require('node:crypto');
const prisma = require('../lib/prisma');
const env = require('../lib/env');
const { encryptString, decryptString } = require('./tokenCryptoService');

function buildDiscordAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.NETWORK_OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds.join',
    state,
    prompt: 'consent',
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

async function createLinkSession(discordId) {
  const state = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const session = await prisma.networkLinkSession.create({
    data: { state, discordId, expiresAt },
  });

  return { ...session, url: buildDiscordAuthorizeUrl(state) };
}

async function exchangeDiscordCodeForTokens(code) {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.NETWORK_OAUTH_REDIRECT_URI,
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.error_description || json.error || 'Discord token exchange failed.');
  return json;
}

async function fetchDiscordIdentity(accessToken) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Discord identity lookup failed.');
  return json;
}

async function completeLinkSession({ state, code }) {
  const session = await prisma.networkLinkSession.findUnique({ where: { state } });
  if (!session) throw new Error('Invalid OAuth state.');
  if (session.completedAt) throw new Error('This link session is already completed.');
  if (session.expiresAt.getTime() < Date.now()) throw new Error('This link session expired.');

  const tokenSet = await exchangeDiscordCodeForTokens(code);
  const identity = await fetchDiscordIdentity(tokenSet.access_token);

  if (String(identity.id) !== String(session.discordId)) {
    throw new Error('Linked Discord account does not match the requesting user.');
  }

  await prisma.linkedDiscordAccount.upsert({
    where: { discordId: session.discordId },
    update: {
      accessTokenEncrypted: encryptString(tokenSet.access_token),
      refreshTokenEncrypted: tokenSet.refresh_token ? encryptString(tokenSet.refresh_token) : null,
      tokenType: tokenSet.token_type || 'Bearer',
      scope: tokenSet.scope || null,
      expiresAt: tokenSet.expires_in ? new Date(Date.now() + Number(tokenSet.expires_in) * 1000) : null,
      updatedAt: new Date(),
    },
    create: {
      discordId: session.discordId,
      accessTokenEncrypted: encryptString(tokenSet.access_token),
      refreshTokenEncrypted: tokenSet.refresh_token ? encryptString(tokenSet.refresh_token) : null,
      tokenType: tokenSet.token_type || 'Bearer',
      scope: tokenSet.scope || null,
      expiresAt: tokenSet.expires_in ? new Date(Date.now() + Number(tokenSet.expires_in) * 1000) : null,
    },
  });

  await prisma.networkLinkSession.update({
    where: { state },
    data: { completedAt: new Date() },
  });

  return {
    discordId: session.discordId,
    username: identity.username,
    global_name: identity.global_name || null,
  };
}

async function getValidAccessToken(discordId) {
  const linked = await prisma.linkedDiscordAccount.findUnique({ where: { discordId } });
  if (!linked) throw new Error('No linked Discord account found.');

  const expiresSoon = linked.expiresAt && linked.expiresAt.getTime() < Date.now() + 60_000;
  if (!expiresSoon) return decryptString(linked.accessTokenEncrypted);

  if (!linked.refreshTokenEncrypted) {
    throw new Error('Linked account needs to be relinked.');
  }

  const refreshToken = decryptString(linked.refreshTokenEncrypted);
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.error_description || json.error || 'Discord token refresh failed.');

  await prisma.linkedDiscordAccount.update({
    where: { discordId },
    data: {
      accessTokenEncrypted: encryptString(json.access_token),
      refreshTokenEncrypted: json.refresh_token ? encryptString(json.refresh_token) : linked.refreshTokenEncrypted,
      tokenType: json.token_type || linked.tokenType,
      scope: json.scope || linked.scope,
      expiresAt: json.expires_in ? new Date(Date.now() + Number(json.expires_in) * 1000) : linked.expiresAt,
      updatedAt: new Date(),
    },
  });

  return json.access_token;
}

async function unlinkDiscordAccount(discordId) {
  await prisma.linkedDiscordAccount.delete({ where: { discordId } }).catch(() => null);
}

module.exports = {
  buildDiscordAuthorizeUrl,
  createLinkSession,
  completeLinkSession,
  getValidAccessToken,
  unlinkDiscordAccount,
};
