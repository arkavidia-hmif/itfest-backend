import { Router } from "express";
import { check } from "express-validator";

import { GameController } from "../controller/GameController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";

export default () => {
  const router = Router();

  const gc = new GameController();

  const nameCheck = () => check("name")
    .isLength({ min: 5 }).withMessage("must be >= 5 characters")
    .matches(/^[a-z0-9 ]+$/i).withMessage("must be alphanumeric or space");
  const difficultyCheck = () => check("difficulty")
    .isInt({ min: 1, max: 3 }).withMessage("must be an integer between 1 to 3");

  router.use(checkJWT);
  // router.get("/game", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], gc.listGame.bind(gc));
  // router.post("/game", [
  //   limitAccess([UserRole.ADMIN, UserRole.TENANT]),
  //   nameCheck(),
  //   difficultyCheck(),
  //   checkParam,
  // ], gc.registerGame.bind(gc));
  // router.get("/game/:id([0-9]+)", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], gc.getGame.bind(gc));
  // router.put("/game/:id([0-9]+)", [
  //   limitAccess([UserRole.ADMIN, UserRole.TENANT]),
  //   nameCheck().optional(),
  //   difficultyCheck().optional(),
  //   checkParam,
  // ], gc.updateGame.bind(gc));
  // router.delete("/game/:id([0-9]+)", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], gc.deleteGame.bind(gc));



  // giveFeedback not yet been implemented 

  // router.post("/tenant/:id([0-9]+)/review", [
  //   limitAccess([UserRole.VISITOR]),
  //   check("score").isInt({ min: 0, max: 5 }).withMessage("must be an integer from 0 to 5"),
  //   check("praise").isArray().withMessage("must be an array"),
  //   check("comment").isString().withMessage("must be a string"),
  //   checkParam,
  // ], gc.giveFeedback.bind(gc));

  // router.get("/tenant/:id([0-9]+)/review", [
  //   limitAccess([UserRole.ADMIN, UserRole.TENANT]),
  // ], gc.getFeedback.bind(gc));

  return router;
};
