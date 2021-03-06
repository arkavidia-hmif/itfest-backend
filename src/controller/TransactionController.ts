import { Request, Response } from "express";

import { Transaction, TransactionType } from "../entity/Transaction";
import { getRepository, getConnection, FindOneOptions, FindConditions } from "typeorm";
import { responseGenerator } from "../utils/responseGenerator";
import { User, UserRole, Visitor, Tenant } from "../entity/User";
import { decodeQr } from "../utils/qr";
import { globalSocket } from "../routes/socket";

export class TransactionController {

  private transactionRepository = getRepository(Transaction);

  async getTransaction(
    where?: FindConditions<Transaction> | Array<FindConditions<Transaction>>,
    page?: number,
    itemPerPage?: number
  ): Promise<[Array<Transaction>, number]> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      take: itemPerPage,
      skip: (page - 1) * itemPerPage,
      relations: ["from", "to", "item"],
    });

    const transactionsCleaned = transactions.map((transaction) => {
      if (transaction.type !== TransactionType.REDEEM) {
        delete transaction.item;
      }
      return transaction;
    });

    return [transactionsCleaned, total];
  }

  async getAllTransaction(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    const [transactionsCleaned, total] = await this.getTransaction(null, page, itemPerPage);

    return responseGenerator(response, 200, "ok", {
      array: transactionsCleaned,
      page,
      itemPerPage,
      total
    });
  }

  async give(request: Request, response: Response) {
    const fromId = response.locals.auth.id;
    const toId = request.params.id || "-1";

    try {
      await getConnection().transaction(async transactionManager => {

        const fromUser = await transactionManager.findOneOrFail(User, fromId);
        const toUser = await transactionManager.findOneOrFail(User, toId);
        const amount = parseInt(request.body.amount, 10);

        if (fromId === parseInt(toId, 10)) {
          throw "same-user-transfer";
        }

        let fromUserRepository;

        if (fromUser.role === UserRole.VISITOR) {
          fromUserRepository = transactionManager.getRepository(Visitor);
        } else if (fromUser.role === UserRole.TENANT) {
          fromUserRepository = transactionManager.getRepository(Tenant);
        }

        if (fromUser.role !== UserRole.ADMIN) {
          const fromPointData = await fromUserRepository.findOneOrFail(fromUser.id, { relations: ["userId"] });
          if (fromPointData.point < amount) {
            throw "not-enough-point";
          }

          await fromUserRepository.decrement({
            userId: fromUser.id
          }, "point", amount);
        }

        await transactionManager.save(Transaction, {
          from: fromUser,
          to: toUser,
          amount: amount,
          type: TransactionType.GIVE
        });

        let toUserRepository;

        if (toUser.role === UserRole.VISITOR) {
          toUserRepository = transactionManager.getRepository(Visitor);
        } else if (toUser.role === UserRole.TENANT) {
          toUserRepository = transactionManager.getRepository(Tenant);
        }

        if (toUser.role !== UserRole.ADMIN) {
          await toUserRepository.increment({ userId: toUser.id }, "point", amount);
        }

        if (globalSocket[toId]) {
          globalSocket[toId].emit("transaction", {
            type: "give",
            from: {
              id: fromUser.id,
              name: fromUser.name || fromUser.username,
            },
            amount: amount
          });
        }
      });
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else if (error.name === "EntityNotFound") {
        return responseGenerator(response, 404, "user-not-found");
      } else {
        return responseGenerator(response, 500, "unknown-error", error);
      }
    }


    return responseGenerator(response, 200, "ok");
  }

  async giveQr(request: Request, response: Response) {
    const userString = decodeQr(request.params.qrid);

    try {
      const userData = JSON.parse(userString);

      request.params.id = userData.id;

      return this.give(request, response);
    } catch (error) {
      console.error(error);
      return responseGenerator(response, 400, "invalid-qrid");
    }
  }
}