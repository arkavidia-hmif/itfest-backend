

import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import { Checkout, CheckoutItem } from '../entity/Checkout'
import { Item } from '../entity/Item'
import { Inventory } from '../entity/Inventory'
import { responseGenerator } from "../utils/responseGenerator";
import { UserRole, User, Visitor } from "../entity/User";

export class CheckoutController {
    // private userRepository = getRepository(User);
    // private visitorRepository = getRepository(Visitor);
    // private checkoutItemRepository = getRepository(CheckoutItem);
    private checkoutRepository = getRepository(Checkout);
    private userRepository = getRepository(User);

    async getCheckout(request: Request, response: Response) {
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
            checkout = await this.checkoutRepository.find({ relations: ["items"] });
        }

        if(!checkout){
            return responseGenerator(response, 404, "not-found");
        }

        return responseGenerator(response, 200, "ok", checkout);
    }

    async createCheckout(request: Request, response: Response) {
        const { waContact, lineContact, address, isSent } = request.body;
        const items = request.body.items;
        const id = response.locals.auth.id;

        // items = [{
        //     item: id,
        //     quantity
        // }]

        if (!waContact && !lineContact) {
            return responseGenerator(response, 400, "no-fill-contact");
        }

        if (!items || items.length === 0 ) {
            return responseGenerator(response, 400, "no-item-selected");
        }

        try {
            await getConnection().transaction(async transactionManager => {
                const tmCheckoutRepository = transactionManager.getRepository(Checkout);
                const tmCheckoutItemRepository = transactionManager.getRepository(CheckoutItem);
                const tmItemRepository = transactionManager.getRepository(Item);
                const tmVisitorRepository = transactionManager.getRepository(Visitor);
                const tmInventoryRepository = transactionManager.getRepository(Inventory);

                let price = 0;
                let hasPhysical: boolean = false;
                const visitor = await tmVisitorRepository.findOne(id, { relations: ["userId"] })

                for (let i = 0; i < items.length; i++) {
                    const item = await tmItemRepository.findOne(items[i].id);
                    const invItem = await tmInventoryRepository.findOne({
                        where: {
                            item
                        }
                    })
                    // TODO: check & kurangi Inventory Item
                    if (invItem.qty < items[i].quantity) {
                        throw "insufficient-quantity";
                    }

                    // invItem.qty -= items[i].quantity;
                    // tmInventoryRepository.save(invItem);
                    transactionManager.decrement(Inventory, { item: item }, "qty", items[i].quantity);

                    price += item.price * items[i].quantity;

                    if(!hasPhysical){
                        hasPhysical = item.hasPhysical;
                    }
                }

                if (price > visitor.point) {
                    throw "insufficient-point";
                }

                // visitor.point -= price;
                // await tmVisitorRepository.save(visitor);
                transactionManager.decrement(Visitor, { id: id }, "point", price);

                const checkout = await tmCheckoutRepository.save({
                    waContact,
                    lineContact,
                    address,
                    isSent,
                    totalPrice: price
                });

                items.forEach(async item => {
                    await tmCheckoutItemRepository.save({
                        checkoutId: checkout.id,
                        item: item,
                        quantity: +item.quantity
                    })
                })

                if(!hasPhysical){
                    return responseGenerator(response, 200, "ok", { message: "item being send by email" })
                } else {
                    return responseGenerator(response, 200, "ok", { message: "item being prepared" })
                }
            })
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