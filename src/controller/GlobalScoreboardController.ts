import { Request, response, Response } from "express";
import { getRepository } from "typeorm";
import { GlobalScoreboard } from "../entity/GlobalScoreboard";
import { responseGenerator } from "../utils/responseGenerator";


export class GlobalScoreboardController {
    private scoreboardRepository = getRepository(GlobalScoreboard);

    getScoreboard = async (req: Request, res: Response) => {
      try {
        const limit = (+req.query.limit && +req.query.limit < 20 && +req.query.limit) || 20;
        const offset: number = +req.query.offset || 0; //default

        const scoreboard = await this.scoreboardRepository
          .createQueryBuilder("global_scoreboard")
          .orderBy("global_scoreboard.score", "DESC")
          .leftJoinAndSelect("global_scoreboard.user", "user")
          .select(
            [
              "global_scoreboard.id",
              "global_scoreboard.score",
              "user.name",
            ])
          .offset(offset)
          .take(limit)
          .getMany();

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