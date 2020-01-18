import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Item } from "../entity/Item";
import { Tenant, User } from "../entity/User";
import { Game } from "../entity/Game";
import { responseGenerator } from "../utils/responseGenerator";

export class TenantController {

  private userRepository = getRepository(User);
  private tenantRepository = getRepository(Tenant);
  private gameRepository = getRepository(Game);

  async listGame(request: Request, response: Response) {
    const id = response.locals.auth.id;

    const tenant = await this.tenantRepository.find(id);

    try {
      const game = await this.gameRepository.find({ where: { tenant } });

      return responseGenerator(response, 200, "ok", game);
    } catch (error) {
      console.error(error);
      return responseGenerator(response, 500, "unknown-error");
    }

  }

  async registerGame(request: Request, response: Response) {
    const id = response.locals.auth.id;
    const { name, difficulty } = request.body;

    const tenant = await this.tenantRepository.findOne(id);

    await this.gameRepository.save({
      name,
      tenant,
      difficulty,
    });

    return responseGenerator(response, 200, "ok");
  }

  async deleteGame(request: Request, response: Response) {
    const id = response.locals.auth.id;
    const gameId = request.body.game;

    const game = await this.gameRepository.findOne(gameId);

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    if (game.id !== id) {
      return responseGenerator(response, 403, "forbidden");
    }

    await this.gameRepository.delete(gameId);

    return responseGenerator(response, 200, "ok");
  }

}