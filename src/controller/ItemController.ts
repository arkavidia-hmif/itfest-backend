import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Item } from "../entity/Item";

export class ItemController {

  private itemRepository = getRepository(Item);

  async all(request: Request, response: Response, next: NextFunction) {
    return this.itemRepository.find();
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return this.itemRepository.findOne(request.params.id);
  }

  async save(request: Request, response: Response, next: NextFunction) {
    return this.itemRepository.save(request.body);
  }

  async remove(request: Request, response: Response, next: NextFunction) {
    let userToRemove = await this.itemRepository.findOne(request.params.id);
    await this.itemRepository.remove(userToRemove);
  }

}