import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";

const GetWhatsAppsByUser = async (
  userId: number
): Promise<Whatsapp[] | null> => {
  const user = await User.findByPk(userId, {include: ["whatsapps"]});
  if (user === null) {
    return null;
  }

  return user.whatsapps;
};

export default GetWhatsAppsByUser;