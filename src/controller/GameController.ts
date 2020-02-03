import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Feedback } from "../entity/Feedback";
import { Game } from "../entity/Game";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { partialUpdate } from "../utils/partialUpdateEntity";
import { decodeQr } from "../utils/qr";
import { responseGenerator } from "../utils/responseGenerator";
import { globalSocket } from "../routes/socket";
import { isError } from "util";
import { Transaction, TransactionType } from "../entity/Transaction";

export class GameController {

  private userRepository = getRepository(User);
  private feedbackRepository = getRepository(Feedback);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private gameRepository = getRepository(Game);

  async listGame(request: Request, response: Response) {
    const { id, role } = response.locals.auth;
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    let whereParam = {};
    if (role === UserRole.TENANT) {
      const tenant = await this.tenantRepository.findOne(id, { relations: ["userId"] });
      whereParam = { tenant };
    }

    try {
      const [game, total] = await this.gameRepository.findAndCount({
        where: whereParam,
        take: itemPerPage,
        skip: (page - 1) * itemPerPage
      });

      return responseGenerator(response, 200, "ok", {
        array: game,
        page,
        itemPerPage,
        total
      });
    } catch (error) {
      console.error(error);
      return responseGenerator(response, 500, "unknown-error");
    }

  }

  async registerGame(request: Request, response: Response) {
    const authId = response.locals.auth.id;
    const role = response.locals.auth.role;
    const { name, difficulty, tenant } = request.body;

    let id = authId;

    if (role === UserRole.ADMIN) {
      if (!tenant) {
        return responseGenerator(response, 400, "admin-no-tenant-id");
      }
      id = tenant;
    }

    const tenantObj = await this.tenantRepository.findOne(id, { relations: ["userId"] });

    if (!tenantObj) {
      return responseGenerator(response, 404, "tenant-not-found");
    }

    await this.gameRepository.save({
      name,
      tenant: tenantObj,
      difficulty,
    });

    return responseGenerator(response, 200, "ok");
  }

  async deleteGame(request: Request, response: Response) {
    const id = response.locals.auth.id;
    const role = response.locals.auth.role;
    const gameId = request.params.id;

    const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    if (role !== UserRole.ADMIN && game.tenant.userId.id !== id) {
      return responseGenerator(response, 403, "forbidden");
    }

    await this.gameRepository.delete(gameId);

    return responseGenerator(response, 200, "ok");
  }

  async getGame(request: Request, response: Response) {
    const id = response.locals.auth.id;
    const role = response.locals.auth.role;
    const gameId = request.params.id;

    const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    if (role !== UserRole.ADMIN && game.tenant.userId.id !== id) {
      return responseGenerator(response, 403, "forbidden");
    }

    delete game.tenant;

    return responseGenerator(response, 200, "ok", game);
  }

  async updateGame(request: Request, response: Response) {
    const id = response.locals.auth.id;
    const role = response.locals.auth.role;
    const gameId = request.params.id;

    const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    if (role !== UserRole.ADMIN && game.tenant.userId.id !== id) {
      return responseGenerator(response, 403, "forbidden");
    }

    try {
      await this.gameRepository.save(partialUpdate(game, request.body, ["name", "difficulty"]));
    } catch (error) {
      console.error(error);
    }

    return responseGenerator(response, 200, "ok");
  }

  async checkPlayStatus(request: Request, response: Response) {
    const userString = decodeQr(request.params.qrid);
    const tenantId = response.locals.auth.id;

    let userData: any = {};

    try {
      userData = JSON.parse(userString);

    } catch (error) {
      console.error(error);
      return responseGenerator(response, 400, "invalid-qrid");
    }

    const visitor = await this.visitorRepository.findOne(userData.id, {
      relations: ["userId"]
    });
    if (!visitor) {
      return responseGenerator(response, 404, "visitor-not-found");
    }

    const tenant = await this.tenantRepository.findOne(tenantId, {
      relations: ["userId"]
    });

    const feedback = await this.feedbackRepository.findOne({
      where: {
        from: visitor,
        to: tenant
      }
    });

    return responseGenerator(response, 200, "ok", {
      played: !!feedback,
      rated: feedback.rated
    });
  }

