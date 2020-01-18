import { Request, Response } from "express";
import { getRepository } from "typeorm";

import { Inventory } from "../entity/Inventory";
import { Item } from "../entity/Item";
import { User } from "../entity/User";
import { responseGenerator } from "../utils/responseGenerator";

export class InventoryController {

  private inventoryRepository = getRepository(Inventory);
  private itemRepository = getRepository(Item);
  private userRepository = getRepository(User);

  async listItem(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    const [item, total] = await this.inventoryRepository.findAndCount({
      take: itemPerPage,
      skip: (page - 1) * itemPerPage
    });

    console.log(item, total);

    return responseGenerator(response, 200, "ok");
  }

  async createItem(request: Request, response: Response) {
    const { name, price, qty } = request.body;
    const ownerId = request.body.ownerId || response.locals.auth.id;

    const owner = await this.userRepository.findOne(ownerId);

    if (!owner) {
      return responseGenerator(response, 400, "owner-not-found")
    }

    const existingItem = await this.itemRepository.findOne({ name });

    if (existingItem) {
      return responseGenerator(response, 400, "item-exists");
    }

    try {
      const newItem = await this.itemRepository.save({
        name,
        price,
        owner
      });

      console.log(newItem);

      await this.inventoryRepository.save({
        item: newItem,
        qty
      });
    } catch (error) {
      console.error(error);
      return responseGenerator(response, 500, "unknown-error");
    }

    return responseGenerator(response, 200, "ok");

  }

  async getItem(request: Request, response: Response) {
    const id = request.params.id;

    const item = await this.itemRepository.findOne(id);

    if (item) {
      return responseGenerator(response, 200, "ok", item);
    } else {
      return responseGenerator(response, 404, "item-not-found");
    }
  }

  async editItem(request: Request, response: Response) {
    const id = request.params.id;
    const { name, price, qty } = request.body;

    const item = await this.itemRepository.findOne(id);

    if (!item) {
      return responseGenerator(response, 404, "item-not-found");
    }

    const inventory = await this.inventoryRepository.findOne({ item: item })

    try {
      if (qty) {
        await this.inventoryRepository.update(inventory.id, {
          qty
        });
      }

      if (name || price) {
        await this.itemRepository.update(item.id, {
          name,
          price
        })
      }
    } catch (error) {
      console.error(error);
      return responseGenerator(response, 500, "unknown-error");

    }

    return responseGenerator(response, 200, "ok");
  }

}