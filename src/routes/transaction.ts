import { Router } from "express";
import { TransactionController } from "../controller/TransactionController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { limitAccess } from "../middleware/limitAccess";

export default () => {
  const router = Router();

  const tc = new TransactionController();

  router.use(checkJWT);
  router.get("/transaction", limitAccess([UserRole.ADMIN]), tc.getAllTransaction.bind(tc));

  return router;
};
