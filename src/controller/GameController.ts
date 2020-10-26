import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Feedback } from "../entity/Feedback";
import { Game } from "../entity/Game";
import { GameState } from "../entity/GameState";
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
  private gameStateRepository = getRepository(GameState);

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
}