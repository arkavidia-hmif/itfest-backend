import { NextFunction, Request, Response } from "express";
import { UserRole } from "../entity/User";

export function limitAccess(allowedRole: UserRole[]) {

  return (request: Request, response: Response, next: NextFunction) => {
    const auth = response.locals.auth;

    if (allowedRole.includes(auth.role)) {
      return next();
    } else {
      return response.status(403).json({
        status: 403,
        code: "forbidden",
      });
    }
  };
}
