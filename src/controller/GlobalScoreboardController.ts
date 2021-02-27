import { Request, response, Response } from "express";
import { getRepository } from "typeorm";
import { GlobalScoreboard } from "../entity/GlobalScoreboard";
import { User, UserRole, Visitor } from "../entity/User";
import { responseGenerator } from "../utils/responseGenerator";


export class GlobalScoreboardController {
  private visitorRepository = getRepository(Visitor);
  private scoreboardRepository = getRepository(GlobalScoreboard);

  async getScoreboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = (+req.query.limit && +req.query.limit < 20 && +req.query.limit) || 20;
      const offset: number = +req.query.offset || 0; //default

      const scoreboard = await this.visitorRepository.createQueryBuilder("visitor")
        .leftJoin("visitor.userId", "user")
        .select(["point", "user.name"])
        .orderBy("point", "DESC")
        .skip(offset)
        .limit(limit)
        .getRawMany();

      return responseGenerator(res, 200, "ok", scoreboard);
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else {
        console.error(error);
        return responseGenerator(response, 500, "unknown-error");
      }
    }
  }
}   