import { Request, response, Response } from "express";
import { getConnection, getRepository } from "typeorm";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { GlobalScoreboard } from "../entity/GlobalScoreboard";
import { responseGenerator } from "../utils/responseGenerator";
import { readFileSync } from "fs";
import { join } from "path";

export class GlobalScoreboardController {
    private scoreboardRepository = getRepository(GlobalScoreboard);

    getScoreboard = async (req : Request, res : Response) => {
        try {
            var scoreboard;
            if(req.query.limit !== undefined){
                scoreboard = await this.scoreboardRepository
                        .createQueryBuilder("global_scoreboard")
                        .orderBy("global_scoreboard.score", "DESC");
            } else {
                scoreboard = await this.scoreboardRepository
                        .createQueryBuilder("global_scoreboard")
                        .orderBy("global_scoreboard.score", "DESC")
                        .take(+(req.query.limit));
            }
            
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