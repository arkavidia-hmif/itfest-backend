import { Response } from "express";

export function responseGenerator(response: Response, status: number, code: string, data?: Record<string, unknown>): Response {
  return response.status(status).json({
    status,
    code,
    data,
  });
}
