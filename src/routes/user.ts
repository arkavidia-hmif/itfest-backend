import { Router } from "express";
import { TransactionController } from "../controller/TransactionController";
import { UserController } from "../controller/UserController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { limitAccess } from "../middleware/limitAccess";
import { check, oneOf, param } from "express-validator";
import { paramCheck } from "../middleware/paramCheck";
import { paginationCheck } from "../middleware/paginationCheck";

export default () => {
  const router = Router();

  const uc = new UserController();
  const tc = new TransactionController();

  const emailCheck = check("email").isEmail().withMessage("must be a valid email address");

  // Public user endpoint
  router.post("/login", [
    oneOf([
      emailCheck,
      check("username")
        .isAlphanumeric().withMessage("must be an alphanumeric sequence")
    ]),
    check("password")
      .not().isEmpty().withMessage("must be provided"),
    paramCheck
  ], uc.login.bind(uc));

  router.post("/activate", [
    emailCheck,
    check("password")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{0,}$/, "i")
      .withMessage("must include one lowercase character, one uppercase character, a number, and a special character")
      .isLength({ "min": 8 }).withMessage("must be at least 8 characters long"),
    check("voucher")
      .isAlphanumeric().withMessage("must be alphanumeric")
      .isLength({ "min": 6, "max": 6 }).withMessage("must be 6 characters long"),
    check("name")
      .optional()
      .isAlpha().withMessage("must only contain letter"),
    check("gender")
      .optional()
      .isInt({ "min": 1, "max": 2 }).withMessage("must be a valid gender (1=male, 2=female)"),
    check("interest")
      .optional()
      .isArray().withMessage("must be an array"),
    check("dob")
      .optional()
      .isISO8601().withMessage("must be a valid ISO8601 date"),
    paramCheck
  ], uc.registerVisitor.bind(uc));

  // User endpoint
  router.use("/user", checkJWT);
  router.get("/user/me", uc.getMe.bind(uc));
  router.put("/user/me", uc.editUser.bind(uc));
  router.get("/user/me/transaction", uc.getMeTransaction.bind(uc));

  router.use("/user/:id([0-9]+)", limitAccess([UserRole.ADMIN]));
  router.get("/user/:id([0-9]+)", uc.getUser.bind(uc));
  router.put("/user/:id([0-9]+)", uc.editUser.bind(uc));
  router.get("/user/:id([0-9]+)/transaction", [
    ...paginationCheck,
    paramCheck
  ], uc.getTransaction.bind(uc));

  router.post("/user/:id([0-9]+)/give", [
    check("amount").isInt({ min: 0 }),
    paramCheck
  ], tc.give.bind(tc));




  // Testing route
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
