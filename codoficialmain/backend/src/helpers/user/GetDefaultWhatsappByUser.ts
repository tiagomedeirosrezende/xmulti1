import Whatsapp from "../../models/Whatsapp";
import GetWhatsAppsByUser from "./GetWhatsappsByUser";

const GetDefaultWhatsAppByUser = async (
  userId: number
): Promise<Whatsapp | null> => {
  const whatsapps = await GetWhatsAppsByUser(userId);

  const defaultConn = whatsapps?.filter(w => w.isDefault);

  if (!defaultConn?.length) {
    return null;
  }

  return defaultConn[0];
};

export default GetDefaultWhatsAppByUser;