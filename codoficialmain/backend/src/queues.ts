import * as Sentry from "@sentry/node";
import Queue from "bull";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import Whatsapp from "./models/Whatsapp";
import { logger } from "./utils/logger";
import moment from "moment";
import Schedule from "./models/Schedule";
import Contact from "./models/Contact";
import { Op, QueryTypes } from "sequelize";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import Campaign from "./models/Campaign";
import ContactList from "./models/ContactList";
import ContactListItem from "./models/ContactListItem";
import { isEmpty, isNil, isArray } from "lodash";
import Setting from "./models/Setting";
import CampaignShipping from "./models/CampaignShipping";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import sequelize from "./database";
import { getMessageOptions } from "./services/WbotServices/SendWhatsAppMedia";
import { getIO } from "./libs/socket";
import path from "path";
import User from "./models/User";
import Company from "./models/Company";
import Plan from "./models/Plan";
import FindOrCreateTicketService from "./services/TicketServices/FindOrCreateTicketService";
import { verifyContact } from "./services/WbotServices/wbotMessageListener";
import ShowService from "./services/ContactListItemService/ShowService";
import UpdateTicketService from "./services/TicketServices/UpdateTicketService";
const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface PrepareContactData {
  contactListItemId: number;
  campaignId: number;
  delay: number;
}

interface DispatchCampaignData {
  contactId: number;
  campaignId: number;
  campaignShippingId: number;
}

type CampaignDelay = {
  randomMessageInterval: number;
  longerIntervalAfter: number;
  greaterInterval: number;
  fixedMessageInterval: number;
}

export const userMonitor = new Queue("UserMonitor", connection);


export const messageQueue = new Queue("MessageQueue", connection, {
  limiter: {
    max: limiterMax as number,
    duration: limiterDuration as number
  }
});

export const scheduleMonitor = new Queue("ScheduleMonitor", connection);
export const sendScheduledMessages = new Queue(
  "SendSacheduledMessages",
  connection
);

export const campaignQueue = new Queue("CampaignQueue", connection);

const campaignDelayDefaults:CampaignDelay = {
  randomMessageInterval: 20,
  longerIntervalAfter: 20,
  greaterInterval: 60,
  fixedMessageInterval: 0,
}

async function handleSendMessage(job) {
  try {
    const { data } = job;

    const whatsapp = await Whatsapp.findByPk(data.whatsappId);

    if (whatsapp == null) {
      throw Error("Whatsapp não identificado");
    }

    const messageData: MessageData = data.data;

    await SendMessage(whatsapp, messageData);
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("MessageQueue -> SendMessage: error", e.message);
    throw e;
  }
}

async function handleVerifySchedules(job) {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          [Op.lte]: moment().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss")
        }
      },
      include: [{ model: Contact, as: "contact" }]
    });
    if (count > 0) {
      schedules.map(async schedule => {
        await schedule.update({
          status: "AGENDADA"
        });
        sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000 }
        );
        logger.info(`Disparo agendado para: ${schedule.contact.name}`);
      });
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SendScheduledMessage -> Verify: error", e.message);
    throw e;
  }
}

async function handleSendScheduledMessage(job) {
  const {
    data: { schedule }
  } = job;
  let scheduleRecord: Schedule | null = null;

  try {
    scheduleRecord = await Schedule.findByPk(schedule.id);
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
  }

  try {
    const whatsapp = await GetDefaultWhatsApp(schedule.companyId);

    await SendMessage(whatsapp, {
      number: schedule.contact.number,
      body: schedule.body
    });

    await scheduleRecord?.update({
      sentAt: moment().format("YYYY-MM-DD HH:mm"),
      status: "ENVIADA"
    });

    logger.info(`Mensagem agendada enviada para: ${schedule.contact.name}`);
    sendScheduledMessages.clean(15000, "completed");
  } catch (e: any) {
    Sentry.captureException(e);
    await scheduleRecord?.update({
      status: "ERRO"
    });
    logger.error("SendScheduledMessage -> SendMessage: error", e.message);
    throw e;
  }
}

