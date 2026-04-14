const { maybePostSticky } = require('../../services/stickyMessageService');
const logger = require('../../lib/logger');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    try {
      await maybePostSticky(message);
    } catch (error) {
      logger.error('Sticky message handler failed.', error);
    }
  },
};
