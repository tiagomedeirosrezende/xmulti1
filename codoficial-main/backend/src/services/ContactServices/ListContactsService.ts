import { Sequelize, Op } from "sequelize";
import Contact from "../../models/Contact";
import TicketTraking from "../../models/TicketTraking";
import Ticket from "../../models/Ticket";
import { UserViewModel } from "../../@types/UserViewModel";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  user: UserViewModel;
  companyId: number;
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  user,
  companyId
}: Request): Promise<Response> => {
  let whereCondition = {
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Contact.name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      },
      { number: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } }
    ],
    companyId: {
      [Op.eq]: companyId
    },
  };

  let query = {};
  let includeCondition;

  if (user.profile !== "admin") {

    includeCondition = [
      {
        model: Ticket,
        as: "tickets",
        required: true,
        attributes: [],
        include: [
          {
            model: TicketTraking,
            as: "ticketTrakings",
            required: true,
            attributes: [],
            where: {
              userId: user.id
            }
          },
        ],

      },
    ];
  }


  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  query = {
    ...query,

  }

  const { count, rows: contacts } = await Contact.findAndCountAll({
      where: whereCondition,
      include: includeCondition,
      limit,
      offset,
      order: [["name", "ASC"]]
    }
  );

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService;
