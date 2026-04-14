const { syncMemberRoles } = require('../../services/globalRoleService');
const logger = require('../../lib/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      await syncMemberRoles({ member });
    } catch (error) {
      logger.error('Global role sync failed on guildMemberAdd.', error);
    }
  },
};
