import User from "../../models/User";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Whatsapp from "../../models/Whatsapp";

const ShowUserService = async (id: string | number): Promise<User> => {
  const user = await User.findByPk(id, {
    attributes: [
      "name",
      "id",
      "email",
      "companyId",
      "profile",
      "super",
      "tokenVersion"
    ],
    include: [
      { model: Queue, as: "queues", attributes: ["id", "name", "color"] },
      { model: Whatsapp, as: "whatsapps", attributes: ["id", "name"] },
      { model: Company, as: "company", attributes: ["id", "name"] }
    ]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  return user;
};

export default ShowUserService;
