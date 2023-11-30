import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Settings", "userId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Campaigns", "userId");
  }
};
