import Setting from "../../models/Setting";
import { isArray, isObject } from "lodash";

interface Data {
  settings: any;
}

const CreateService = async (
  data: Data,
  companyId: number,
  campaignId: number
): Promise<Setting[]> => {
  const settings = [];
  for (let settingKey of Object.keys(data.settings)) {
    const value =
      isArray(data.settings[settingKey]) || isObject(data.settings[settingKey])
        ? JSON.stringify(data.settings[settingKey])
        : data.settings[settingKey];
    const [record, created] = await Setting.findOrCreate({
      where: {
        key: settingKey,
        companyId,
        campaignId
      },
      defaults: { key: settingKey, value, companyId, campaignId }
    });

    if (!created) {
      await record.update({ value });
    }

    settings.push(record);
  }

  return settings;
};

export default CreateService;
