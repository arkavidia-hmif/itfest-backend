import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Request, response, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { GameScoreboard } from "../entity/GameScoreboard";
import { Scoreboard } from "../entity/Scoreboard";
import { partialUpdate } from "../utils/partialUpdateEntity";
import { responseGenerator } from "../utils/responseGenerator";
import { TransactionController } from "./TransactionController";
import { readFileSync } from "fs";
import { join } from "path";
import { Result } from "express-validator";

export class GameScoreboardController {
    private gameScoreboardRepository = getRepository(GameScoreboard);
    private scoreboardRepository = getRepository(Scoreboard);

    async getGameScoreboard(req : Request, res : Response){
        const scoreboard = await this.gameScoreboardRepository.find({
                            where: {
                                gameId:  req.params.gameId,
                            }
                        })

        return responseGenerator(res, 200, "ok", scoreboard);
    }

    async submitScore(req : Request, res : Response){
        const authData = res.locals.auth;
        var gameScoreRecord = await this.gameScoreboardRepository.findOne({
                                where: {
                                    gameId: req.params.gameId, 
                                    userId : authData.id
                                }
                            });
                            
        // found condition 
        if(gameScoreRecord !== null){
            responseGenerator(res, 400, "Bad Request");
        }

        var gameScoreRecord = await this.gameScoreboardRepository.save({
                                userId: authData.id,
                                gameId: +req.params.gameId, 
                                score: 0, // EDIT THE SCORE
                                playedAt: Date.now()
                            } as unknown as GameScoreboard);

        const scoreRecord = await this.scoreboardRepository.findOne({
                            where: {
                                userId: authData.id
                            } 
                        });
        
        scoreRecord.score += 0; // EDIT THE SCORE
        await this.scoreboardRepository.save(scoreRecord);

        responseGenerator(res, 201, "Created");
    }

}