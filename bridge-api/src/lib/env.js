require('dotenv').config();

const required = ['BRIDGE_SHARED_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  BRIDGE_PORT: Number(process.env.BRIDGE_PORT || 4600),
  BRIDGE_HOST: process.env.BRIDGE_HOST || '127.0.0.1',
  BRIDGE_SHARED_SECRET: process.env.BRIDGE_SHARED_SECRET,
  BRIDGE_TRUST_PROXY: String(process.env.BRIDGE_TRUST_PROXY || 'false') === 'true',
};
