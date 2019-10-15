import { Request, Response } from "express";

import { Transaction } from "../entity/Transaction";
import { getRepository, getConnection } from "typeorm";
import { responseGenerator } from "../utils/responseGenerator";
import { User, UserRole, Visitor, Tenant } from "../entity/User";

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

  async give(request: Request, response: Response) {
    const fromId = response.locals.auth.id;
    const toId = request.params.id;

    try {
      await getConnection().transaction(async transactionManager => {

        const fromUser = await transactionManager.findOneOrFail(User, fromId);
        const toUser = await transactionManager.findOneOrFail(User, toId);
        const amount = parseInt(request.body.amount, 10);

        if (fromId == toId) {
          throw "same-user-transfer";
        }

        let fromUserRepository;

        if (fromUser.role === UserRole.VISITOR) {
          fromUserRepository = transactionManager.getRepository(Visitor);
        } else if (fromUser.role === UserRole.TENANT) {
          fromUserRepository = transactionManager.getRepository(Tenant);
        }

        if (fromUser.role !== UserRole.ADMIN) {
          const fromPointData = await fromUserRepository.findOneOrFail(fromUser.id);
          if (fromPointData.point < amount) {
            throw "not-enough-point";
          }

          await fromUserRepository.update(fromPointData, {
            point: fromPointData.point - amount,
          });
        }

        await transactionManager.insert(Transaction, {
          from: fromUser,
          to: toUser,
          amount: amount,
          transfer: true
        });

        let toUserRepository;

        if (toUser.role === UserRole.VISITOR) {
          toUserRepository = transactionManager.getRepository(Visitor);
        } else if (toUser.role === UserRole.TENANT) {
          toUserRepository = transactionManager.getRepository(Tenant);
        }

        if (toUser.role !== UserRole.ADMIN) {
          const toPointData = await toUserRepository.findOneOrFail(toUser.id);
          await toUserRepository.update(toPointData, {
            point: toPointData.point + amount
          });
        }
      });
    } catch (error) {
      if (typeof error === 'string') {
        return responseGenerator(response, 400, error);
      } else if (error.name === 'EntityNotFound') {
        return responseGenerator(response, 404, "user-not-found");
      } else {
        return responseGenerator(response, 500, "unknown-error", error);
      }
    }

    return responseGenerator(response, 200, "ok");
  }

  async transferPoint(request: Request, response: Response) {

  }
}