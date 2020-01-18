import { Request, Response, Router } from "express";
import { check, oneOf } from "express-validator";

import { TransactionController } from "../controller/TransactionController";
import { UserController } from "../controller/UserController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";
import { paginationCheck } from "../middleware/paginationCheck";
import { globalSocket } from "./socket";

export default () => {
  const router = Router();

  const uc = new UserController();
  const tc = new TransactionController();

  const emailCheck = check("email").isEmail().withMessage("must be a valid email address");
  const nameCheck = check("name").isAlpha().withMessage("must only contain letter");
  const genderCheck = check("gender")
    .isInt({ min: 1, max: 2 })
    .withMessage("must be a valid gender (1=male, 2=female)");
  const interestCheck = check("interest").isArray().withMessage("must be an array");
  const dobCheck = check("dob").isISO8601().withMessage("must be a valid ISO8601 date");

  // Public user endpoint
  router.post("/login", [
    oneOf([
      emailCheck,
      check("username")
        .isAlphanumeric().withMessage("must be an alphanumeric sequence"),
    ]),
    check("password")
      .not().isEmpty().withMessage("must be provided"),
    checkParam,
  ], uc.login.bind(uc));

  router.post("/activate", [
    emailCheck,
    check("password")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{0,}$/, "i")
      .withMessage("must include one lowercase character, one uppercase character, a number, and a special character")
      .isLength({ min: 8 }).withMessage("must be at least 8 characters long"),
    check("voucher")
      .isAlphanumeric().withMessage("must be alphanumeric")
      .isLength({ min: 6, max: 6 }).withMessage("must be 6 characters long"),
    nameCheck.optional(),
    genderCheck.optional(),
    interestCheck.optional(),
    dobCheck.optional(),
    checkParam,
  ], uc.registerVisitor.bind(uc));

  // User endpoint
  router.use("/user", checkJWT);
  router.get("/user/me", uc.getMe.bind(uc));
  router.put("/user/me", [
    emailCheck.optional(),
    nameCheck.optional(),
    dobCheck.optional(),
    genderCheck.optional(),
    interestCheck.optional(),
    checkParam,
  ], uc.editUserMe.bind(uc));
  router.get("/user/me/transaction", uc.getMeTransaction.bind(uc));

  router.use("/user/:id([0-9]+)", limitAccess([UserRole.ADMIN]));
  router.get("/user/:id([0-9]+)", uc.getUser.bind(uc));
  router.put("/user/:id([0-9]+)", [
    emailCheck.optional(),
    nameCheck.optional(),
    dobCheck.optional(),
    genderCheck.optional(),
    interestCheck.optional(),
    checkParam,
  ], uc.editUser.bind(uc));
  router.get("/user/:id([0-9]+)/transaction", [
    ...paginationCheck,
    checkParam,
  ], uc.getTransaction.bind(uc));

  router.post("/user/:id([0-9]+)/give", [
    check("amount").isInt({ min: 0 }),
    checkParam,
  ], tc.give.bind(tc));

  // Testing route
  router.get("/test-jwt", [checkJWT], (req: Request, res: Response) => {
    res.json({
      status: 200,
      code: "jwt-valid",
    });
  });
  router.get("/test-role", [checkJWT, limitAccess([UserRole.ADMIN])], (req: Request, res: Response) => {
    res.json({
      status: 200,
      code: "access-allowed",
    });
  });

  return router;
};
