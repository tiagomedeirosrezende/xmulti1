import { Request, Response } from "express";

import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";

import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import ListSettingsByUserService from "../services/SettingServices/ListSettingsByUserService";
import UpdateSettingsByUserService from "../services/SettingServices/UpdateSettingsByUserService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const settings = await ListSettingsService({ companyId });

  return res.status(200).json(settings);
};

export const byUser = async (req: Request, res: Response): Promise<Response> => {
  let userId = null;
  const { companyId } = req.user;
  userId = req.params.userId;

  if (!userId) {
    userId = req.user.id;
  }

  const settings = await ListSettingsByUserService({ companyId, userId: Number(userId) });

  return res.status(200).json(settings);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const { settingKey: key } = req.params;
  const { value } = req.body;
  const { companyId } = req.user;

  const setting = await UpdateSettingService({
    key,
    value,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-settings`, {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};


export const updateByUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.params.userId) {
    throw new AppError("", 422);
  }
  const { companyId } = req.user;
  const { userId } = req.params;
  const parsedUserId = Number(userId);

  if (!parsedUserId) {
    throw new AppError("", 422);
  }

  const values = Object.keys(req.body).map((key) => Object.assign({}, {[key]: req.body[key]}));


  const setting = await UpdateSettingsByUserService({
    keyValues: values,
    userId: parsedUserId,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-settings`, {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};