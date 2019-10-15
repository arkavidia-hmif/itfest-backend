import { Request, Response } from "express";

import { Transaction } from "../entity/Transaction";
import { getRepository } from "typeorm";
import { responseGenerator } from "../utils/responseGenerator";

export class TransactionController {

  private transactionRepository = getRepository(Transaction);

  async getTransaction(where?: object, page?: number, itemPerPage?: number) {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      take: itemPerPage,
      skip: (page - 1) * itemPerPage
    });

    const transactionsCleaned = transactions.map((transaction) => {
      if (transaction.transfer) {
        delete transaction.itemId;
      }
      return transaction;
    });

    return [transactionsCleaned, total];
  }

  async getAllTransaction(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    const [transactionsCleaned, total] = await this.getTransaction(null, page, itemPerPage)

    return responseGenerator(response, 200, "ok", {
      array: transactionsCleaned,
      page,
      itemPerPage,
      total
    });
  }

  async transferPoint(request: Request, response: Response) {

  }
}