import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Item } from "../entity/Item";
import { Tenant, User, UserRole } from "../entity/User";
import { Game } from "../entity/Game";
import { responseGenerator } from "../utils/responseGenerator";

export class TenantController {

  private tenantRepository = getRepository(Tenant);
  private gameRepository = getRepository(Game);

  async listGame(request: Request, response: Response) {
    const { id, role } = response.locals.auth;

    let whereParam = {};
    if (role === UserRole.TENANT) {
      const tenant = await this.tenantRepository.find(id);
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

    const tenantObj = await this.tenantRepository.findOne(id);

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

  async getGame(request: Request, response: Response) {
    const id = request.params.id;

    const game = await this.gameRepository.findOne(id);

    if (!game) {
      return responseGenerator(response, 404, "game-not-found");
    }

    return responseGenerator(response, 200, "ok", game);
  }

  async updateGame(request: Request, response: Response) {
    const id = request.params.id;
    const { name, difficulty } = request.body;

    try {
      await this.gameRepository.update(id, {
        name,
        difficulty,
      });
    } catch (error) {
      console.error(error);
    }

    return responseGenerator(response, 200, "ok");
  }
}