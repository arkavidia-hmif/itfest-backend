import { Request, Response, Router } from "express";
import { check, oneOf } from "express-validator";

import config from "../config";
import { GameController } from "../controller/GameController";
import { InventoryController } from "../controller/InventoryController";
import { TransactionController } from "../controller/TransactionController";
import { UserController } from "../controller/UserController";
import { ScoreboardController } from "../controller/ScoreboardController";
import { UserRole } from "../entity/User";
import { checkJWT } from "../middleware/checkJWT";
import { checkParam } from "../middleware/checkParam";
import { limitAccess } from "../middleware/limitAccess";
import { paginationCheck } from "../middleware/paginationCheck";

export default () => {
    const router = Router();

    const uc = new UserController();
    const tc = new TransactionController();
    const gc = new GameController();
    const ic = new InventoryController();
    const sc = new ScoreboardController();

    router.get("/game/:id([0-9]+)", [
        limitAccess([UserRole.VISITOR, UserRole.ADMIN, UserRole.VISITOR])
    ], gc.getGame.bind(gc));

    router.post('/game/:id([0-9]+)/play', [
        limitAccess([UserRole.VISITOR, UserRole.ADMIN])
    ], gc.playGame.bind(gc));

    router.post('/game/:id([0-9]+)/submit', [
        limitAccess([UserRole.VISITOR, UserRole.ADMIN])
    ], gc.submitGame.bind(gc));

    router.post('/game/register', [
        limitAccess([UserRole.TENANT, UserRole.ADMIN])
    ]);

    // router.put("/game/:id([0-9]+)", [
    //     limitAccess([UserRole.ADMIN, UserRole.TENANT]),
    //     nameCheck().optional(),
    //     difficultyCheck().optional(),
    //     checkParam,
    // ], gc.updateGame.bind(gc));

    // router.delete("/game/:id([0-9]+)", [
    //     limitAccess([UserRole.ADMIN, UserRole.TENANT])
    // ], gc.deleteGame.bind(gc));

    return router;
}