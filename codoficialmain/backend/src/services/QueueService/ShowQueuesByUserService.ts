import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import User from "../../models/User";

const ShowQueuesByUserService = async (
  userId: number | string,
  companyId: number
): Promise<Queue[]> => {
  const queues = await Queue.findAll({
    include: [
      {
        model: User,
        as: "users",
        attributes: [],
        where: {
          id: userId
        },
        required: true,
        duplicating: false
      }
    ]
  })
  if (queues.filter(q => q.companyId !== companyId).length > 0) {
    throw new AppError("Não é possível consultar registros de outra empresa");
  }

  return queues;
};

export default ShowQueuesByUserService;
