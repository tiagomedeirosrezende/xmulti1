import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    queryInterface.sequelize.query(`
      INSERT INTO "Settings"("key", "value", "createdAt", "updatedAt", "companyId", "userId")
      SELECT 'campaignsEnabled', 'true', NOW(), NOW(), u."companyId", u."id"
      FROM "Users" u
      WHERE
        "profile" = 'admin'
        AND u."id" NOT IN (
          SELECT userSettings."id"
          FROM "Settings" userSettings
          WHERE
            "key" = 'campaignsEnabled'
            AND "value" = 'true'
        )
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    queryInterface.sequelize.query(`
      delete
      from
        "Settings"
      where
        "key" = 'campaignsEnabled'
        and "value" = 'true'
        and "userId" IS NOT NULL
        and "userId" in (
          select "userId"
          from "Users"
          where
            "profile" = 'admin'
        )
    `);
  }
};
