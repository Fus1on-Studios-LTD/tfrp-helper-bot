const crypto = require('node:crypto');
const env = require('../lib/env');

function getKeyBuffer() {
  const raw = env.NETWORK_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('Missing NETWORK_TOKEN_ENCRYPTION_KEY.');

  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('NETWORK_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.');
  }

  return key;
}

function encryptString(plainText) {
  const iv = crypto.randomBytes(12);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptString(payload) {
  const buffer = Buffer.from(payload, 'base64');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const key = getKeyBuffer();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

module.exports = { encryptString, decryptString };
