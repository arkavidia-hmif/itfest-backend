import { Router } from "express";
import { check } from "express-validator";

import { GameController } from "../controller/GameController";
import { InventoryController } from "../controller/InventoryController";
import { UserController } from "../controller/UserController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";
import { paginationCheck } from "../middleware/paginationCheck";

export default () => {
  const router = Router();

  const gc = new GameController();
  const uc = new UserController();
  const ic = new InventoryController();

  router.use(checkJWT);

  // giveFeedback not yet been implemented 

  router.post("/tenant/:id([0-9]+)/review", [
    limitAccess([UserRole.VISITOR]),
    check("score").isInt({ min: 0, max: 5 }).withMessage("must be an integer from 0 to 5"),
    check("praise").isArray().withMessage("must be an array"),
    check("comment").isString().withMessage("must be a string"),
    checkParam,
  ], gc.giveFeedback.bind(gc));

  router.get("/tenant/live", [
  ], uc.getLiveTenant.bind(uc));

  router.get("/tenant/:username([a-zA-Z0-9]+)/item", [
    ...paginationCheck,
    checkParam,
  ], ic.getItemByUsername.bind(ic));


  return router;
};
