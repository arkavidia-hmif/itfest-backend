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
        const scoreboard = await this.scoreboardRepository.find();

        responseGenerator(res, 200, "ok", scoreboard);
    }
}   