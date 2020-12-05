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
            var limit: number = 1000; //dafault
            var offset: number = 0;// default

            if(req.query.limit !== undefined){
                limit = +req.query.limit;
            }
            if(req.query.offset !== undefined){
                offset = +req.query.offset;
            }

            const scoreboard = await this.scoreboardRepository
                    .createQueryBuilder("global_scoreboard")
                    .orderBy("global_scoreboard.score", "DESC")
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