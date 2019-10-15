import { getRepository } from "typeorm";
import { Request, Response } from "express";
import { responseGenerator } from "../utils/responseGenerator";
import { Transaction } from "../entity/Transaction";

export class TransactionController {

  private transactionRepository = getRepository(Transaction);

  async getAllTransaction(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    const [transactions, total] = await this.transactionRepository.findAndCount({
      take: itemPerPage,
      skip: (page - 1) * itemPerPage
    });

    return responseGenerator(response, 200, "ok", {
      array: transactions,
      page,
      itemPerPage,
      total
    });
  }

  async transferPoint(request: Request, response: Response) {

  }
}