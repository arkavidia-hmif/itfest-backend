import { Request, Response } from "express";
import { getRepository, getConnection } from "typeorm";

import { Inventory } from "../entity/Inventory";
import { Item } from "../entity/Item";
import { User, UserRole, Visitor } from "../entity/User";
import { responseGenerator } from "../utils/responseGenerator";
import { Transaction, TransactionType } from "../entity/Transaction";
import { globalSocket } from "../routes/socket";

export class InventoryController {

  private inventoryRepository = getRepository(Inventory);
  private transactionRepository = getRepository(Transaction);
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


  async listTenantWithItem(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 100;

    try {
      const [userArray, userTotal] = await this.userRepository.findAndCount({
        where: [
          {
            role: UserRole.ADMIN
          },
          {
            role: UserRole.TENANT
          }
        ],
        take: itemPerPage,
        skip: (page - 1) * itemPerPage,
        select: ["id", "name"]
      });

      const tenantIdArray = userArray.map((entry) => {
        return {
          owner: entry.id
        };
      });

      const [itemArray, itemTotal] = await this.itemRepository.findAndCount({
        where: tenantIdArray,
        select: ["id"],
      });

      const itemIdArray = itemArray.map((entry) => {
        return {
          item: entry.id
        };
      });

      const [inventoryArray, inventoryTotal] = await this.inventoryRepository.findAndCount({
        where: itemIdArray,
        relations: ["item", "item.owner"]
      });

      const finalArray = userArray.map((entry) => {
        const filteredInventory = inventoryArray.filter((inventory) => (+inventory.item.owner.id) === entry.id);
        const userInventory = filteredInventory.map((inventory) => {
          return {
            id: inventory.item.id,
            name: inventory.item.name,
            price: inventory.item.price,
            qty: inventory.qty,
            hasPhysical: inventory.item.hasPhysical,
            imageUrl: inventory.item.imageUrl
          };
        });
        
        return {
          id: entry.id,
          name: entry.name,
          items: userInventory
        };
      });
  
      return responseGenerator(response, 200, "ok", {
        array: finalArray,
        page,
        itemPerPage,
        total: userTotal
      });
    } catch (err) {
      return responseGenerator(response, 500, "err");

    }
  }

  async createItem(request: Request, response: Response) {
    const { name, price, qty, hasPhysical, imageUrl } = request.body;
    let ownerId = response.locals.auth.id;
    const userRole = response.locals.auth.role;

    if (userRole === UserRole.ADMIN) {
      ownerId = request.body.ownerId || ownerId;
    }

    const owner = await this.userRepository.findOne(ownerId);

    if (!owner) {
      return responseGenerator(response, 400, "owner-not-found");
    }

    const existingItem = await this.itemRepository.findOne({
      where: {
        name,
        owner,
      }
    });

    if (existingItem) {
      return responseGenerator(response, 400, "item-exists");
    }

    try {
      const newItem = await this.itemRepository.save({
        name,
        price,
        owner,
        hasPhysical,
        imageUrl
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
    const { name, price, qty, hasPhysical, imageUrl } = request.body;

    const item = await this.itemRepository.findOne(id);

    if (!item) {
      return responseGenerator(response, 404, "item-not-found");
    }

    if (response.locals.auth.role !== UserRole.ADMIN && item.owner.id !== response.locals.auth.id) {
      return responseGenerator(response, 403, "forbidden");
    }

    const inventory = await this.inventoryRepository.findOne({ item: item });

    try {
      if (qty) {
        inventory.qty = qty;
        await this.inventoryRepository.save(inventory);
      }

      if (name || price || hasPhysical || imageUrl) {
        item.name = name || item.name;
        item.price = price || item.price;
        item.hasPhysical = hasPhysical || item.hasPhysical;
        item.imageUrl = imageUrl || item.imageUrl;
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

    if (response.locals.auth.role !== UserRole.ADMIN && item.owner !== response.locals.auth.id) {
      return responseGenerator(response, 403, "forbidden");
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

  async redeem(request: Request, response: Response) {
    const visitorId = response.locals.auth.id;
    const shopId = request.body.shopId;

    const itemId = request.body.item;
    const amount = request.body.amount || 1;

    try {
      await getConnection().transaction(async transactionManager => {

        const tmTransactionRepository = transactionManager.getRepository(Transaction);
        const tmInventoryRepository = transactionManager.getRepository(Inventory);

        const visitorUser = await transactionManager.findOneOrFail(Visitor, visitorId);
        const inventory = await tmInventoryRepository.findOne({
          where: {
            item: itemId
          },
          relations: ["item"]
        });

        const item = inventory.item;

        if (!item) {
          throw "item-not-found";
        }

        if (inventory.qty < amount) {
          throw "not-enough-qty";
        }
        inventory.qty -= amount;

        if (visitorUser.point < (item.price * amount)) {
          throw "not-enough-point";
        }

        for (let i = 0; i < amount; i++) {
          await tmTransactionRepository.save({
            from: visitorUser.userId,
            to: shopId,
            amount: item.price,
            type: TransactionType.REDEEM,
            item: item
          });
        }

        visitorUser.point -= (item.price * amount);

        await transactionManager.save(Visitor, visitorUser);
        await tmInventoryRepository.save(inventory);

        if (globalSocket[visitorId]) {
          globalSocket[visitorId].emit("transaction", {
            type: "redeem",
            item: {
              id: item.id,
              name: amount > 1 ? `${amount}x${item.name}` : item.name,
            },
            amount: (item.price * amount)
          });
        }
      });
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else if (error.name === "EntityNotFound") {
        return responseGenerator(response, 404, "user-not-found");
      } else {
        return responseGenerator(response, 500, "unknown-error", error);
      }
    }

    return responseGenerator(response, 200, "ok");
  }

}

