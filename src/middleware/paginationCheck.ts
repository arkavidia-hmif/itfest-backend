import { check } from "express-validator";

export const paginationCheck = [
  check("page").isInt({ min: 1 }),
  check("itemPerPage").isInt({ min: 1 }),
];
