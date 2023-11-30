import { Op } from "sequelize";
import TicketTraking from "../../models/TicketTraking";
import { SeqOptions } from "../../@types/SeqOptions";

interface Params {
  ticketId: string | number;
  companyId: string | number;
  whatsappId?: string | number;
  userId?: string | number;
  channel?: string;
  seqOptions?: SeqOptions;
}

const UpdateTicketTrakingService = async ({
  ticketId,
  companyId,
  whatsappId,
  userId,
  seqOptions = {}
}: Params): Promise<TicketTraking> => {
  const ticketTraking = await TicketTraking.findAll({
    where: {
      ticketId,
    },
    order: [
      ['finishedAt', 'DESC']
    ],
    limit: 1
  });

  const lastTicket = ticketTraking[0];

  await lastTicket.update({ companyId, userId, whatsappId }, seqOptions);
  return await lastTicket.reload();
};

export default UpdateTicketTrakingService;
