import { Router } from "express";

import { ScoreboardController } from "../controller/ScoreboardController";
import { GlobalScoreboardController } from "../controller/GlobalScoreboardController";

export default () => {
  const router = Router();
  const sc = new ScoreboardController();
  const gsc = new GlobalScoreboardController();

  router.get("/scoreboard/:id([0-9]+)", [

  ], sc.getScoreboard.bind(sc));

  router.get("/scoreboard/global", [

  ], gsc.getScoreboard.bind(gsc));

  return router;
};