import { Response } from "express";

export function responseGenerator<T>(response: Response, status: number, code: string, data?: T): Response {
  return response.status(status).json({
    status,
    code,
    data,
  });
}