async function handleVerifyCampaigns(job) {
  /**
   * @todo
   * Implementar filtro de campanhas
   */
  const campaigns: { id: number; scheduledAt: string }[] =
    await sequelize.query(
      `select id, "scheduledAt" from "Campaigns" c
    where "scheduledAt" between now() and now() + '1 hour'::interval and status = 'PROGRAMADA'`,
      { type: QueryTypes.SELECT }
    );
  logger.info(`Campanhas encontradas: ${campaigns.length}`);
  for (let campaign of campaigns) {
    try {
      const now = moment();
      const scheduledAt = moment(campaign.scheduledAt);
      const delay = scheduledAt.diff(now, "milliseconds");
      logger.info(
        `Campanha enviada para a fila de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`
      );
      campaignQueue.add(
        "ProcessCampaign",
        {
          id: campaign.id,
          delay
        },
        {
          removeOnComplete: true
        }
      );
    } catch (err: any) {
      Sentry.captureException(err);
    }
  }
}

async function getCampaign(id) {
  return await Campaign.findByPk(id, {
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: ["id", "name", "number", "email", "isWhatsappValid"],
            where: { isWhatsappValid: true }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: CampaignShipping,
        as: "shipping",
        include: [{ model: ContactListItem, as: "contact" }]
      }
    ]
  });
}

async function getContact(id) {
  return await ContactListItem.findByPk(id, {
    attributes: ["id", "name", "number", "email"]
  });
}

async function getSettings(campaign) {
  const settings = await Setting.findAll({
    where: { companyId: campaign.companyId },
    attributes: ["key", "value"]
  });

  let randomMessageInterval: number = campaignDelayDefaults.randomMessageInterval;
  let longerIntervalAfter: number = campaignDelayDefaults.longerIntervalAfter;
  let greaterInterval: number = campaignDelayDefaults.greaterInterval;
  let fixedMessageInterval: number = campaignDelayDefaults.fixedMessageInterval;

  settings.forEach(setting => {
    if (setting.key === "randomMessageInterval") {
      randomMessageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "fixedMessageInterval") {
      fixedMessageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "longerIntervalAfter") {
      longerIntervalAfter = JSON.parse(setting.value);
    }
    if (setting.key === "greaterInterval") {
      greaterInterval = JSON.parse(setting.value);
    }
  });

  return {
    randomMessageInterval,
    longerIntervalAfter,
    greaterInterval,
    fixedMessageInterval
  };
}

export function parseToMilliseconds(seconds) {
  return seconds * 1000;
}

async function sleep(seconds) {
  logger.info(
    `Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Sleep de ${seconds} segundos finalizado: ${moment().format(
          "HH:mm:ss"
        )}`
      );
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function getCampaignValidMessages(campaign) {
  const messages = [];

  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) {
    messages.push(campaign.message1);
  }

  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) {
    messages.push(campaign.message2);
  }

  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) {
    messages.push(campaign.message3);
  }

  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) {
    messages.push(campaign.message4);
  }

  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) {
    messages.push(campaign.message5);
  }

  return messages;
}

function getCampaignValidConfirmationMessages(campaign) {
  const messages = [];

  if (
    !isEmpty(campaign.confirmationMessage1) &&
    !isNil(campaign.confirmationMessage1)
  ) {
    messages.push(campaign.confirmationMessage1);
  }

  if (
    !isEmpty(campaign.confirmationMessage2) &&
    !isNil(campaign.confirmationMessage2)
  ) {
    messages.push(campaign.confirmationMessage2);
  }

  if (
    !isEmpty(campaign.confirmationMessage3) &&
    !isNil(campaign.confirmationMessage3)
  ) {
    messages.push(campaign.confirmationMessage3);
  }

  if (
    !isEmpty(campaign.confirmationMessage4) &&
    !isNil(campaign.confirmationMessage4)
  ) {
    messages.push(campaign.confirmationMessage4);
  }

  if (
    !isEmpty(campaign.confirmationMessage5) &&
    !isNil(campaign.confirmationMessage5)
  ) {
    messages.push(campaign.confirmationMessage5);
  }

  return messages;
}

