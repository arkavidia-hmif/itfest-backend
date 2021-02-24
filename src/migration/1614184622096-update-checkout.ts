import { MigrationInterface, QueryRunner } from "typeorm";

export class updateCheckout1614184622096 implements MigrationInterface {
  name = 'updateCheckout1614184622096'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "checkout" DROP COLUMN "isSent"`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "address" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "waContact" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "address" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "lineContact" DROP DEFAULT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "address" SET DEFAULT '-'`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "address" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "waContact" SET DEFAULT '-'`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "lineContact" SET DEFAULT '-'`);
    await queryRunner.query(`ALTER TABLE "checkout" ADD "isSent" boolean NOT NULL DEFAULT false`);
  }

}
