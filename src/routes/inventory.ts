import { Router } from "express";
import { check } from "express-validator";

import { InventoryController } from "../controller/InventoryController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";
import { paginationCheck } from "../middleware/paginationCheck";

export default () => {
  const router = Router();

  const ic = new InventoryController();

  const nameCheck = check("name").isAscii().withMessage("must not contain special character");
  const priceCheck = check("price").isInt({ min: 0 }).withMessage("must be >=0");
  const ownerCheck = check("owner").isInt({ min: 0 }).withMessage("must be valid id");
  const qtyCheck = check("qty").isInt({ min: 0 }).withMessage("must be >= 0");

  router.use(checkJWT);
  router.get("/item", [...paginationCheck, checkParam], ic.listItem.bind(ic));
  router.post("/item", [
    limitAccess([UserRole.ADMIN]),
    nameCheck,
    priceCheck,
    ownerCheck.optional(),
    qtyCheck,
    checkParam,
  ], ic.createItem.bind(ic));

  router.get("/item/:id([0-9]+)", ic.getItem.bind(ic));

  return router;
};
