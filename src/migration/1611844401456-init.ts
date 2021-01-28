import {MigrationInterface, QueryRunner} from "typeorm";

export class init1611844401456 implements MigrationInterface {
    name = 'init1611844401456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('admin', 'tenant', 'visitor')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying, "username" character varying NOT NULL, "name" character varying NOT NULL, "role" "user_role_enum" NOT NULL DEFAULT 'visitor', "salt" character varying, "password" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "visitor" ("dob" TIMESTAMP, "gender" integer, "interest" text, "point" integer NOT NULL DEFAULT '0', "filled" boolean NOT NULL DEFAULT false, "telp" character varying, "institute" character varying, "userId" integer NOT NULL, CONSTRAINT "REL_57938638c006099d5fb86c1b1e" UNIQUE ("userId"), CONSTRAINT "CHK_b44c4cdb8d424f9708d087999f" CHECK ((point >= 0)), CONSTRAINT "PK_57938638c006099d5fb86c1b1ec" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE TABLE "tenant" ("point" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "REL_a6719c3ba1ea75a8f255e3e5c7" UNIQUE ("userId"), CONSTRAINT "CHK_e0d89066b4d90a2467a0a681c2" CHECK ((point >= 0)), CONSTRAINT "PK_a6719c3ba1ea75a8f255e3e5c7d" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE TABLE "item" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" integer NOT NULL, "imageUrl" character varying NOT NULL DEFAULT '-', "hasPhysical" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" integer, CONSTRAINT "CHK_f215c2586f923eed4148616e09" CHECK ((price >= 0)), CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "checkout" ("id" SERIAL NOT NULL, "lineContact" character varying NOT NULL DEFAULT '-', "waContact" character varying NOT NULL DEFAULT '-', "isSent" boolean NOT NULL DEFAULT false, "address" character varying NOT NULL DEFAULT '-', "totalPrice" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_c3c52ebf395ba358759b1111ac1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "checkout_item" ("id" SERIAL NOT NULL, "checkoutId" integer NOT NULL, "quantity" integer NOT NULL, "checkoutIdId" integer, "itemId" integer NOT NULL, CONSTRAINT "CHK_ffd6094982eec660bd1ab19cf9" CHECK ((quantity >= 0)), CONSTRAINT "PK_b8fc13ec690d140c08b642f8746" PRIMARY KEY ("id", "checkoutId"))`);
        await queryRunner.query(`CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "rating" integer NOT NULL DEFAULT '0', "remark" character varying NOT NULL DEFAULT '', "comment" character varying NOT NULL DEFAULT '', "rated" boolean NOT NULL DEFAULT false, "fromVisitor" integer NOT NULL, "tenantReviewed" integer NOT NULL, CONSTRAINT "CHK_15fd4b18fd1251d7c6a3e547fb" CHECK ((rating >= 0)), CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "game_difficulty_enum" AS ENUM('1', '2', '3')`);
        await queryRunner.query(`CREATE TYPE "game_type_enum" AS ENUM('1', '2')`);
        await queryRunner.query(`CREATE TABLE "game" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "difficulty" "game_difficulty_enum" NOT NULL, "type" "game_type_enum" NOT NULL, "problem" text NOT NULL, "answer" text NOT NULL, "tenantUserId" integer NOT NULL, CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game_state" ("id" SERIAL NOT NULL, "isSubmit" boolean NOT NULL, "startTime" TIMESTAMP NOT NULL DEFAULT now(), "submitTime" TIMESTAMP, "gameId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_e7b8f9fb87d56841a7aaa284f52" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "global_scoreboard" ("userId" SERIAL NOT NULL, "score" integer NOT NULL DEFAULT 0, "lastUpdated" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_403799da51e60ca189beab7fa79" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE TABLE "inventory" ("id" SERIAL NOT NULL, "qty" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "itemId" integer, CONSTRAINT "REL_6227c61eff466680f9bb993330" UNIQUE ("itemId"), CONSTRAINT "CHK_0fd66dbf416f0f775dc540b964" CHECK ((qty >= 0)), CONSTRAINT "PK_82aa5da437c5bbfb80703b08309" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "scoreboard" ("id" SERIAL NOT NULL, "score" integer NOT NULL DEFAULT 0, "playedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "gameId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_ee9f6e819e7a4a11d569b54c060" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shop" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" integer NOT NULL, CONSTRAINT "PK_ad47b7c6121fe31cb4b05438e44" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "transaction_type_enum" AS ENUM('give', 'play', 'redeem')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "amount" integer NOT NULL, "type" "transaction_type_enum" NOT NULL DEFAULT 'give', "fromId" integer NOT NULL, "toId" integer NOT NULL, "itemId" integer, CONSTRAINT "CHK_69b4fc4496548c80a24af6c8aa" CHECK ((amount >= 0)), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "voucher" ("id" SERIAL NOT NULL, "code" character varying(6) NOT NULL, CONSTRAINT "UQ_73e3d2a7719851716e940836980" UNIQUE ("code"), CONSTRAINT "PK_677ae75f380e81c2f103a57ffaf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "visitor" ADD CONSTRAINT "FK_57938638c006099d5fb86c1b1ec" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant" ADD CONSTRAINT "FK_a6719c3ba1ea75a8f255e3e5c7d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_3b030ef7f2840a721547a3c492e" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "checkout_item" ADD CONSTRAINT "FK_d164aa4523bdb18e4d9c7f89657" FOREIGN KEY ("checkoutIdId") REFERENCES "checkout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "checkout_item" ADD CONSTRAINT "FK_3f0b81123d797dad1f9c9fdd589" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedback" ADD CONSTRAINT "FK_a9c465b17d90689ca5edf45936f" FOREIGN KEY ("fromVisitor") REFERENCES "visitor"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedback" ADD CONSTRAINT "FK_ffed805fd961546ffc81b079ec8" FOREIGN KEY ("tenantReviewed") REFERENCES "tenant"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_b65997274fe1041ff6af7d29316" FOREIGN KEY ("tenantUserId") REFERENCES "tenant"("userId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_state" ADD CONSTRAINT "FK_dc92896f0725c0cf0127b50eb92" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_state" ADD CONSTRAINT "FK_5ad543c24498e71cd9ed90d4ca4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD CONSTRAINT "FK_6227c61eff466680f9bb9933305" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scoreboard" ADD CONSTRAINT "FK_9a70f9182877017c49ac01b0702" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scoreboard" ADD CONSTRAINT "FK_8429d705831655518914f3a45fd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shop" ADD CONSTRAINT "FK_28fb7269a26c4e112e151e46f50" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_ac3d6711c8adf322a76c0d1a227" FOREIGN KEY ("fromId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_a02bf62a801914225fc2cad7ff7" FOREIGN KEY ("toId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_fae09ef9b1765a71a91475f8ba7" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_fae09ef9b1765a71a91475f8ba7"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_a02bf62a801914225fc2cad7ff7"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_ac3d6711c8adf322a76c0d1a227"`);
        await queryRunner.query(`ALTER TABLE "shop" DROP CONSTRAINT "FK_28fb7269a26c4e112e151e46f50"`);
        await queryRunner.query(`ALTER TABLE "scoreboard" DROP CONSTRAINT "FK_8429d705831655518914f3a45fd"`);
        await queryRunner.query(`ALTER TABLE "scoreboard" DROP CONSTRAINT "FK_9a70f9182877017c49ac01b0702"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP CONSTRAINT "FK_6227c61eff466680f9bb9933305"`);
        await queryRunner.query(`ALTER TABLE "game_state" DROP CONSTRAINT "FK_5ad543c24498e71cd9ed90d4ca4"`);
        await queryRunner.query(`ALTER TABLE "game_state" DROP CONSTRAINT "FK_dc92896f0725c0cf0127b50eb92"`);
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_b65997274fe1041ff6af7d29316"`);
        await queryRunner.query(`ALTER TABLE "feedback" DROP CONSTRAINT "FK_ffed805fd961546ffc81b079ec8"`);
        await queryRunner.query(`ALTER TABLE "feedback" DROP CONSTRAINT "FK_a9c465b17d90689ca5edf45936f"`);
        await queryRunner.query(`ALTER TABLE "checkout_item" DROP CONSTRAINT "FK_3f0b81123d797dad1f9c9fdd589"`);
        await queryRunner.query(`ALTER TABLE "checkout_item" DROP CONSTRAINT "FK_d164aa4523bdb18e4d9c7f89657"`);
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_3b030ef7f2840a721547a3c492e"`);
        await queryRunner.query(`ALTER TABLE "tenant" DROP CONSTRAINT "FK_a6719c3ba1ea75a8f255e3e5c7d"`);
        await queryRunner.query(`ALTER TABLE "visitor" DROP CONSTRAINT "FK_57938638c006099d5fb86c1b1ec"`);
        await queryRunner.query(`DROP TABLE "voucher"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "shop"`);
        await queryRunner.query(`DROP TABLE "scoreboard"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`DROP TABLE "global_scoreboard"`);
        await queryRunner.query(`DROP TABLE "game_state"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TYPE "game_type_enum"`);
        await queryRunner.query(`DROP TYPE "game_difficulty_enum"`);
        await queryRunner.query(`DROP TABLE "feedback"`);
        await queryRunner.query(`DROP TABLE "checkout_item"`);
        await queryRunner.query(`DROP TABLE "checkout"`);
        await queryRunner.query(`DROP TABLE "item"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TABLE "visitor"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "user_role_enum"`);
    }

}
