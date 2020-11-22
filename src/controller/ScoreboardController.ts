import { Request, response, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Scoreboard } from "../entity/Scoreboard";
import { responseGenerator } from "../utils/responseGenerator";

export class ScoreboardController {
    private scoreboardRepository = getRepository(Scoreboard);

    async getScoreboard(req : Request, res : Response){
        const gameId: any = +req.params.id;
        try {
            var scoreboard;
            if(req.query.limit === undefined){
                scoreboard = await this.scoreboardRepository
                        .createQueryBuilder("global_scoreboard")
                        .where("scoreboard.gameId = :gameId", { gameId: gameId })
                        .orderBy("global_scoreboard.score", "DESC")
                        .getMany();
            } else {
                scoreboard = await this.scoreboardRepository
                        .createQueryBuilder("global_scoreboard")
                        .where("scoreboard.gameId = :gameId", { gameId: gameId })
                        .orderBy("global_scoreboard.score", "DESC")
                        .take(+req.query.limit)
                        .getMany();
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

    // async submitScore(req : Request, res : Response){
    //     const authData = res.locals.auth;
    //     var scoreRecord = await this.scoreboardRepository.findOne({
    //                             where: {
    //                                 gameId: req.params.gameId, 
    //                                 userId : authData.id
    //                             }
    //                         });
                            
    //     // found condition 
    //     if(scoreRecord !== null){
    //         responseGenerator(res, 400, "Bad Request");
    //     }

    //     var scoreRecord = await this.scoreboardRepository.save({
    //                             userId: authData.id,
    //                             gameId: +req.params.gameId, 
    //                             score: 0, // EDIT THE SCORE
    //                             playedAt: Date.now()
    //                         } as unknown as Scoreboard);
    //     responseGenerator(res, 201, "Created");
    // }
}