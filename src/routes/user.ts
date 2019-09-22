import { Router } from "express";
import { UserController } from "../controller/UserController";
import { checkJWT } from "../middleware/auth";
import { limitAccess } from "../middleware/role";
import { UserRole } from "../entity/User";

export default () => {
  const router = Router();

  const uc = new UserController();

  router.post("/login", uc.login.bind(uc));
  router.get("/test-jwt", [checkJWT], (req, res) => {
    res.json({
      status: 200,
      code: "jwt-valid",
    });
  });
  router.get("/test-role", [checkJWT, limitAccess([UserRole.ADMIN])], (req, res) => {
    res.json({
      status: 200,
      code: "access-allowed",
    });
  });


  return router;
};
