import { NextFunction, Request, Response } from "express";
import { UserRole } from "../entity/User";
import { responseGenerator } from "../utils/responseGenerator";

export function limitAccess(allowedRole: UserRole[]) {

  return (request: Request, response: Response, next: NextFunction) => {
    const auth = response.locals.auth;

    if (allowedRole.includes(auth.role)) {
      return next();
    } else {
      return responseGenerator(response, 403, "forbidden");
    }
  };
}
