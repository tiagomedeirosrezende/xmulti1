import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.query(`
      ALTER TABLE public."Settings" DROP CONSTRAINT "Settings_userId_fkey";
      ALTER TABLE public."Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.query(`
      ALTER TABLE public."Settings" DROP CONSTRAINT "Settings_userId_fkey";
      ALTER TABLE public."Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id);
    `);
  }
};
