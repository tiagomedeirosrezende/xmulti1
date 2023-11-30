import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";
import ContactList from "../../models/ContactList";
import Whatsapp from "../../models/Whatsapp";

interface Data {
  name: string;
  status: string;
  confirmation: boolean;
  scheduledAt: string;
  companyId: number;
  contactListId: number;
  userId: number;
  queueId: number;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  confirmationMessage1?: string;
  confirmationMessage2?: string;
  confirmationMessage3?: string;
  confirmationMessage4?: string;
  confirmationMessage5?: string;
}

const CreateService = async (data: Data): Promise<Campaign> => {
  const { name, queueId } = data;

  const ticketnoteSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, "ERR_CAMPAIGN_INVALID_NAME")
      .required("ERR_CAMPAIGN_REQUIRED"),
    queueId: Yup.number().required("ERR_CAMPAIGN_REQUIRED")
  });

  try {
    await ticketnoteSchema.validate({ name, queueId });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (data.scheduledAt != null && data.scheduledAt != "") {
    data.status = "PROGRAMADA";
  }

  const record = await Campaign.create(data);

  await record.reload({
    include: [
      { model: ContactList },
      { model: Whatsapp, attributes: ["id", "name"] }
    ]
  });

  return record;
};

export default CreateService;
