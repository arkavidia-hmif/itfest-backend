import { Router } from "express";
import { UserController } from "../controller/UserController";
import { checkJWT } from "../middleware/auth";

export default () => {
  const router = Router();

  const uc = new UserController();

  router.post("/login", uc.login.bind(uc));
  router.get("/test-jwt", [checkJWT], (req, res) => {
    res.json({
      status: 200,
      code: "JWT valid",
    });
  });

  return router;
};
