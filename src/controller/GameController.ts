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
}