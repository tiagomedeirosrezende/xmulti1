import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const x = await queryInterface.sequelize.query(`SELECT id from "Users" LIMIT 1`);
    const [resultSet, c] = x;
    const firstUserId = resultSet[0];

    return queryInterface.addColumn("Campaigns", "userId", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: firstUserId ? firstUserId["id"] : 1,
      references: { model: "Users", key: "id" },
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Campaigns", "userId");
  }
};
