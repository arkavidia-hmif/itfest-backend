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

  const nameCheck = () => check("name").isAscii().withMessage("must not contain special character");
  const priceCheck = () => check("price").isInt({ min: 0 }).withMessage("must be >=0");
  const ownerCheck = () => check("owner").isInt({ min: 0 }).withMessage("must be valid id");
  const qtyCheck = () => check("qty").isInt({ min: 0 }).withMessage("must be >= 0");

  router.use(checkJWT);
  router.get("/item", [...paginationCheck, checkParam], ic.listItem.bind(ic));
  router.post("/item", [
    limitAccess([UserRole.ADMIN, UserRole.TENANT]),
    nameCheck(),
    priceCheck(),
    ownerCheck().optional(),
    qtyCheck(),
    checkParam,
  ], ic.createItem.bind(ic));

  router.get("/item/:id([0-9]+)", ic.getItem.bind(ic));
  router.delete("/item/:id([0-9]+)", [
    limitAccess([UserRole.ADMIN, UserRole.TENANT]),
  ], ic.deleteItem.bind(ic));
  router.put("/item/:id([0-9]+)", [
    limitAccess([UserRole.ADMIN, UserRole.TENANT]),
    nameCheck().optional(),
    priceCheck().optional(),
    qtyCheck().optional(),
    checkParam,
  ], ic.editItem.bind(ic));

  return router;
};
