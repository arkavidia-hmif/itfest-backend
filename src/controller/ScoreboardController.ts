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
            const gameId: any = +req.params.id;
            let limit: number = 1000; //dafault
            let offset: number = 0;// default

            console.log(req.query)
            if (req.query.limit !== undefined && (req.query.limit instanceof Number)) {
                limit = +req.query.limit;
            }
            if (req.query.offset !== undefined && (req.query.offset instanceof Number)) {
                offset = +req.query.offset;
            }

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