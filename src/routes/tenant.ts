import { Router } from "express";
import { check } from "express-validator";

import { TenantController } from "../controller/TenantController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";

export default () => {
  const router = Router();

  const tc = new TenantController();

  const nameCheck = check("name")
    .isLength({ min: 5 }).withMessage("must be >= 5 characters")
    .matches(/^[a-z0-9 ]+$/i).withMessage("must be alphanumeric or space");
  const difficultyCheck = check("difficulty")
    .isInt({ min: 1, max: 3 }).withMessage("must be an integer between 1 to 3");

  router.use(checkJWT);
  router.get("/game", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.listGame.bind(tc));
  router.post("/game", [
    limitAccess([UserRole.ADMIN, UserRole.TENANT]),
    nameCheck,
    difficultyCheck,
    checkParam,
  ], tc.registerGame.bind(tc));
  router.get("/game/:id([0-9]+)", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.getGame.bind(tc));
  router.put("/game/:id([0-9]+)", [
    limitAccess([UserRole.ADMIN, UserRole.TENANT]),
    nameCheck.optional(),
    difficultyCheck.optional(),
    checkParam,
  ], tc.updateGame.bind(tc));
  router.delete("/game/:id([0-9]+)", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.deleteGame.bind(tc));

  return router;
};
