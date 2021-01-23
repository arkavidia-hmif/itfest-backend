import { Request, Response, Router } from "express";
import { check, oneOf } from "express-validator";

import config from "../config";
import { CheckoutController } from "../controller/CheckoutController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { limitAccess } from "../middleware/limitAccess";

export default () => {
  const router = Router();

  const cc = new CheckoutController();

  // const nameCheck = () => check("name").isAscii().withMessage("must not contain special character");
  // const tenantCheck = () => check("tenant").isInt({ min: 1 }).withMessage("must be valid id");
  // const problemCheck = () => check("owner").isString().withMessage("must be json stringify");
  // const answerCheck = () => check("answer").isString().withMessage("must be json stringify");
  // const diffCheck = () => check("difficulty").isInt({ min: 1 }).withMessage("must be valid difficulty");

  router.use(checkJWT);

  router.get("/checkout/:id([0-9]{0,})", [
    limitAccess([UserRole.ADMIN])
  ], cc.getCheckout.bind(cc));

  router.post("/checkout", [
    limitAccess([UserRole.VISITOR])
  ], cc.createCheckout.bind(cc));

  return router;
};