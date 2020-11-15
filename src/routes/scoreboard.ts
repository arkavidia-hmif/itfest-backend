import { Router } from "express";

import { ScoreboardController } from "../controller/ScoreboardController";
import { GlobalScoreboardController } from "../controller/GlobalScoreboardController";


export default() => {
    const router = Router();
    const sc = new ScoreboardController();
    const gsc = new GlobalScoreboardController();


}