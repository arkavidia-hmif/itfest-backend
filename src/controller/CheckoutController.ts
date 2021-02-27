

import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import { Checkout, CheckoutItem } from "../entity/Checkout";
import { Inventory } from "../entity/Inventory";
import { responseGenerator } from "../utils/responseGenerator";
import { UserRole, User, Visitor } from "../entity/User";

export class CheckoutController {
  private checkoutRepository = getRepository(Checkout);
  private userRepository = getRepository(User);

  async getCheckout(request: Request, response: Response): Promise<void> {
    const userId = response.locals.auth.id;
    const id = request.params.id;

    const user = await this.userRepository.findOne(userId);
    let checkout;

    if (id) {
      checkout = await this.checkoutRepository.findOne(id, { relations: ["items"] });
    } else {
      if (user.role !== UserRole.ADMIN) {
        return responseGenerator(response, 403, "forbidden");
      }
      const page = parseInt(request.query.page, 10) || 1;
      const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

      checkout = await this.checkoutRepository.findAndCount({
        take: itemPerPage,
        skip: (page - 1) * itemPerPage,
        relations: ["items"]
      });
    }

    if (!checkout) {
      return responseGenerator(response, 404, "not-found");
    }

    return responseGenerator(response, 200, "ok", checkout);
  }

  async createCheckout(request: Request, response: Response): Promise<void> {
    const id = response.locals.auth.id;
    const { waContact = id, lineContact, address, items: orderItems } = request.body;

    if (orderItems.length === 0) {
      return responseGenerator(response, 400, "no-item-selected");
    }

    try {
      await getConnection().transaction(async transactionManager => {
        const tmCheckoutRepository = transactionManager.getRepository(Checkout);
        const tmCheckoutItemRepository = transactionManager.getRepository(CheckoutItem);
        const tmVisitorRepository = transactionManager.getRepository(Visitor);
        const tmInventoryRepository = transactionManager.getRepository(Inventory);

        const visitor = await tmVisitorRepository.findOne(id, { relations: ["userId"] });

        const inventoryFromDb = await tmInventoryRepository.find({
          where: [
            ...orderItems.map(el => ({ item: el.id }))
          ], relations: ["item"]
        });

        if (inventoryFromDb.length !== orderItems.length) {
          return responseGenerator(response, 404, "item-not-found");
        }

        const itemFromDb = inventoryFromDb.map(el => el.item);
        const hasPhysical = itemFromDb.some(el => el.hasPhysical);

        if (hasPhysical && !(waContact && lineContact)) {
          return responseGenerator(response, 404, "incomplete-contact");
        }

        const inventoryMap: Record<number, Inventory> = {};
        for (const entry of inventoryFromDb) {
          inventoryMap[entry.item.id] = entry;
        }

        let totalPrice = 0;

        for (const order of orderItems) {
          totalPrice += order.qty * inventoryMap[order.id].item.price;

          if (order.qty > inventoryMap[order.id].qty) {
            return responseGenerator(response, 400, "insufficient-quantity");
          }
        }

        if (totalPrice > visitor.point) {
          return responseGenerator(response, 400, "insufficient-point");
        }

        // Start processing
        const checkout = await tmCheckoutRepository.save({
          waContact,
          lineContact,
          address,
          totalPrice
        });

        for (const order of orderItems) {
          await transactionManager.decrement(
            Inventory,
            { item: inventoryMap[order.id].item },
            "qty",
            order.qty
          );
          await tmCheckoutItemRepository.save({
            checkout: checkout,
            item: inventoryMap[order.id].item,
            quantity: order.qty
          });
        }

        await transactionManager.decrement(Visitor, { userId: id }, "point", totalPrice);

        return responseGenerator(response, 200, "ok");
      });
    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else {
        console.error(error);
        return responseGenerator(response, 500, "unknown-error");
      }
    }
  }
}