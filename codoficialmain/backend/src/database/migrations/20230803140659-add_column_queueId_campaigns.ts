import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const x = await queryInterface.sequelize.query(`SELECT id from "Queues" LIMIT 1`);
    const [resultSet, c] = x;
    const firstQueueId = resultSet[0];

    return queryInterface.addColumn("Campaigns", "queueId", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: firstQueueId ? firstQueueId["id"] : 1,
      references: { model: "Queues", key: "id" },
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Campaigns", "queueId");
  }
};
