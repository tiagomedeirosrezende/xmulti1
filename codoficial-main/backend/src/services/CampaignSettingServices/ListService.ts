import { Op, fn, col, where } from "sequelize";
import Campaign from "../../models/Campaign";
import { isEmpty } from "lodash";
import ContactList from "../../models/ContactList";
import Whatsapp from "../../models/Whatsapp";
import Setting from "../../models/Setting";

interface Request {
  companyId: number | string;
  searchParam?: string;
  pageNumber?: string;
}

interface Response {
  records: Campaign[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  companyId
}: Request): Promise<Setting[]> => {
  let whereCondition: any = {
    companyId,
    campaignId: {
      [Op.not]: null,
    },
  };

  const records = await Setting.findAll({
    where: whereCondition
  });

  return records;
};

export default ListService;
