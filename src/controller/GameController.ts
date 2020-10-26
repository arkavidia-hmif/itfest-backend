import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Feedback } from "../entity/Feedback";
import { Game } from "../entity/Game";
import { GameState } from "../entity/GameState";
import { Scoreboard } from "../entity/Scoreboard";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { responseGenerator } from "../utils/responseGenerator";

import { partialUpdate } from "../utils/partialUpdateEntity";
import { globalSocket } from "../routes/socket";
import { Transaction, TransactionType } from "../entity/Transaction";

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
    
    if (gameState?.isSubmit) {
      return responseGenerator(response, 400, "user-already-play");
    }

    delete game.tenant;
    delete game.answer;
  }

  async playGame(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    // const userId = request.body.userId;
    const gameId = request.body.gameId;

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

  async addGame(request: Request, response: Response){

  }

  async deleteGame(request: Request, response: Response){

  }

  async submitGame(request: Request, response: Response) {
    const userId = response.locals.auth.id;
    const gameId = request.params.gameId;
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

    if (gameState?.isSubmit) {
      return responseGenerator(response, 400, "user-already-submitted");
    }

    try {
      const score : number = this.evaluateScore("dataterima", "answer");

      await this.scoreboardRepository.save({
        game: gameId,
        user: userId,
        submitTime: new Date()
      } as unknown as Scoreboard);

      await this.scoreboardRepository.save({
        user: userId,
        game: gameId,
        score: score,
        playedAt: gameState.startTime
      } as unknown as Scoreboard);
      // if (game.type == GameType.QUIZ) {
      //   Object.keys(data).forEach((key) => {
      //     if (data[key] == game.answer[key]) {
      //       // point++
      //     }
      //   })
      // }

      // TODO: masukkan score ke trasaction from: tenant, to: user

      // TODO: update scoreboard

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

  evaluateScore(a: string, b: string) : number{
    return 0;
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