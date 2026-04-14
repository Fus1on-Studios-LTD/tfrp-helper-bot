const logger = require('../../lib/logger');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    client.user.setActivity('Assisting TheFlowRP™');
  },
};
