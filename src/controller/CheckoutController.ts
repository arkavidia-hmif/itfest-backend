

import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";

import { Checkout, CheckoutItem } from '../entity/Checkout'
import { Item } from '../entity/Item'
import { Inventory } from '../entity/Inventory'
import { responseGenerator } from "../utils/responseGenerator";
import { User, Visitor } from "../entity/User";

export class CheckoutController {
    private userRepository = getRepository(User);
    private visitorRepository = getRepository(Visitor);
    private checkoutRepository = getRepository(Checkout);
    private checkoutItemRepository = getRepository(CheckoutItem);

    async getCheckout(request: Request, response: Response) {
        const id = request.params.id;

        let checkout;

        // TODO: Perlu add relationnya juga
        if (id) {
            checkout = await this.checkoutRepository.findOne(id);
        } else {
            checkout = await this.checkoutRepository.find();
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

        const visitor = await this.visitorRepository.findOne(id);

        try {
            await getConnection().transaction(async transactionManager => {
                const tmCheckoutRepository = transactionManager.getRepository(Checkout);
                const tmCheckoutItemRepository = transactionManager.getRepository(CheckoutItem);
                const tmItemRepository = transactionManager.getRepository(Item);
                const tmVisitorRepository = transactionManager.getRepository(Visitor);
                const tmInventoryRepository = transactionManager.getRepository(Inventory);

                let price = 0;
                const prices : number[] = []
                const itemsDB : Item[] = []
                let hasPhysical: boolean = false;
                
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
                    invItem.qty -= items[i].quantity;
                    tmInventoryRepository.save(invItem)

                    prices.push(item.price * items[i].quantity);
                    itemsDB.push(item);
                    price += prices[i];

                    if(!hasPhysical){
                        hasPhysical = item.hasPhysical;
                    }
                }

                if (price > visitor.point) {
                    throw "insufficient-point";
                }

                tmVisitorRepository.save({
                    userId: visitor.userId,
                    point: visitor.point - price
                });

                const checkout = await tmCheckoutRepository.save({
                    waContact,
                    lineContact,
                    address,
                    isSent,
                    totalPrice: price
                });

                for (let i = 0; i < items.length; i++) {
                    tmCheckoutItemRepository.save({
                        checkoutId: checkout.id,
                        itemId: itemsDB[i].id,
                        quantity: +items[i].quantity
                    })
                }

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