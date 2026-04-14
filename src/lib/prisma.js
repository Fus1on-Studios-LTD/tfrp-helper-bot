require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const env = require('./env');

const adapter = new PrismaMariaDb({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 5,
  acquireTimeout: 10000,
  connectTimeout: 5000,
});

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

module.exports = prisma;
