import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Feedback } from "../entity/Feedback";
import { Game } from "../entity/Game";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { partialUpdate } from "../utils/partialUpdateEntity";
import { decodeQr } from "../utils/qr";
import { responseGenerator } from "../utils/responseGenerator";

export class GameController {

  private userRepository = getRepository(User);
  private feedbackRepository = getRepository(Feedback);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private gameRepository = getRepository(Game);

  async listGame(request: Request, response: Response) {
    const { id, role } = response.locals.auth;

    let whereParam = {};
    if (role === UserRole.TENANT) {
      const tenant = await this.tenantRepository.findOne(id, { relations: ["userId"] });
      whereParam = { tenant };
    }

    try {
      const game = await this.gameRepository.find({ where: whereParam });

      return responseGenerator(response, 200, "ok", game);
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

  async playGame(request: Request, response: Response) {
    const tenantId = response.locals.auth.id;
    const userString = decodeQr(request.params.qrid);
    const gameId: number[] = request.body.game;

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

    const game = await this.gameRepository.findByIds(gameId);

    if (game.length !== gameId.length) {
      return responseGenerator(response, 404, "game-not-found");
    }

    try {
      await getConnection().transaction(async transactionManager => {
        const tmTenantRepository = transactionManager.getRepository(Tenant);
        const tmVisitorRepository = transactionManager.getRepository(Visitor);
        const tmFeedbackRepository = transactionManager.getRepository(Feedback);


        const reducer = (acc, current) => {
          acc += config.gamePoint[current.difficulty];
          return acc;
        }

        const pointDelta = game.reduce(reducer, 0);

        const tenant = await tmTenantRepository.findOne(tenantId, { relations: ["userId"] });

        if (tenant.point < pointDelta) {
          throw "not-enough-point";
        }

        tenant.point -= pointDelta;

        await tmTenantRepository.save(tenant);

        const visitor = await tmVisitorRepository.findOne(user.id, { relations: ["userId"] });

        visitor.point += pointDelta

        await tmVisitorRepository.save(visitor);

        const feedbackCheckPromise = game.map((entry) => {
          return tmFeedbackRepository.findOne({
            where: {
              from: visitor,
              to: entry,
            }
          });
        })

        const feedbackCheck = (await Promise.all(feedbackCheckPromise)).map((entry) => !!entry);

        if (feedbackCheck.includes(true)) {
          throw "already-play-game";
        }

        const feedbackPromise = game.map((entry) => {
          return tmFeedbackRepository.save({
            from: visitor,
            to: entry,
            rating: 0,
            remark: "",
            rated: false
          });
        });

        await Promise.all(feedbackPromise);
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
    const gameId = request.params.id;
    const userId = response.locals.auth.id;

    const { score, praise } = request.body;

    const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    const visitor = await this.visitorRepository.findOne(userId, { relations: ["userId"] });

    const feedback = await this.feedbackRepository.findOne({
      where: {
        from: visitor,
        to: game,
      }
    });

    if (feedback.rated) {
      return responseGenerator(response, 400, "already-reviewed");
    }

    feedback.rated = true;
    feedback.rating = score;
    feedback.remark = praise.join(', ');

    await this.feedbackRepository.save(feedback);

    return responseGenerator(response, 200, "ok");
  }

  async getFeedback(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    const userRole = response.locals.auth.role;
    const gameId = request.params.id;

    const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    if (userRole !== UserRole.ADMIN && game.tenant.userId.id !== userId) {
      return responseGenerator(response, 403, "forbidden");
    }

    const feedback = await this.feedbackRepository.find({
      where: {
        to: game,
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