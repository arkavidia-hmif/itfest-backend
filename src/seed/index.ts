import { getRepository, getManager, createConnection, Connection } from "typeorm";

import { User, Tenant, Visitor } from '../entity/User';
import { UserSeed } from './user';

import { Game } from '../entity/Game';
import { GameSeed } from './game';

import { Item } from '../entity/Item';
import { ItemSeed } from './item';

import { Inventory } from '../entity/Inventory';
import { InventorySeed } from './inventory';

import { Feedback } from '../entity/Feedback';
import { FeedbackSeed } from './feedback';

import { TenantSeed } from './tenant';
import { VisitorSeed } from './visitor';

import { Scoreboard } from '../entity/Scoreboard';
import { ScoreboardSeed } from './scoreboard';

import { GlobalScoreboard } from '../entity/GlobalScoreboard';
import { GlobalScoreboardSeed } from './globalScoreboard';

import { Checkout, CheckoutItem } from '../entity/Checkout';
import { CheckoutSeed, CheckoutItemSeed } from './checkout';

import { exit } from "process";


async function seedData(){
    const connection: Connection = await createConnection();

    const userRepository = getRepository(User);
    const tenantRepository = getRepository(Tenant);
    const visitorRepository = getRepository(Visitor);
    const gameRepository = getRepository(Game);
    const feedbackRepository = getRepository(Feedback);
    const itemRepository = getRepository(Item);
    const inventoryRepository = getRepository(Inventory);
    const scoreboardRepository = getRepository(Scoreboard);
    const globalScoreboardRepository = getRepository(GlobalScoreboard);
    const checkoutRepository = getRepository(Checkout);
    const checkoutItemRepository = getRepository(CheckoutItem);

    await userRepository.save(UserSeed)
            .then(user => {
                console.log("user data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await tenantRepository.save(TenantSeed)
            .then(user => {
                console.log("tenant data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await visitorRepository.save(VisitorSeed)
            .then(visitor => {
                console.log("visitor data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await gameRepository.save(GameSeed)
            .then(game => {
                console.log("game data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await globalScoreboardRepository.save(GlobalScoreboardSeed)
            .then(gsc => {
                console.log("global scoreboard data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await scoreboardRepository.save(ScoreboardSeed)
            .then(sc => {
                console.log("scoreboard data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await itemRepository.save(ItemSeed)
            .then(sc => {
                console.log("item data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await inventoryRepository.save(InventorySeed)
            .then(sc => {
                console.log("inventory data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await checkoutRepository.save(CheckoutSeed)
            .then(sc => {
                console.log("checkout data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });

    await checkoutItemRepository.save(CheckoutItemSeed)
            .then(sc => {
                console.log("checkout-item data successfully added");
            })
            .catch(err => {
                console.log(err.message)
            });    

    exit(0);
}

seedData();