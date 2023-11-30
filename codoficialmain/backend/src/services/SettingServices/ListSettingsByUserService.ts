import { Op, WhereOptions } from "sequelize";
import Setting from "../../models/Setting";
import { Max, Sequelize } from "sequelize-typescript";

interface Request {
  companyId: number;
  userId: number;
}

const ListSettingsByUserService = async ({
  companyId,
  userId
}: Request): Promise<{ user: Setting[], company: Setting[] } | undefined> => {

  const initialConstraints:WhereOptions = {
    companyId
  }

  let where:WhereOptions = {
    ...initialConstraints
  }
  if (userId) {
    where = {
      ...where,
      userId,
      campaignId: null,
    }
  }
  const userSettings = await Setting.findAll({
    attributes: ["key", "value"],
    where,
  });

  where = {
    ...initialConstraints,
    ...{
      key: {
        [Op.in]: userSettings.map(s => s.key)
      },
      userId: null,
      campaignId: null,
    }
  }

  const companySettings = await Setting.findAll({
    attributes: ["key", "value"],
    where: initialConstraints,
  });

  return { user: userSettings, company: companySettings };
};

export default ListSettingsByUserService;
