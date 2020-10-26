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
    const gameId = request.params.id;

    const game = await this.gameRepository.findOne(gameId);

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    delete game.tenant;
    delete game.answer;

    return responseGenerator(response, 200, "ok", game);
  }


  async playGame(request: Request, response: Response){
    const userId = response.locals.auth.id;
    const gameId = request.params.gameId;
    const difficulty = request.body.difficulty;

    const user = await this.userRepository.findOne(userId);

    if (!user || user.role !== UserRole.VISITOR) {
      return responseGenerator(response, 404, "user-not-found");
    }

    try {



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
}