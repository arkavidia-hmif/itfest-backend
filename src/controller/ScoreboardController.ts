import { Request, response, Response } from "express";
import { getConnection, getRepository } from "typeorm";
import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Scoreboard } from "../entity/Scoreboard";
import { responseGenerator } from "../utils/responseGenerator";
import { TransactionController } from "./TransactionController";
import { readFileSync } from "fs";
import { join } from "path";
import { Result } from "express-validator";


export class ScoreboardController {
    private scoreboardRepository = getRepository(Scoreboard);

    async getScoreboard(req : Request, res : Response){
        const gameId: any = +req.params.gameId;
        const scoreboard = await this.scoreboardRepository.find({
                            where: {
                                gameId:  gameId,
                            }
                        })

        return responseGenerator(res, 200, "ok", scoreboard);
    }

    async submitScore(req : Request, res : Response){
        const authData = res.locals.auth;
        var scoreRecord = await this.scoreboardRepository.findOne({
                                where: {
                                    gameId: req.params.gameId, 
                                    userId : authData.id
                                }
                            });
                            
        // found condition 
        if(scoreRecord !== null){
            responseGenerator(res, 400, "Bad Request");
        }

        var scoreRecord = await this.scoreboardRepository.save({
                                userId: authData.id,
                                gameId: +req.params.gameId, 
                                score: 0, // EDIT THE SCORE
                                playedAt: Date.now()
                            } as unknown as Scoreboard);

        // scoreRecord = await this.scoreboardRepository.findOne({
        //                     where: {
        //                         userId: authData.id
        //                     } 
        //                 });
        
        // scoreRecord.score += 0; // EDIT THE SCORE
        // await this.scoreboardRepository.save(scoreRecord);

        responseGenerator(res, 201, "Created");
    }

}