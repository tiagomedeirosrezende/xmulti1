import { QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.removeConstraint(
      "Tickets",
      "contactid_companyid_unique"
    ).then(r => {
      queryInterface.addConstraint("Tickets", ["contactId", "companyId", "whatsappId"], {
        type: "unique",
        name: "contactid_companyid_whatsappid_unique"
      });
    }).thenReturn();
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.addConstraint("Tickets", ["contactId", "companyId"], {
      type: "unique",
      name: "contactid_companyid_unique"
    }).then(r => {
      queryInterface.removeConstraint(
        "Tickets",
        "contactid_companyid_whatsappid_unique"
      );
    }).thenReturn();
  }
};
