import Campaign from "../../models/Campaign";
import Setting from "../../models/Setting";

interface Request {
  companyId: number | string;
  campaignId: number | string;
  searchParam?: string;
  pageNumber?: string;
}

interface Response {
  records: Campaign[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  companyId,
  campaignId
}: Request): Promise<Setting[]> => {
  let whereCondition: any = {
    companyId,
    campaignId
  };

  const records = await Setting.findAll({
    where: whereCondition
  });

  return records;
};

export default ListService;
