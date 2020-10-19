import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Request, response, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as Mustache from "mustache";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { GameScoreboard } from "../entity/GameScoreboard";
import { Voucher } from "../entity/Voucher";
import { transporter } from "../utils/mail";
import { partialUpdate } from "../utils/partialUpdateEntity";
import { decodeQr, generateQr } from "../utils/qr";
import { responseGenerator } from "../utils/responseGenerator";
import { TransactionController } from "./TransactionController";
import { readFileSync } from "fs";
import { join } from "path";

export class GameScoreboardController {
    private gameScoreboardRepository = getRepository(GameScoreboard);
    private tc = new TransactionController();

    async getGameScoreboard(req : Request, res : Response){
        const scoreboard = await this.gameScoreboardRepository
                            .createQueryBuilder("gameScoreboard")
                            .where("gameScoreboard.gameId = :id ", { id: req.params.gameId })
                            .getMany();

        return responseGenerator(res, 200, "", scoreboard);
    }

    async submitScore(req : Request, res : Response){
        const scoreRecord = await this.gameScoreboardRepository
                                .createQueryBuilder("gameScoreboard")
                                .where(
                                        "gameScoreboard.gameId = :gameId ", 
                                        { gameId: req.params.gameId, playerId : req.params.playerId }
                                )
                                .getMany();
    }

}