function getProcessedMessage(msg: string, contact: any) {
  let finalMessage = msg;

  if (finalMessage.includes("{nome}")) {
    finalMessage = finalMessage.replace(/{nome}/g, contact.name);
  }

  if (finalMessage.includes("{email}")) {
    finalMessage = finalMessage.replace(/{email}/g, contact.email);
  }

  if (finalMessage.includes("{numero}")) {
    finalMessage = finalMessage.replace(/{numero}/g, contact.number);
  }

  return finalMessage;
}

export function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}

async function verifyAndFinalizeCampaign(campaign) {
  const { contacts } = campaign.contactList;

  const count1 = contacts.length;
  const count2 = await CampaignShipping.count({
    where: {
      campaignId: campaign.id,
      deliveredAt: {
        [Op.not]: null
      }
    }
  });

  if (count1 === count2) {
    await campaign.update({ status: "FINALIZADA", completedAt: moment() });
  }

  const io = getIO();
  io.emit(`company-${campaign.companyId}-campaign`, {
    action: "update",
    record: campaign
  });
}

async function handleProcessCampaign(job) {
  const { id }: ProcessCampaignData = job.data;
  let campaign = null;
  try {
    campaign = await getCampaign(id);
    if (!campaign) {
      throw Error("Campanha não identificada");
    }
  } catch (error) {
    throw error;
  }

  try {
    let { delay }: ProcessCampaignData = job.data;
    const settings = await getSettings(campaign);
    const { contacts } = campaign.contactList;
    if (!isArray(contacts)) {
      await campaign.update({ status: "FINALIZADA_COM_ERROS", completedAt: moment() });
      throw Error("Lista de contatos invalida");
    }

    let index = 0;
    for (let contact of contacts) {
      campaignQueue.add(
        "PrepareContact",
        {
          contactListItemId: contact.id,
          campaignId: campaign.id,
          delay: delay || 0
        },
        {
          removeOnComplete: true
        }
      );

      logger.info(
        `Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contact.name};delay=${delay}`
      );
      index++;
      if (index % settings.longerIntervalAfter === 0) {
        //intervalo maior após intervalo configurado de mensagens
        delay += parseToMilliseconds(settings.greaterInterval || 60);
      } else {
        delay += parseToMilliseconds(
          settings.fixedMessageInterval ? settings.fixedMessageInterval : randomValue(0, settings.randomMessageInterval || 20)
        );
      }
    }
    await campaign.update({ status: "EM_ANDAMENTO" });
  } catch (err: any) {
    await campaign.update({ status: "FINALIZADA_COM_ERROS", completedAt: moment() });
    Sentry.captureException(err);
  }
}

async function handlePrepareContact(job) {
const { contactListItemId, campaignId, delay }: PrepareContactData =
  job.data;
  let campaign = null;
  try {
    campaign = await getCampaign(campaignId);
    if (!campaign) {
      throw Error("Campanha não identificada");
    }
  } catch (error) {
    throw error;
  }

  try {
    const contactListItem = await ShowService(contactListItemId);
    const wbot = await GetWhatsappWbot(campaign.whatsapp);
    const contact = await verifyContact({ wbot, companyId: campaign.companyId, newContact: { name: contactListItem.name, number: contactListItem.number } });

    const campaignShipping: any = {};
    campaignShipping.number = contact.number;
    campaignShipping.contactId = contactListItem.id;
    campaignShipping.campaignId = campaignId;

    const messages = getCampaignValidMessages(campaign);
    if (messages.length) {
      const radomIndex = randomValue(0, messages.length);
      const message = getProcessedMessage(
        messages[radomIndex],
        contact
      );
      campaignShipping.message = `\u200c${message}`;
    }

    if (campaign.confirmation) {
      const confirmationMessages =
        getCampaignValidConfirmationMessages(campaign);
      if (confirmationMessages.length) {
        const radomIndex = randomValue(0, confirmationMessages.length);
        const message = getProcessedMessage(
          confirmationMessages[radomIndex],
          contact
        );
        campaignShipping.confirmationMessage = `\u200c${message}`;
      }
    }

    const [record, created] = await CampaignShipping.findOrCreate({
      where: {
        campaignId: campaignShipping.campaignId,
        contactId: campaignShipping.contactId
      },
      defaults: campaignShipping
    });

    if (
      !created &&
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      record.set(campaignShipping);
      await record.save();
    }

    if (
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      const nextJob = await campaignQueue.add(
        "DispatchCampaign",
        {
          campaignId: campaign.id,
          campaignShippingId: record.id,
          contactId: contact.id,
        },
        {
          delay
        }
      );

      await record.update({ jobId: nextJob.id });
    }

    await verifyAndFinalizeCampaign(campaign);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`campaignQueue -> PrepareContact -> error: ${err.message}`);
    await campaign.update({ status: "FINALIZADA_COM_ERROS", completedAt: moment() });
    throw Error("Contato invalido");
  }
}

