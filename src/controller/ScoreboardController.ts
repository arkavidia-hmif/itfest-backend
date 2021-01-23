import { Request, response, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Scoreboard } from "../entity/Scoreboard";
import { responseGenerator } from "../utils/responseGenerator";

export class ScoreboardController {
    private scoreboardRepository = getRepository(Scoreboard);

    async getScoreboard(req: Request, res: Response) {
        try {
            const gameId: number = +req.params.id;
            const limit: number = +req.query.limit || 1000; //dafault
            const offset: number = +req.query.offset || 0;// default

            const scoreboard = await this.scoreboardRepository
                .createQueryBuilder("scoreboard")
                .where("scoreboard.gameId = :gameId", { gameId: gameId })
                .orderBy("scoreboard.score", "DESC")
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