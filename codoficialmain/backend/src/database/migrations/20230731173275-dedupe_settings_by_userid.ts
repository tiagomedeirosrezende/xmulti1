import { QueryInterface, QueryTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    queryInterface.sequelize.query(`
      CREATE or replace PROCEDURE dedupeSettingsByUserid()
      LANGUAGE SQL
      AS $$
        with ROW_DELETE as (
          select
            "id",
            "key",
            "companyId",
            "userId",
            row_number() over (partition by "key",
            "companyId",
            "userId") as rownumber
          from
            "Settings" )
        DELETE
        from
          "Settings"
        where "id" in (
          select "id" from ROW_DELETE
          where
          rownumber > 1
        )
      $$;
      call dedupeSettingsByUserid()
    `, { raw: true });
  },

  down: async (queryInterface: QueryInterface) => {}
};