async function handleDispatchCampaign(job) {
  const { data } = job;
  const { campaignShippingId, campaignId, contactId }: DispatchCampaignData = data;


  let campaign = null;
  try {
    campaign = await getCampaign(campaignId);
    if (!campaign) {
      throw Error("Campanha não identificada");
    }
  } catch (error) {
    throw error;
  }

  const newTicket = {
    contactId: contactId,
    queueId: campaign.queueId,
    userId: campaign.userId,
    status: "campaign",
    companyId: campaign.companyId,
    whatsappId: campaign.whatsappId
  };

  try {
    logger.info(
      `Disparo de campanha solicitado: Campanha=${campaignId};Registro=${campaignShippingId}`
      );

    const [created, ticket] = await FindOrCreateTicketService(newTicket);

    if (!created) {
      await UpdateTicketService({ ticketData: newTicket, ticketId: ticket.id, companyId: campaign.companyId });
    }

    if (!ticket) {
      throw Error("Erro na criação do ticket da campanha");
    }

  } catch (err: any) {

    await campaign.update({ status: "FINALIZADA_COM_ERROS", completedAt: moment() });
    Sentry.captureException(err);
    logger.error(err.message);
    console.log(err.stack);
    throw Error("Erro no disparo da campanha");

  }

  try {
    const campaignShipping = await CampaignShipping.findByPk(
      campaignShippingId,
      {
        include: [{ model: ContactListItem, as: "contact" }]
      }
    );
    const wbot = await GetWhatsappWbot(campaign.whatsapp);
    const chatId = `${campaignShipping.number}@s.whatsapp.net`;
    const isConfirm = campaign.confirmation && campaignShipping.confirmation === null;
    if (!isConfirm && campaign.mediaPath) {
      const filePath = path.resolve("public", campaign.mediaPath);
      const options = await getMessageOptions(campaign.mediaName, filePath, `\u200c${campaign.mediaName}`);
      if (Object.keys(options).length) {
        await wbot.sendMessage(chatId, { ...options });
      }
    }
    await wbot.sendMessage(chatId, {
      text: isConfirm ? campaignShipping.confirmationMessage : campaignShipping.message
    });
    const confirmUpdate = isConfirm ? { confirmationRequestedAt: moment() } : { deliveredAt: moment() }
    await campaignShipping.update(confirmUpdate);

    await verifyAndFinalizeCampaign(campaign);

    const io = getIO();
    io.emit(`company-${campaign.companyId}-campaign`, {
      action: "update",
      record: campaign
    });

    logger.info(
      `Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`
    );
  } catch (error) {

    await campaign.update({ status: "FINALIZADA_COM_ERROS", completedAt: moment() });
    const [created, ticket] = await FindOrCreateTicketService(newTicket);
    await UpdateTicketService({ ticketData: { ...newTicket, justClose: true, status: "closed" }, ticketId: ticket.id, companyId: campaign.companyId });
    Sentry.captureException(error);
    logger.error(error.message);
    console.log(error.stack);
    throw Error("Erro no disparo da campanha");

  }
}

