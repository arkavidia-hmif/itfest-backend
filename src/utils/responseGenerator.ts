import { Response } from "express";

export function responseGenerator(response: Response, status: number, code: string, data?: object) {
  return response.status(status).json({
    status,
    code,
    data,
  });
}
