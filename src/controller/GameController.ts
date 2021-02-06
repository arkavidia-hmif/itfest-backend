import { Request, Response } from "express";
import { getConnection, getRepository, Repository } from "typeorm";

import { Feedback } from "../entity/Feedback";
import { Game, GameFactory } from "../entity/Game";
import { GameState } from "../entity/GameState";
import { Scoreboard } from "../entity/Scoreboard";
import { GlobalScoreboard } from "../entity/GlobalScoreboard";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Transaction, TransactionType } from "../entity/Transaction";
import { responseGenerator } from "../utils/responseGenerator";
import { partialUpdate } from "../utils/partialUpdateEntity";

export class GameController {
  private userRepository = getRepository(User);
  private feedbackRepository = getRepository(Feedback);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private gameRepository = getRepository(Game);
  private gameStateRepository = getRepository(GameState);
  private scoreboardRepository = getRepository(Scoreboard);

  // get data game
  async getGame(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    const gameId = request.params.id;

    let game = await this.gameRepository.findOne(gameId);

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

    game.problem = JSON.parse(game.problem);

    return responseGenerator(response, 200, "ok", game);
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
        });
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

    const { difficulty, type } = request.body;

    if (role === UserRole.ADMIN) {
      tenantId = request.body.tenantId;
    }

    try {
      const game = await this.gameRepository.save({
        name: request.body.name,
        tenant: tenantId,
        problem: JSON.stringify(request.body.problem),
        answer: JSON.stringify(request.body.answer),
        type: type,
        difficulty: difficulty
      });
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
    const pointMultiplier = 0.5; // Score to point Multiplier

    const userId = response.locals.auth.id;
    const gameId = request.params.id;
    const answer = request.body.answer;

    if (!answer) {
      return responseGenerator(response, 404, "answer not found");
    }

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

        const score: number = this.evaluateScore(game, answer);

        const globalBoard: GlobalScoreboard = await tmGlobalScoreboardRepository.findOne({ user: { id: userId } }, { relations: ["user"] });

        if (globalBoard) {
          await transactionManager.increment(GlobalScoreboard, { user: { id: userId } }, "score", score);
        } else {
          await tmGlobalScoreboardRepository.save({
            user: userId,
            score: score,
            lastUpdated: new Date()
          });
        }

        await tmScoreboardRepository.save({
          user: userId,
          game: gameId,
          score: score,
          playedAt: gameState.startTime
        });

        gameState.isSubmit = true;
        gameState.submitTime = new Date();
        await tmGameStateRepository.save(gameState);

        const pointDelta = score * pointMultiplier;

        const tenant = await tmTenantRepository.findOne(game.tenant, { relations: ["userId"] });

        if (tenant.point < pointDelta) {
          throw "not-enough-point";
        }

        await transactionManager.increment(Visitor, { userId: userId }, "point", pointDelta);
        await transactionManager.decrement(Tenant, { userId: userId }, "point", pointDelta);

        await tmTransactionRepository.save({
          type: TransactionType.PLAY,
          from: game.tenant.userId,
          to: userId,
          amount: pointDelta
        });
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

  evaluateScore(game: Game, userAnswer: Record<string, string>): number {
    const gs = GameFactory.createGame(game, userAnswer);
    return gs.evaluateScore();
  }


  async updateGame(request: Request, response: Response): Promise<void> {
    const id = request.params.id;
    const role = response.locals.auth.role;

    try {

      const game = await this.gameRepository.findOne(id);

      if (!game) {
        return responseGenerator(response, 404, "game-not-found");
      }

      if (request.body.problem) {
        request.body.problem = JSON.stringify(request.body.problem);
      }

      if (request.body.answer) {
        request.body.answer = JSON.stringify(request.body.answer);
      }

      let updatedGame = partialUpdate(game, request.body, ["name", "difficulty", "type", "problem", "answer"]);

      if (role === UserRole.ADMIN) {
        updatedGame = partialUpdate(game, request.body, ["tenantUserId"]);
      }

      await this.gameRepository.save(updatedGame);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return responseGenerator(response, 500, "unknown-error");
    }

    return responseGenerator(response, 200, "ok");
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

    const scoreGame = await this.scoreboardRepository.findOne(userId, { relations: ["game", "game.tenant", "game.tenant.userId"] });

    if (scoreGame.game.tenant.userId.id !== +tenantId) {
      return responseGenerator(response, 404, "not-play-already");
    }

    const feedback = await this.feedbackRepository.findOne({
      where: {
        from: visitor,
        to: tenant,
      }
    });

    if (feedback) {
      return responseGenerator(response, 400, "already-give-feedback");
    } else {
      await this.feedbackRepository.save({
        from: visitor,
        to: tenant,
        rating: score,
        remark: praise.join(", "),
        comment: comment || ""
      });
    }

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
        acc += current.rating;
      }
      return acc;
    };

    const total = feedback.reduce(reducer, 0);
    const review = total / feedback.length;

    return responseGenerator(response, 200, "ok", { review });
  }
}