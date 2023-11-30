import { WhereOptions } from "sequelize";
import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";

interface Request {
  keyValues: Object[];
  userId: number;
  companyId: number;
}

const UpdateSettingsByUserService = async ({
  keyValues,
  userId,
  companyId
}: Request): Promise<Setting[] | undefined[] | void[]> => {

  return await Promise.all(
    keyValues.map(async (kv: any) => {
      const key = Object.keys(kv)[0];
      const constraints = { key, userId, companyId };
      const payload = { value: kv[key] };
      const [setting, created] = await Setting.findOrCreate({
        where: constraints,
        defaults: {...constraints, ...payload},
      })
      if (!created) {
        await Setting.update(payload, { where: { id: setting.id } })
      }
    })
  );
};

export default UpdateSettingsByUserService;
