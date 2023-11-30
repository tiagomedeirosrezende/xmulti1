import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import User from "../../models/User";
import Setting from "../../models/Setting";

interface CompanyData {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
}

const CreateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const {
    name,
    phone,
    email,
    status,
    planId,
    password,
    campaignsEnabled,
    dueDate,
    recurrence
  } = companyData;

  const companySchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_COMPANY_INVALID_NAME")
      .required("ERR_COMPANY_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_COMPANY_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const companyWithSameName = await Company.findOne({
              where: { name: value }
            });

            return !companyWithSameName;
          }
          return false;
        }
      )
  });

  try {
    await companySchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const company = await Company.create({
    name,
    phone,
    email,
    status,
    planId,
    dueDate,
    recurrence
  });
  const [user, created] = await User.findOrCreate({
    where: { name, email },
    defaults: {
      name: name,
      email: email,
      password: password || "mudar123",
      profile: "admin",
      companyId: company.id
    }
  });

  if (!created) {
    await user.update({ companyId: company.id });
  }

  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "asaas",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "asaas",
      value: ""
    },
  });

  //tokenixc
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "tokenixc",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "tokenixc",
      value: ""
    },
  });

  //ipixc
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "ipixc",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "ipixc",
      value: ""
    },
  });

  //ipmkauth
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "ipmkauth",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "ipmkauth",
      value: ""
    },
  });

  //clientsecretmkauth
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "clientsecretmkauth",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "clientsecretmkauth",
      value: ""
    },
  });

  //clientidmkauth
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "clientidmkauth",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "clientidmkauth",
      value: ""
    },
  });

  //CheckMsgIsGroup
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "CheckMsgIsGroup",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "enabled",
      value: ""
    },
  });

  //CheckMsgIsGroup
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "call",
      value: "disabled"
    },
  });

  //scheduleType
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "scheduleType",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "scheduleType",
      value: "disabled"
    },
  });

  //userRating
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "userRating",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "userRating",
      value: "disabled"
    },
  });

  //userRating
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "chatBotType",
      userId: null,
      campaignId: null,
    },
    defaults: {
      companyId: company.id,
      key: "chatBotType",
      value: "text"
    },
  });

  if (companyData.campaignsEnabled !== undefined) {
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        userId: null,
        campaignId: null,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      },

    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` }, { where: { id: setting.id } });
    }
  }

  return company;
};

export default CreateCompanyService;
