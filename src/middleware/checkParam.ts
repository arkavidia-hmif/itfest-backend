import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { responseGenerator } from "../utils/responseGenerator";

export function checkParam(request: Request, response: Response, next: NextFunction) {
  const errors = validationResult(request);
  if (errors.isEmpty()) {
    return next();
  } else {
    const errorArray = errors.array();

    const errorResult = errorArray.map((data) => {
      return {
        part: data.param,
        message: data.msg,
      };
    });

    return responseGenerator(response, 400, "invalid-input", errorResult);
  }
}
