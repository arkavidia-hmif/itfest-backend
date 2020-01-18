import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config";
import { responseGenerator } from "../utils/responseGenerator";

export function checkJWT(request: Request, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return responseGenerator(response, 401, "no-bearer");
  }

  const token = authHeader.substr(7);

  try {
    const payload = jwt.verify(token, config.secret);
    response.locals.auth = payload;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return responseGenerator(response, 401, "invalid-jwt");
    }
  }

  return responseGenerator(response, 401, "invalid-auth");
}
