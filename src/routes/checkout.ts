import { Request, Response, Router } from "express";
import { check, oneOf } from "express-validator";

import config from "../config";
import { CheckoutController } from "../controller/CheckoutController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";

export default () => {
  const router = Router();

  const cc = new CheckoutController();

  const lineCheck = () => check("lineContact").isAscii().withMessage("must be valid LINE id");
  const waCheck = () => check("waContact").isString().isLength({ min: 10, max: 20 }).withMessage("must be >=10 and <=20 characters long");
  const addressCheck = () => check("address").isString().withMessage("must be valid address");
  const itemCheck = () => check("items").isArray().withMessage("items must be array");
  const itemContainIdCheck = () => check("items.*.id").isInt().withMessage("must be item id");
  const itemContainQtyCheck = () => check("items.*.qty").isInt({ min: 1 }).withMessage("must be >0");

  router.use(checkJWT);

  router.get("/checkout/:id([0-9]{0,})", [
    limitAccess([UserRole.ADMIN])
  ], cc.getCheckout.bind(cc));

  router.post("/checkout", [
    limitAccess([UserRole.VISITOR]),
    lineCheck(),
    waCheck(),
    addressCheck().optional(),
    itemCheck(),
    itemContainIdCheck(),
    itemContainQtyCheck(),
    checkParam,
  ], cc.createCheckout.bind(cc));

  return router;
};