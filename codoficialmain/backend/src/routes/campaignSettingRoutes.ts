import express from "express";
import isAuth from "../middleware/isAuth";

import * as CampaignSettingController from "../controllers/CampaignSettingController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/campaign-settings", isAuth, CampaignSettingController.index);

routes.get("/campaign-settings/:campaignId", isAuth, CampaignSettingController.showOne);

routes.post("/campaign-settings", isAuth, CampaignSettingController.store);

routes.post("/campaign-settings/:campaignId", isAuth, CampaignSettingController.storeOne);

export default routes;