  async playGame(request: Request, response: Response) {
    const tenantId = response.locals.auth.id;
    const userString = decodeQr(request.params.qrid);
    const difficulties: number[] = request.body.difficulty;

    let userData: any = {};

    try {
      userData = JSON.parse(userString);

    } catch (error) {
      console.error(error);
      return responseGenerator(response, 400, "invalid-qrid");
    }

    const user = await this.userRepository.findOne(userData.id);

    if (!user || user.role !== UserRole.VISITOR) {
      return responseGenerator(response, 404, "user-not-found");
    }

    try {
      await getConnection().transaction(async transactionManager => {
        const tmTenantRepository = transactionManager.getRepository(Tenant);
        const tmVisitorRepository = transactionManager.getRepository(Visitor);
        const tmFeedbackRepository = transactionManager.getRepository(Feedback);
        const tmTransactionRepository = transactionManager.getRepository(Transaction);


        const reducer = (acc, current) => {
          acc += config.gamePoint[current];
          return acc;
        }

        const pointDelta = difficulties.reduce(reducer, 0);

        const tenant = await tmTenantRepository.findOne(tenantId, { relations: ["userId"] });

        if (tenant.point < pointDelta) {
          throw "not-enough-point";
        }

        tenant.point -= pointDelta;

        await tmTenantRepository.save(tenant);

        const visitor = await tmVisitorRepository.findOne(user.id, { relations: ["userId"] });

        visitor.point += pointDelta;

        await tmVisitorRepository.save(visitor);

        const feedback = await tmFeedbackRepository.findOne({
          where: {
            from: visitor,
            to: tenant
          }
        });

        if (feedback) {
          throw "already-play-game";
        }

        await tmFeedbackRepository.save({
          from: visitor,
          to: tenant,
          rated: false
        });

        await tmTransactionRepository.save({
          type: TransactionType.PLAY,
          from: tenant.userId,
          to: visitor.userId,
          amount: pointDelta,
        });

        if (globalSocket[user.id]) {
          globalSocket[user.id].emit("transaction", {
            type: "play",
            tenant: {
              id: tenant.userId.id,
              name: tenant.userId.name
            },
            amount: pointDelta
          })
        }
      });
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else {
        console.error(error);
        return responseGenerator(response, 500, "unknown-error");
      }
    }

    return responseGenerator(response, 200, "ok");
  }

  async giveFeedback(request: Request, response: Response) {
    const tenantId = request.params.id;
    const userId = response.locals.auth.id;

    const { score, praise, comment } = request.body;

    const tenant = await this.tenantRepository.findOne(tenantId, { relations: ["userId"] });

    if (!tenant) {
      return responseGenerator(response, 404, "tenant-not-found");
    }

    const visitor = await this.visitorRepository.findOne(userId, { relations: ["userId"] });

    const feedback = await this.feedbackRepository.findOne({
      where: {
        from: visitor,
        to: tenant,
      }
    });

    if (feedback.rated) {
      return responseGenerator(response, 400, "already-reviewed");
    }

    feedback.rated = true;
    feedback.rating = score;
    feedback.remark = praise.join(", ");
    feedback.comment = comment || "";

    await this.feedbackRepository.save(feedback);

    return responseGenerator(response, 200, "ok");
  }

  async getFeedback(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    const userRole = response.locals.auth.role;
    const tenantId = request.params.id;

    const tenant = await this.tenantRepository.findOne(tenantId, { relations: ["userId"] });

    if (!tenant) {
      return responseGenerator(response, 404, "tenant-not-found");
    }

    if (userRole !== UserRole.ADMIN && tenant.userId.id !== userId) {
      return responseGenerator(response, 403, "forbidden");
    }

    const feedback = await this.feedbackRepository.find({
      where: {
        to: tenant,
      }
    });

    const reducer = (acc, current) => {
      if (current.rated) {
        acc += current.rating
      }
      return acc;
    }

    const total = feedback.reduce(reducer, 0);
    const review = total / feedback.length;

    return responseGenerator(response, 200, "ok", { review });
  }
}