import { getRepository, getManager, createConnection, Connection } from "typeorm";

import { User } from '../entity/User';
import { UserSeed } from './user';

import { Game } from '../entity/Game';
import { GameSeed } from './game';

async function seedData(){
    try {
        const connection: Connection = await createConnection();

        const userRepository = getRepository(User);
        const gameRepository = getRepository(Game);

        await userRepository.save(UserSeed);
        console.log("user data successfully added");

        await gameRepository.save(GameSeed);
        console.log("game data successfully added");

    } catch (error){
        console.log(error.message)
    }
}

seedData();