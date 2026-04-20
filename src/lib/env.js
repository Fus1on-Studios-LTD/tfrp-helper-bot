require('dotenv').config();

const required = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DATABASE_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_TEST_GUILD_ID: process.env.DISCORD_TEST_GUILD_ID || null,

  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DATABASE_URL: process.env.DATABASE_URL,

  STICKY_COOLDOWN_MS: Number(process.env.STICKY_COOLDOWN_MS || 15000),
  TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID || null,
  TICKET_TRANSCRIPT_CHANNEL_ID: process.env.TICKET_TRANSCRIPT_CHANNEL_ID || null,
  MOD_LOG_CHANNEL_ID: process.env.MOD_LOG_CHANNEL_ID || null,
  GLOBAL_BAN_LOG_CHANNEL_ID: process.env.GLOBAL_BAN_LOG_CHANNEL_ID || null,

  INTERNAL_API_PORT: Number(process.env.INTERNAL_API_PORT || 4600),
  INTERNAL_API_HOST: process.env.INTERNAL_API_HOST || '127.0.0.1',
  INTERNAL_API_SHARED_SECRET: process.env.INTERNAL_API_SHARED_SECRET,
  INTERNAL_API_SHARED_SECRET_PREVIOUS: process.env.INTERNAL_API_SHARED_SECRET_PREVIOUS || null,
  INTERNAL_API_TRUST_PROXY: String(process.env.INTERNAL_API_TRUST_PROXY || 'false') === 'true',
  INTERNAL_API_ALLOWED_IPS: (process.env.INTERNAL_API_ALLOWED_IPS || '127.0.0.1,::1')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean),
  
  NODE_ENV: process.env.NODE_ENV || 'development',
};
