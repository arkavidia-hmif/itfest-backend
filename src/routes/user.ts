import { Router } from "express";
import { UserController } from "../controller/UserController";

export default function () {
  const router = Router();

  const uc = new UserController();

  router.post("/login", uc.login.bind(uc));

  return router;
}