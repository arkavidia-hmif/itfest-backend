import { getRepository, MigrationInterface, QueryRunner } from "typeorm";
import { GameSeed } from "../seed/game.seed";
import { UserSeed } from "../seed/user.seed";

export class InitMigration1604327413602 implements MigrationInterface {
    name = 'InitMigration1604327413602'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `user` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(255) NULL, `username` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `role` enum ('admin', 'tenant', 'visitor') NOT NULL DEFAULT 'visitor', `salt` varchar(255) NULL, `password` varchar(255) NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_e12875dfb3b1d92d7d7c5377e2` (`email`), UNIQUE INDEX `IDX_78a916df40e02a9deb1c4b75ed` (`username`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `visitor` (`dob` datetime NULL, `gender` int NULL, `interest` text NULL, `point` int NOT NULL DEFAULT 0, `filled` tinyint NOT NULL DEFAULT 0, `userId` int NOT NULL, UNIQUE INDEX `REL_57938638c006099d5fb86c1b1e` (`userId`), PRIMARY KEY (`userId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `tenant` (`point` int NOT NULL, `userId` int NOT NULL, UNIQUE INDEX `REL_a6719c3ba1ea75a8f255e3e5c7` (`userId`), PRIMARY KEY (`userId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `feedback` (`id` int NOT NULL AUTO_INCREMENT, `rating` int NOT NULL DEFAULT 0, `remark` varchar(255) NOT NULL DEFAULT '', `comment` varchar(255) NOT NULL DEFAULT '', `rated` tinyint NOT NULL DEFAULT 0, `fromVisitor` int NOT NULL, `tenantReviewed` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `game` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `difficulty` enum ('1', '2', '3') NOT NULL, `type` enum ('1', '2') NOT NULL, `problem` varchar(255) NOT NULL, `answer` varchar(255) NOT NULL, `tenantUserId` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `game_state` (`id` int NOT NULL AUTO_INCREMENT, `isSubmit` tinyint NOT NULL, `startTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `submitTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `gameId` int NOT NULL, `userId` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `item` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `ownerId` int NOT NULL, `price` int NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `inventory` (`id` int NOT NULL AUTO_INCREMENT, `qty` int NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `itemId` int NULL, UNIQUE INDEX `REL_6227c61eff466680f9bb993330` (`itemId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `scoreboard` (`id` int NOT NULL AUTO_INCREMENT, `score` int NOT NULL DEFAULT 0, `playedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `gameId` int NOT NULL, `userId` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `transaction` (`id` int NOT NULL AUTO_INCREMENT, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `amount` int NOT NULL, `type` enum ('give', 'play', 'redeem') NOT NULL DEFAULT 'give', `fromId` int NOT NULL, `toId` int NOT NULL, `itemId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `voucher` (`id` int NOT NULL AUTO_INCREMENT, `code` varchar(6) NOT NULL, UNIQUE INDEX `IDX_73e3d2a7719851716e94083698` (`code`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `visitor` ADD CONSTRAINT `FK_57938638c006099d5fb86c1b1ec` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `tenant` ADD CONSTRAINT `FK_a6719c3ba1ea75a8f255e3e5c7d` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `feedback` ADD CONSTRAINT `FK_a9c465b17d90689ca5edf45936f` FOREIGN KEY (`fromVisitor`) REFERENCES `visitor`(`userId`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `feedback` ADD CONSTRAINT `FK_ffed805fd961546ffc81b079ec8` FOREIGN KEY (`tenantReviewed`) REFERENCES `tenant`(`userId`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `game` ADD CONSTRAINT `FK_b65997274fe1041ff6af7d29316` FOREIGN KEY (`tenantUserId`) REFERENCES `tenant`(`userId`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `game_state` ADD CONSTRAINT `FK_dc92896f0725c0cf0127b50eb92` FOREIGN KEY (`gameId`) REFERENCES `game`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `game_state` ADD CONSTRAINT `FK_5ad543c24498e71cd9ed90d4ca4` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `item` ADD CONSTRAINT `FK_3b030ef7f2840a721547a3c492e` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `inventory` ADD CONSTRAINT `FK_6227c61eff466680f9bb9933305` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `scoreboard` ADD CONSTRAINT `FK_9a70f9182877017c49ac01b0702` FOREIGN KEY (`gameId`) REFERENCES `game`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `scoreboard` ADD CONSTRAINT `FK_8429d705831655518914f3a45fd` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `transaction` ADD CONSTRAINT `FK_ac3d6711c8adf322a76c0d1a227` FOREIGN KEY (`fromId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `transaction` ADD CONSTRAINT `FK_a02bf62a801914225fc2cad7ff7` FOREIGN KEY (`toId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `transaction` ADD CONSTRAINT `FK_fae09ef9b1765a71a91475f8ba7` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);

        await getRepository("user").save(UserSeed);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `transaction` DROP FOREIGN KEY `FK_fae09ef9b1765a71a91475f8ba7`", undefined);
        await queryRunner.query("ALTER TABLE `transaction` DROP FOREIGN KEY `FK_a02bf62a801914225fc2cad7ff7`", undefined);
        await queryRunner.query("ALTER TABLE `transaction` DROP FOREIGN KEY `FK_ac3d6711c8adf322a76c0d1a227`", undefined);
        await queryRunner.query("ALTER TABLE `scoreboard` DROP FOREIGN KEY `FK_8429d705831655518914f3a45fd`", undefined);
        await queryRunner.query("ALTER TABLE `scoreboard` DROP FOREIGN KEY `FK_9a70f9182877017c49ac01b0702`", undefined);
        await queryRunner.query("ALTER TABLE `inventory` DROP FOREIGN KEY `FK_6227c61eff466680f9bb9933305`", undefined);
        await queryRunner.query("ALTER TABLE `item` DROP FOREIGN KEY `FK_3b030ef7f2840a721547a3c492e`", undefined);
        await queryRunner.query("ALTER TABLE `game_state` DROP FOREIGN KEY `FK_5ad543c24498e71cd9ed90d4ca4`", undefined);
        await queryRunner.query("ALTER TABLE `game_state` DROP FOREIGN KEY `FK_dc92896f0725c0cf0127b50eb92`", undefined);
        await queryRunner.query("ALTER TABLE `game` DROP FOREIGN KEY `FK_b65997274fe1041ff6af7d29316`", undefined);
        await queryRunner.query("ALTER TABLE `feedback` DROP FOREIGN KEY `FK_ffed805fd961546ffc81b079ec8`", undefined);
        await queryRunner.query("ALTER TABLE `feedback` DROP FOREIGN KEY `FK_a9c465b17d90689ca5edf45936f`", undefined);
        await queryRunner.query("ALTER TABLE `tenant` DROP FOREIGN KEY `FK_a6719c3ba1ea75a8f255e3e5c7d`", undefined);
        await queryRunner.query("ALTER TABLE `visitor` DROP FOREIGN KEY `FK_57938638c006099d5fb86c1b1ec`", undefined);
        await queryRunner.query("DROP INDEX `IDX_73e3d2a7719851716e94083698` ON `voucher`", undefined);
        await queryRunner.query("DROP TABLE `voucher`", undefined);
        await queryRunner.query("DROP TABLE `transaction`", undefined);
        await queryRunner.query("DROP TABLE `scoreboard`", undefined);
        await queryRunner.query("DROP INDEX `REL_6227c61eff466680f9bb993330` ON `inventory`", undefined);
        await queryRunner.query("DROP TABLE `inventory`", undefined);
        await queryRunner.query("DROP TABLE `item`", undefined);
        await queryRunner.query("DROP TABLE `game_state`", undefined);
        await queryRunner.query("DROP TABLE `game`", undefined);
        await queryRunner.query("DROP TABLE `feedback`", undefined);
        await queryRunner.query("DROP INDEX `REL_a6719c3ba1ea75a8f255e3e5c7` ON `tenant`", undefined);
        await queryRunner.query("DROP TABLE `tenant`", undefined);
        await queryRunner.query("DROP INDEX `REL_57938638c006099d5fb86c1b1e` ON `visitor`", undefined);
        await queryRunner.query("DROP TABLE `visitor`", undefined);
        await queryRunner.query("DROP INDEX `IDX_78a916df40e02a9deb1c4b75ed` ON `user`", undefined);
        await queryRunner.query("DROP INDEX `IDX_e12875dfb3b1d92d7d7c5377e2` ON `user`", undefined);
        await queryRunner.query("DROP TABLE `user`", undefined);
    }

}
