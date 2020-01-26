import { Request, Response } from "express";
import { getRepository } from "typeorm";

import { Inventory } from "../entity/Inventory";
import { Item } from "../entity/Item";
import { User, UserRole } from "../entity/User";
import { responseGenerator } from "../utils/responseGenerator";

export class InventoryController {

  private inventoryRepository = getRepository(Inventory);
  private itemRepository = getRepository(Item);
  private userRepository = getRepository(User);

  async listItem(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    const [rawItem, total] = await this.inventoryRepository.findAndCount({
      take: itemPerPage,
      skip: (page - 1) * itemPerPage,
      relations: ["item"]
    });

    const item = rawItem.map((entry) => {
      delete entry.id;
      return entry;
    });

    return responseGenerator(response, 200, "ok", {
      array: item,
      page,
      itemPerPage,
      total
    });
  }

  async createItem(request: Request, response: Response) {
    const { name, price, qty } = request.body;
    let ownerId = response.locals.auth.id;
    const userRole = response.locals.auth.id;

    if (userRole === UserRole.ADMIN) {
      ownerId = request.body.ownerId || ownerId;
    }

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
    const inventory = await this.inventoryRepository.findOne({ item }, { select: ["qty", "createdAt", "updatedAt"] });

    if (item && inventory) {
      inventory.item = item;
      return responseGenerator(response, 200, "ok", inventory);
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
        inventory.qty = qty;
        await this.inventoryRepository.save(inventory);
      }

      if (name || price) {
        item.name = name || item.name;
        item.price = price || item.price;
        await this.itemRepository.save(item);
      }
    } catch (error) {
      console.error(error);
      return responseGenerator(response, 500, "unknown-error");

    }

    return responseGenerator(response, 200, "ok");
  }

  async deleteItem(request: Request, response: Response) {
    const id = request.params.id;

    const item = await this.itemRepository.findOne(id);

    if (!item) {
      return responseGenerator(response, 404, "item-not-found");
    }

    try {
      await this.inventoryRepository.delete({ item });
      await this.itemRepository.delete(item.id);
    } catch (error) {
      console.error(error);
      return responseGenerator(response, 500, "unknown-error");
    }

    return responseGenerator(response, 200, "ok");
  }

}

