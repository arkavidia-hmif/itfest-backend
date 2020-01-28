import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { responseGenerator } from "../utils/responseGenerator";

export function checkParam(request: Request, response: Response, next: NextFunction) {
  const errors = validationResult(request);
  if (errors.isEmpty()) {
    return next();
  } else {
    const errorArray = errors.array();
    const errorResult = [];

    for (const data of errorArray) {
      if (data.param === "_error") {
        const nestedErrors = (data as any).nestedErrors;
        nestedErrors.forEach((error) => {
          errorResult.push({
            part: error.param,
            message: error.msg,
          });
        });
      } else {
        errorResult.push({
          part: data.param,
          message: data.msg,
        });
      }
    }

    return responseGenerator(response, 400, "invalid-input", errorResult);
  }
}
