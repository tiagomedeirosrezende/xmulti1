import { subHours } from "date-fns";
import { Op, Transaction } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import Setting from "../../models/Setting";
import Whatsapp from "../../models/Whatsapp";
import UpdateTicketTrakingService from "./UpdateTicketTrakingService";
import { SeqOptions } from "../../@types/SeqOptions";

interface TicketData {
  status?: string;
  companyId?: number;
  unreadMessages?: number;
}

interface FindOrCreateTicketServiceProps {
  contactId: number,
  whatsappId: number,
  companyId: number,
  groupContactId?: number,
  unreadMessages?: number,
  status?: string,
  userId?: number,
  queueId?: number,
  seqOptions?: SeqOptions,
}

const FindOrCreateTicketService = async (props:FindOrCreateTicketServiceProps): Promise<[created:boolean, ticket:Ticket]> => {
  let createdTicket = false;
  const { contactId, whatsappId, unreadMessages, companyId, status, userId, groupContactId = null, seqOptions, queueId } = props
  let options = {};
  const contactIdQuery = groupContactId ? groupContactId : contactId;
  const isGroupContact = !!groupContactId;
  let defaultWhere = {
    contactId: contactIdQuery,
    whatsappId,
    isGroup: isGroupContact,
  }

  let ticket = await Ticket.findOne({
    where: {
      ...defaultWhere,
      status: {
        [Op.or]: ["open", "pending", "closed", "campaign"]
      },
      companyId,
    },
    order: [["id", "DESC"]]
  });

  if (ticket) {
    if (unreadMessages) {
      await ticket.update({ unreadMessages, whatsappId }, seqOptions);
    }
    if (status) {
      await ticket.update({ status }, seqOptions);
    }
    ticket = await ticket.reload();
    if (ticket.status === "closed") {
      await ticket.update({ queueId: null, userId: null }, seqOptions);
    }
  } else {

    if (isGroupContact) {
      ticket = await Ticket.findOne({
        where: {
          ...defaultWhere
        },
        order: [["updatedAt", "DESC"]]
      });
    } else {
      ticket = await Ticket.findOne({
        where: {
          updatedAt: {
            [Op.between]: [+subHours(new Date(), 2), +new Date()]
          },
          contactId: contactIdQuery,
          whatsappId,
        },
        order: [["updatedAt", "DESC"]]
      });
    }

    if (ticket) {
      if (status) {
        if (status === "closed") {
          await ticket.update({ status, queueId: null, userId: null }, seqOptions);
        } else {
          await ticket.update({ status }, seqOptions);
        }
      } else {
        await ticket.update({
          status: "pending",
          userId: null,
          unreadMessages,
          queueId: null,
          isGroup: isGroupContact,
          companyId
        });
      }

    } else {

      const whatsapp = await Whatsapp.findOne({
        where: { id: whatsappId }
      });

      ticket = await Ticket.create({
        contactId: contactIdQuery,
        status: status ?? "pending",
        isGroup: isGroupContact,
        unreadMessages,
        whatsappId,
        whatsapp,
        companyId,
        userId,
        queueId,
      }, seqOptions);
      createdTicket = true;
    }

    const msgIsGroupBlock = await Setting.findOne({
      where: {
        key: "timeCreateNewTicket",
        userId: null,
        campaignId: null,
      }
    });

    const value = msgIsGroupBlock ? parseInt(msgIsGroupBlock.value, 10) : 7200;
  }

  if (ticket.status !== "closed") {
    const dataPayload = {
      ticketId: ticket.id,
      companyId,
      whatsappId,
      userId: ticket.userId,
      seqOptions
    };
    const [created, ticketTraking] = await FindOrCreateATicketTrakingService(dataPayload);

    if (!created) {
      await UpdateTicketTrakingService(dataPayload);
    }
  }

  ticket = await ShowTicketService(ticket.id, companyId);

  return [createdTicket, ticket];
};

export default FindOrCreateTicketService;

