import { Router } from "express";

import { TenantController } from "../controller/TenantController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { limitAccess } from "../middleware/limitAccess";

export default () => {
  const router = Router();

  const tc = new TenantController();

  router.use(checkJWT);
  router.get("/game", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.listGame.bind(tc));
  router.post("/game", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.registerGame.bind(tc));
  router.get("/game/:id([0-9]+)", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.getGame.bind(tc));
  router.put("/game/:id([0-9]+)", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.updateGame.bind(tc));
  router.delete("/game/:id([0-9]+)", [limitAccess([UserRole.ADMIN, UserRole.TENANT])], tc.deleteGame.bind(tc));

  return router;
};
