import { Request, Response, Router } from "express";
import { check, oneOf } from "express-validator";

import config from "../config";
import { InventoryController } from "../controller/InventoryController";
import { TransactionController } from "../controller/TransactionController";
import { UserController } from "../controller/UserController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";
import { paginationCheck } from "../middleware/paginationCheck";

export default (): Router => {
  const router = Router();

  const uc = new UserController();
  const tc = new TransactionController();
  const ic = new InventoryController();

  const emailCheck = () => check("email").isEmail().withMessage("must be a valid email address");
  const nameCheck = () => check("name").matches(/^[a-zA-Z0-9. ]{1,64}$/i).withMessage("must only contain letter, number, or space");
  const genderCheck = () => check("gender")
    .isInt({ min: 1, max: 2 })
    .withMessage("must be a valid gender (1=male, 2=female)");
  const interestCheck = () => check("interest").isArray().withMessage("must be an array");
  const dobCheck = () => check("dob").isISO8601().withMessage("must be a valid ISO8601 date");
  const telpCheck = () => check("telp").isString().isLength({ min: 10, max: 20 }).withMessage("must be >=10 and <=20 characters long");
  const instituteCheck = () => check("institute").isString().withMessage("must be a string");
  const passwordCheck = () => check("password")
    .matches(config.password.checkRegex, "i")
    .withMessage(config.password.checkMessage)
    .isLength({ min: config.password.minLength }).withMessage(`must be at least ${config.password.minLength} characters long`);
  const voucherCheck = () => {
    const chain = check("voucher")
      .isAlphanumeric().withMessage("must be alphanumeric")
      .isLength({ min: 6, max: 6 }).withMessage("must be 6 characters long");
    if (!config.useVoucher) {
      return chain.optional();
    } else {
      return chain;
    }
  };
  const usernameCheck = () => check("username")
    .matches(/^[a-zA-Z0-9_\-.+]+$/i).withMessage("must be alphanumeric or _-+.")
    .isLength({ min: 1 }).withMessage("must be >= 1 character long");
  const pointCheck = () => check("point").isInt({ min: 0 }).withMessage("must be a positive integer");
  const tokenCheck = () => check("token").isAlphanumeric().isLength({ min: 6, max: 6 }).withMessage("muse be 6 alpanumeric character");
  const liveUrlCheck = () => check("liveUrl").isURL().withMessage("must be valid url");

  // Public user endpoint
  router.post("/login", [
    oneOf([
      emailCheck(),
      usernameCheck(),
    ]),
    check("password")
      .not().isEmpty().withMessage("must be provided"),
    checkParam,
  ], uc.login.bind(uc));

  router.post("/register/visitor", [
    emailCheck(),
    passwordCheck(),
    telpCheck(),
    nameCheck(),
    usernameCheck().optional(),
    genderCheck().optional(),
    interestCheck().optional(),
    dobCheck().optional(),
    instituteCheck().optional(),
    voucherCheck(),
    checkParam,
  ], uc.registerVisitor.bind(uc));

  router.post("/register/tenant", [
    checkJWT,
    limitAccess([UserRole.ADMIN]),
    usernameCheck(),
    passwordCheck(),
    emailCheck().optional(),
    nameCheck().optional(),
    pointCheck().optional(),
    liveUrlCheck().optional(),
    checkParam,
  ], uc.registerTenant.bind(uc));

  router.get("/visitor/count", [
  ], uc.countVisitor.bind(uc));

  // User endpoint
  router.use("/user", checkJWT);

  router.get("/user", [
    limitAccess([UserRole.ADMIN]),
    ...paginationCheck,
    checkParam,
  ], uc.listUser.bind(uc));
  router.get("/user/:type(tenant|visitor)", [
    limitAccess([UserRole.ADMIN]),
    ...paginationCheck,
    checkParam,
  ], uc.listUser.bind(uc));
  router.get("/user/item", [
    limitAccess([UserRole.ADMIN]),
    ...paginationCheck,
    checkParam,
  ], ic.listTenantWithItem.bind(ic));

  router.get("/user/me", uc.getMe.bind(uc));
  router.put("/user/me", [
    emailCheck().optional(),
    nameCheck().optional(),
    usernameCheck().optional(),
    dobCheck().optional(),
    genderCheck().optional(),
    interestCheck().optional(),
    checkParam,
  ], uc.editUserMe.bind(uc));
  router.get("/user/me/transaction", uc.getMeTransaction.bind(uc));
  router.get("/user/me/qrid", uc.getQrMe.bind(uc));

  router.use("/user/:id([0-9]+)", limitAccess([UserRole.ADMIN]));
  router.get("/user/:id([0-9]+)", uc.getUser.bind(uc));
  router.put("/user/:id([0-9]+)", [
    emailCheck().optional(),
    nameCheck().optional(),
    usernameCheck().optional(),
    dobCheck().optional(),
    genderCheck().optional(),
    interestCheck().optional(),
    telpCheck().optional(),
    instituteCheck().optional(),
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

  router.get("/visitor/rankpoint", [
    checkJWT,
    limitAccess([UserRole.VISITOR]),
  ], uc.getRankAndPoint.bind(uc));

  // Verification and resetpass
  router.post("/resetpass", [
    checkParam,
  ], uc.resetPassword.bind(uc));
  router.post("/validation", [
    emailCheck(),
    tokenCheck(),
    passwordCheck().optional(),
    checkParam,
  ], uc.verifyToken.bind(uc));


  // router.get("/user/:qrid([a-z0-9]+)", uc.getQrData.bind(uc));

  // router.post("/user/:qrid([a-z0-9]+)/give", [
  //   check("amount").isInt({ min: 0 }),
  //   checkParam,
  // ], tc.giveQr.bind(tc));

  // checkPlayStatus not yet been implemented

  // router.post("/user/:qrid([a-z0-9]+)/play", [
  //   limitAccess([UserRole.TENANT]),
  //   check("difficulty").isArray({ min: 1 }).withMessage("must be an array with >=1 length"),
  //   check("difficulty.*").isInt({ min: 1, max: 3 }).withMessage("must be integer between 1 and 3"),
  //   checkParam,
  // ], gc.playGame.bind(gc));
  // router.get("/user/:qrid([a-z0-9]+)/play/status", [
  //   limitAccess([UserRole.TENANT]),
  // ], gc.checkPlayStatus.bind(gc));

  // router.post("/user/:qrid([a-z0-9]+)/redeem", [
  //   limitAccess([UserRole.ADMIN]),
  //   itemCheck(),
  //   amountCheck(),
  //   checkParam,
  // ], ic.redeem.bind(ic));

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
