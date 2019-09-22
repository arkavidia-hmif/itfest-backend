import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config";

export function checkJWT(request: Request, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;
  if (!authHeader.startsWith("Bearer")) {
    return response.status(400).json({
      status: 400,
      code: "no-bearer",
    });
  }

  const token = authHeader.substr(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    response.locals.auth = payload;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(401).json({
        status: 401,
        code: "invalid-jwt",
      });
    }
  }

  return response.status(401).json({
    status: 401,
    code: "invalid-auth",
  });
}
