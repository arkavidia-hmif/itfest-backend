import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Inventory } from "../entity/Inventory";

export class InventoryController {

  private Inventory = getRepository(Inventory);

  async all(request: Request, response: Response, next: NextFunction) {
    return this.Inventory.find();
  }

  async one(request: Request, response: Response, next: NextFunction) {
    return this.Inventory.findOne(request.params.id);
  }

  async save(request: Request, response: Response, next: NextFunction) {
    return this.Inventory.save(request.body);
  }

  async remove(request: Request, response: Response, next: NextFunction) {
    let userToRemove = await this.Inventory.findOne(request.params.id);
    await this.Inventory.remove(userToRemove);
  }

}