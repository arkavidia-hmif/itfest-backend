import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Feedback } from "../entity/Feedback";
import { Game, GameType } from "../entity/Game";
import { GameState } from "../entity/GameState";
import { Scoreboard } from "../entity/Scoreboard";
import { GlobalScoreboard } from "../entity/GlobalScoreboard";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Transaction, TransactionType } from "../entity/Transaction";
import { responseGenerator } from "../utils/responseGenerator";

import { partialUpdate } from "../utils/partialUpdateEntity";
import { globalSocket } from "../routes/socket";

export class GameController {
  private userRepository = getRepository(User);
  private feedbackRepository = getRepository(Feedback);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private gameRepository = getRepository(Game);
  private gameStateRepository = getRepository(GameState);
  private scoreboardRepository = getRepository(Scoreboard);
  private transactionRepository = getRepository(Transaction);

  // get data game
  async getGame(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    const gameId = request.params.id;

    const game = await this.gameRepository.findOne(gameId);

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    const gameState = await this.gameStateRepository.findOne({
      where: {
        game: gameId,
        user: userId
      }
    });

    if (!gameState) {
      return responseGenerator(response, 400, "game-havent-started");
    }

    if (gameState.isSubmit) {
      return responseGenerator(response, 400, "user-already-play");
    }

    delete game.tenant;
    delete game.answer;

    return responseGenerator(response, 200, 'ok', JSON.parse(game.problem));
    // return responseGenerator(response, 200, 'ok', { "questions": game.problem });
  }

  async playGame(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    const gameId: any = +request.params.id;

    const user = await this.userRepository.findOne(userId);

    if (!user || user.role !== UserRole.VISITOR) {
      return responseGenerator(response, 404, "user-not-found");
    }

    try {
      const gameState = await this.gameStateRepository.findOne({
        where: {
          game: gameId,
          user: userId
        }
      });

      if (!gameState) {
        await this.gameStateRepository.save({
          game: gameId,
          user: userId,
          isSubmit: false
        })
      } else if (gameState.isSubmit) {
        return responseGenerator(response, 400, "user-already-play");
      }
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

  async addGame(request: Request, response: Response) {
    let tenantId = response.locals.auth.id;
    const role = response.locals.auth.role;
    const difficulty = request.body.difficulty;

    if (role === UserRole.ADMIN) {
      tenantId = request.body.tenantId
    }

    try {
      const game = await this.gameRepository.save({
        name: request.body.name,
        tenant: tenantId,
        problem: JSON.stringify(request.body.problem),
        answer: JSON.stringify(request.body.answer),
        difficulty: difficulty
      })
      return responseGenerator(response, 201, "created", { id: game.id });
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else {
        console.error(error);
        return responseGenerator(response, 500, "unknown-error");
      }
    }
  }

  async deleteGame(request: Request, response: Response) {
    const id = response.locals.auth.id;

    const role = response.locals.auth.role;

    const gameId = request.params.id;

    try {
      const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

      if (!game) {
        return responseGenerator(response, 404, "game-not-found");
      }

      if (role !== UserRole.ADMIN && id !== game.tenant.userId.id) {
        return responseGenerator(response, 403, "no-authorization");
      }

      await this.gameRepository.delete(gameId);
      return responseGenerator(response, 204, "ok");
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else {
        console.error(error);
        return responseGenerator(response, 500, "unknown-error");
      }
    }
  }

  async submitGame(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    const gameId: any = request.params.id;
    const { data = {} } = request.body;

    const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    const gameState = await this.gameStateRepository.findOne({
      where: {
        game: gameId,
        user: userId
      }
    });

    if (!gameState) {
      return responseGenerator(response, 400, "user-not-play");
    }

    const timeElapsed = new Date().getTime() - gameState.startTime.getTime();

    if (gameState.isSubmit) {
      return responseGenerator(response, 400, "user-already-submitted");
    }

    try {
      await getConnection().transaction(async transactionManager => {
        const tmTenantRepository = transactionManager.getRepository(Tenant);
        const tmVisitorRepository = transactionManager.getRepository(Visitor);
        const tmFeedbackRepository = transactionManager.getRepository(Feedback);
        const tmTransactionRepository = transactionManager.getRepository(Transaction);
        const tmGameStateRepository = transactionManager.getRepository(GameState);
        const tmScoreboardRepository = transactionManager.getRepository(Scoreboard);
        const tmGlobalScoreboardRepository = transactionManager.getRepository(GlobalScoreboard);

        const score: number = this.evaluateScore(game, data);

        const globalBoard: GlobalScoreboard = await tmGlobalScoreboardRepository.findOne(userId);
        
        if(globalBoard) {
          await tmGlobalScoreboardRepository.remove(globalBoard);
          globalBoard.userId = userId;
          globalBoard.score += score;
          globalBoard.lastUpdated = new Date();
          await tmGlobalScoreboardRepository.insert(globalBoard);
        } else {
          await tmGlobalScoreboardRepository.save({
            userId: userId,
            score: score,
            lastUpdated: new Date()
          });
        }

        // TODO: update scoreboard
        await tmScoreboardRepository.save({
          user: userId,
          game: gameId,
          score: score,
          playedAt: gameState.startTime
        });

        gameState.isSubmit = true
        gameState.submitTime = new Date()
        await tmGameStateRepository.save(gameState);

        // const reducer = (acc, current) => {
        //   acc += config.gamePoint[current];
        //   return acc;
        // }

        // const pointDelta = difficulties.reduce(reducer, 0);

        // const tenant = await tmTenantRepository.findOne(tenantId, { relations: ["userId"] });

        // if (tenant.point < pointDelta) {
        //   throw "not-enough-point";
        // }

        // tenant.point -= pointDelta;

        // await tmTenantRepository.save(tenant);

        // const visitor = await tmVisitorRepository.findOne(user.id, { relations: ["userId"] });

        // visitor.point += pointDelta;

        // await tmVisitorRepository.save(visitor);

        // const feedback = await tmFeedbackRepository.findOne({
        //   where: {
        //     from: visitor,
        //     to: tenant
        //   }
        // });

        // if (feedback) {
        //   throw "already-play-game";
        // }

        // await tmFeedbackRepository.save({
        //   from: visitor,
        //   to: tenant,
        //   rated: false
        // });

        await tmTransactionRepository.save({
          from: game.tenant.userId,
          to: userId,
          amount: score
        })
      })
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

  evaluateScore(game: Game, userAnswer: object): number {
    let point = 0;
    if (game.type == GameType.QUIZ) {
      Object.keys(userAnswer).forEach((key) => {
        if (userAnswer[key] == game.answer[key]) {
          point += 1
        }
      })
    }
    return point;
  }

  async listGame(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    try {
      const [game, total] = await this.gameRepository.findAndCount({
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