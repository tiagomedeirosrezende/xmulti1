import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListService from "../services/CampaignSettingServices/ListService";
import CreateService from "../services/CampaignSettingServices/CreateService";
import AppError from "../errors/AppError";
import ListOneService from "../services/CampaignSettingServices/ListOneService";
import CreateOneService from "../services/CampaignSettingServices/CreateOneService";

interface StoreData {
  settings: any;
}


export const showOne = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { campaignId } = req.params;

  const records = await ListOneService({
    companyId,
    campaignId
  });

  return res.json(records);
};


export const storeOne = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { campaignId } = req.params;
  const data = req.body as StoreData;

  const parsedCampaignId = Number(campaignId);

  if (!parsedCampaignId) {
    throw new AppError("", 422);
  }

  const record = await CreateOneService(data, companyId, parsedCampaignId );

  const io = getIO();
  io.emit(`company-${companyId}-campaignSettings`, {
    action: "create",
    record
  });

  return res.status(200).json(record);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const records = await ListService({
    companyId
  });

  return res.json(records);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const record = await CreateService(data, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-campaignSettings`, {
    action: "create",
    record
  });

  return res.status(200).json(record);
};
