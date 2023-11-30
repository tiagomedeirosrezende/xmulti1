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

const FindOrCreateATicketTrakingService = async ({
  ticketId,
  companyId,
  whatsappId,
  userId,
  channel,
  seqOptions = {}
}: Params): Promise<[created:boolean, ticketTraking: TicketTraking]> => {
  const ticketTraking = await TicketTraking.findOne({
    where: {
      ticketId,
      finishedAt: {
        [Op.is]: null
      }
    }
  });

  if (ticketTraking) {
    return [false, ticketTraking];
  }

  const newRecord = await TicketTraking.create({
    ticketId,
    companyId,
    whatsappId,
    userId,
    channel
  }, seqOptions);

  return [true, newRecord];
};

export default FindOrCreateATicketTrakingService;
