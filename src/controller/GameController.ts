import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Feedback } from "../entity/Feedback";
import { Game } from "../entity/Game";
import { GameState } from "../entity/GameState";
import { Scoreboard } from "../entity/Scoreboard";
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
    const gameId : any = +request.params.id;

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

    return responseGenerator(response, 204, "ok");
  }

  async addGame(request: Request, response: Response){
    const tenantId = response.locals.auth.id;
    const difficulty = request.body.difficulty;
    try{
      await this.gameRepository.save({
        name: request.body.name,  
        tenant: tenantId,
        problem: JSON.stringify(request.body.problem),
        answer: JSON.stringify(request.body.answer), 
        difficulty: difficulty
      })
      return responseGenerator(response, 201, "created");
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else {
        console.error(error);
        return responseGenerator(response, 500, "unknown-error");
      }
    }
  }

  async deleteGame(request: Request, response: Response){
    const id = response.locals.auth.id;

    const role = response.locals.auth.role;

    const gameId = request.params.id;

    try{
      const game = await this.gameRepository.findOne(gameId, { relations: ["tenant", "tenant.userId"] });

      if(!game){
        return responseGenerator(response, 404, "game-not-found");
      }

      if(role !== UserRole.ADMIN && id !== game.tenant.userId.id){
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
    const gameId: any = +request.params.gameId;
    const data = request.body.data || {};

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
        
        const score : number = this.evaluateScore("dataterima", "answer", "difficulty");

        // TODO: update scoreboard
        await tmScoreboardRepository.save({
          user: userId,
          game: gameId,
          score: score,
          playedAt: gameState.startTime
        });

        await tmGameStateRepository.save({
          game: gameId,
          user: userId,
          submitTime: new Date(),
          isSubmit: true
        });

        // TODO: masukkan score ke trasaction from: tenant, to: user
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

  evaluateScore(a: string, b: string, diff: any) : number{
  // if (game.type == GameType.QUIZ) {
  //   Object.keys(data).forEach((key) => {
  //     if (data[key] == game.answer[key]) {
  //       // point++
  //     }
  //   })
  // }
    return 0;
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


    // type == 1

    // problem = {
    //   question: {
    //     1: {
    //       text: 'Apa?',
    //       choice: ['1', '2', '3']
    //     }
    //   }
    // }

    // answer = {
    //   1: '1',
    //   2: '1'
    // }

    // data = {
    //   1: '2',
    //   2: '1'
    // }