async function handleLoginStatus(job) {
  const users: { id: number }[] = await sequelize.query(
    `select id from "Users" where "updatedAt" < now() - '5 minutes'::interval and online = true`,
    { type: QueryTypes.SELECT }
  );
  for (let item of users) {
    try {
      const user = await User.findByPk(item.id);
      await user.update({ online: false });
      logger.info(`Usuário passado para offline: ${item.id}`);
    } catch (e: any) {
      Sentry.captureException(e);
    }
  }
}


async function handleInvoiceCreate() {
  const job = new CronJob('0 * * * * *', async () => {


    const companies = await Company.findAll();
    companies.map(async c => {
      var dueDate = c.dueDate;
      const date = moment(dueDate).format();
      const timestamp = moment().format();
      const hoje = moment(moment()).format("DD/MM/yyyy");
      var vencimento = moment(dueDate).format("DD/MM/yyyy");

      var diff = moment(vencimento, "DD/MM/yyyy").diff(moment(hoje, "DD/MM/yyyy"));
      var dias = moment.duration(diff).asDays();

      if (dias < 20) {
        const plan = await Plan.findByPk(c.planId);

        const sql = `SELECT COUNT(*) mycount FROM "Invoices" WHERE "companyId" = ${c.id} AND "dueDate"::text LIKE '${moment(dueDate).format("yyyy-MM-DD")}%';`
        const invoice = await sequelize.query(sql,
          { type: QueryTypes.SELECT }
        );
        if (invoice[0]['mycount'] > 0) {

        } else {
          const sql = `INSERT INTO "Invoices" (detail, status, value, "updatedAt", "createdAt", "dueDate", "companyId")
          VALUES ('${plan.name}', 'open', '${plan.value}', '${timestamp}', '${timestamp}', '${date}', ${c.id});`

          const invoiceInsert = await sequelize.query(sql,
            { type: QueryTypes.INSERT }
          );

/*           let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'email@gmail.com',
              pass: 'senha'
            }
          });

          const mailOptions = {
            from: 'heenriquega@gmail.com', // sender address
            to: `${c.email}`, // receiver (use array of string for a list)
            subject: 'Fatura gerada - Sistema', // Subject line
            html: `Olá ${c.name} esté é um email sobre sua fatura!<br>
<br>
Vencimento: ${vencimento}<br>
Valor: ${plan.value}<br>
Link: ${process.env.FRONTEND_URL}/financeiro<br>
<br>
Qualquer duvida estamos a disposição!
            `// plain text body
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err)
              console.log(err)
            else
              console.log(info);
          }); */

        }





      }

    });
  });
  job.start()
}


handleInvoiceCreate()

export async function startQueueProcess() {
  logger.info("Iniciando processamento de filas");

  messageQueue.process("SendMessage", handleSendMessage);

  scheduleMonitor.process("Verify", handleVerifySchedules);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  campaignQueue.process("VerifyCampaignsDaatabase", handleVerifyCampaigns);

  campaignQueue.process("ProcessCampaign", handleProcessCampaign);

  campaignQueue.process("PrepareContact", handlePrepareContact);

  campaignQueue.process("DispatchCampaign", handleDispatchCampaign);

  userMonitor.process("VerifyLoginStatus", handleLoginStatus);




  scheduleMonitor.add(
    "Verify",
    {},
    {
      repeat: { cron: "*/5 * * * * *" },
      removeOnComplete: true
    }
  );

  campaignQueue.add(
    "VerifyCampaignsDaatabase",
    {},
    {
      repeat: { cron: "*/20 * * * * *" },
      removeOnComplete: true
    }
  );

  userMonitor.add(
    "VerifyLoginStatus",
    {},
    {
      repeat: { cron: "* * * * *" },
      removeOnComplete: true
    }
  );
}