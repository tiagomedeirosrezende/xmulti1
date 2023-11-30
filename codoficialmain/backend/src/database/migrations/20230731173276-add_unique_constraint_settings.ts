import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    queryInterface.addConstraint('Settings', ['userId', 'companyId', 'key'], {
      type: 'unique',
      name: 'settings_by_user_unique_constraint'
    });
  },

  down: async (queryInterface: QueryInterface) => {
    queryInterface.removeConstraint('Settings', 'settings_by_user_unique_constraint');
  }
};
