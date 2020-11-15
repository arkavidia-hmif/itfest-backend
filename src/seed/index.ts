import { getRepository, getManager, createConnection, Connection } from "typeorm";

import { User, Tenant, Visitor } from '../entity/User';
import { UserSeed } from './user';

import { Game } from '../entity/Game';
import { GameSeed } from './game';

import { TenantSeed } from './tenant';
import { VisitorSeed } from './visitor';


async function seedData(){
    const connection: Connection = await createConnection();

    const userRepository = getRepository(User);
    const tenantRepository = getRepository(Tenant);
    const visitorRepository = getRepository(Visitor);
    const gameRepository = getRepository(Game);

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
}

seedData();