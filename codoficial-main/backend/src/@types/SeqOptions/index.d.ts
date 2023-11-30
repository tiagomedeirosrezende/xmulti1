import { Transaction } from 'sequelize';

export type SeqOptions = {
  transaction?: Transaction,
}