import {MigrationInterface, QueryRunner} from "typeorm";

export class disableAutoVerified1614013651147 implements MigrationInterface {
    name = 'disableAutoVerified1614013651147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isVerified" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isVerified" SET DEFAULT true`);
    }

}
