import { Router } from "express";
import { TransactionController } from "../controller/TransactionController";
import { UserController } from "../controller/UserController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { limitAccess } from "../middleware/limitAccess";

export default () => {
  const router = Router();

  const uc = new UserController();
  const tc = new TransactionController();

  router.post("/login", uc.login.bind(uc));

  router.use("/user", checkJWT);
  router.get("/user/me", uc.getMe.bind(uc));
  router.get("/user/me/transaction", uc.getMeTransaction.bind(uc));
  router.get("/user/:id", limitAccess([UserRole.ADMIN]), uc.getUser.bind(uc));
  router.get("/user/:id/transaction", limitAccess([UserRole.ADMIN]), uc.getTransaction.bind(uc));

  router.post("/user/:id/give", tc.give.bind(tc));

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
